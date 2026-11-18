/**
 * Серверные действия администратора/модератора.
 * Двойная проверка прав: proxy.ts + requireStaff() в каждом действии.
 */
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { setSetting } from "@/lib/settings";
import { categoryFormSchema } from "@/lib/validations";

export interface AdminFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

interface StaffContext {
  userId: string;
  role: "ADMIN" | "MODERATOR";
}

async function requireStaff(): Promise<StaffContext> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) {
    throw new Error("FORBIDDEN");
  }
  return { userId: session.user.id, role };
}

async function requireAdmin(): Promise<StaffContext> {
  const ctx = await requireStaff();
  if (ctx.role !== "ADMIN") throw new Error("FORBIDDEN");
  return ctx;
}

async function ipAddress(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

async function audit(
  userId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, targetType, targetId, metadata: metadata as object | undefined, ip: await ipAddress() },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
}

// ── Разделы форума ────────────────────────────────────────────────────────

const RESERVED_SLUGS = new Set(["new", "rules", "search", "topic", "api"]);

export async function createCategoryAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const ctx = await requireStaff();
  const parsed = categoryFormSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    icon: String(formData.get("icon") ?? "MessagesSquare"),
    position: formData.get("position"),
    premiumOnly: formData.get("premiumOnly") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }
  if (RESERVED_SLUGS.has(parsed.data.slug)) {
    return { status: "error", message: `Слаг «${parsed.data.slug}» зарезервирован системой.` };
  }

  const exists = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return { status: "error", message: "Раздел с таким slug уже есть." };

  await prisma.category.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon,
      position: parsed.data.position,
      premiumOnly: parsed.data.premiumOnly,
    },
  });
  await audit(ctx.userId, "admin.category_create", "CATEGORY", parsed.data.slug);
  revalidatePath("/admin/categories");
  revalidatePath("/forum");
  return { status: "success", message: `Раздел «${parsed.data.name}» создан.` };
}

export async function updateCategoryAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const ctx = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Не указан раздел." };

  const parsed = categoryFormSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    icon: String(formData.get("icon") ?? "MessagesSquare"),
    position: formData.get("position"),
    premiumOnly: formData.get("premiumOnly") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const conflict = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
    select: { id: true },
  });
  if (conflict) return { status: "error", message: "Этот slug занят другим разделом." };

  await prisma.category.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon: parsed.data.icon,
      position: parsed.data.position,
      premiumOnly: parsed.data.premiumOnly,
    },
  });
  await audit(ctx.userId, "admin.category_update", "CATEGORY", parsed.data.slug);
  revalidatePath("/admin/categories");
  revalidatePath("/forum");
  return { status: "success", message: "Раздел сохранён." };
}

export async function deleteCategoryAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const ctx = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Не указан раздел." };

  const topics = await prisma.topic.count({ where: { categoryId: id } });
  if (topics > 0) {
    return {
      status: "error",
      message: `Нельзя удалить: в разделе ${topics} тем. Сначала перенесите или удалите их.`,
    };
  }

  const category = await prisma.category.delete({ where: { id }, select: { slug: true } });
  await audit(ctx.userId, "admin.category_delete", "CATEGORY", category.slug);
  revalidatePath("/admin/categories");
  revalidatePath("/forum");
  return { status: "success", message: "Раздел удалён." };
}

// ── Пользователи ───────────────────────────────────────────────────────────

export async function setUserRoleAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const ctx = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !["USER", "MODERATOR", "ADMIN"].includes(role)) {
    return { status: "error", message: "Некорректные данные." };
  }
  if (userId === ctx.userId && role !== "ADMIN") {
    return { status: "error", message: "Нельзя понизить самого себя." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role: role as "USER" | "MODERATOR" | "ADMIN" } });
  await audit(ctx.userId, "admin.role_change", "USER", userId, { role });
  revalidatePath("/admin/users");
  return { status: "success", message: "Роль обновлена." };
}

export async function grantPremiumAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const ctx = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const days = Number(formData.get("days") ?? 0);
  if (!userId || !Number.isFinite(days)) {
    return { status: "error", message: "Некорректные данные." };
  }

  if (days <= 0) {
    await prisma.user.update({ where: { id: userId }, data: { premiumUntil: null } });
    await audit(ctx.userId, "admin.premium_revoke", "USER", userId);
    revalidatePath("/admin/users");
    return { status: "success", message: "Премиум отозван." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { premiumUntil: true } });
  const base = user?.premiumUntil && new Date(user.premiumUntil) > new Date()
    ? new Date(user.premiumUntil)
    : new Date();
  const premiumUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.user.update({ where: { id: userId }, data: { premiumUntil } });
  await audit(ctx.userId, "admin.premium_grant", "USER", userId, { days, until: premiumUntil.toISOString() });
  revalidatePath("/admin/users");
  return { status: "success", message: `Премиум продлён до ${premiumUntil.toLocaleDateString("ru-RU")}.` };
}

// ── Настройки сайта ──────────────────────────────────────────────────────

export async function updateSettingsAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const ctx = await requireStaff();

  const announcement = String(formData.get("site_announcement") ?? "").trim().slice(0, 300);
  const priceLabel = String(formData.get("premium_price_label") ?? "").trim().slice(0, 120);
  const perksRaw = String(formData.get("premium_perks") ?? "");
  const perks = perksRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => line.slice(0, 160));

  await Promise.all([
    setSetting("site_announcement", announcement),
    setSetting("premium_price_label", priceLabel),
    setSetting("premium_perks", JSON.stringify(perks)),
  ]);
  await audit(ctx.userId, "admin.settings_update");
  revalidatePath("/");
  revalidatePath("/premium");
  revalidatePath("/admin/settings");
  return { status: "success", message: "Настройки сохранены." };
}
