/**
 * Серверные действия редактирования контента в админке: навигация, футер, реквизиты.
 * Формат редактирования — простой текстовый (по строке на пункт): «Название|/url».
 */
"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { setSetting } from "@/lib/settings";
import {
  linesToRequisites,
  parseFooterColumns,
  parseSimpleList,
} from "@/lib/site-content";
import { logBotEvent } from "@/lib/bot-logger";

export interface ContentFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

async function requireStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) {
    throw new Error("FORBIDDEN");
  }
  return { userId: session.user.id, role };
}

async function afterSave(
  userId: string,
  action: string,
  what: string,
): Promise<string> {
  try {
    await prisma.auditLog.create({
      data: { userId, action, targetType: "SETTING", targetId: what },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true },
  });
  await logBotEvent("settings_changed", {
    actor: { name: actor?.name ?? actor?.username ?? "Админ", username: actor?.username ?? null },
    target: what,
    targetUrl: "/admin/content",
  });
  return "Сохранено. Кэш инвалидирован — изменения видны сразу.";
}

export async function updateNavAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const ctx = await requireStaff();
  const items = parseSimpleList(String(formData.get("nav_items") ?? ""));
  if (items.length === 0) {
    return { status: "error", message: "Навигация не может быть пустой. Формат: «Название|/url» на каждую строку." };
  }
  await setSetting("nav.items", JSON.stringify(items));
  const message = await afterSave(ctx.userId, "admin.nav_update", "навигация сайта");
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { status: "success", message };
}

export async function updateFooterAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const ctx = await requireStaff();
  const columns = parseFooterColumns(String(formData.get("footer_columns") ?? ""));
  const tagline = String(formData.get("footer_tagline") ?? "").trim().slice(0, 200);

  if (columns.length === 0) {
    return { status: "error", message: "Футер не может быть пустым. Формат: «## Раздел», далее «Название|/url»." };
  }

  await Promise.all([
    setSetting("footer.columns", JSON.stringify(columns)),
    setSetting("footer.tagline", tagline),
  ]);
  const message = await afterSave(ctx.userId, "admin.footer_update", "подвал сайта");
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { status: "success", message };
}

export async function updateRequisitesAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const ctx = await requireStaff();
  const requisites = linesToRequisites(String(formData.get("requisites") ?? ""));

  await setSetting("operator.requisites", JSON.stringify(requisites));
  const message = await afterSave(ctx.userId, "admin.requisites_update", "реквизиты оператора");
  revalidatePath("/");
  revalidatePath("/legal/requisites");
  revalidatePath("/legal/privacy");
  revalidatePath("/admin/content");
  return { status: "success", message };
}
