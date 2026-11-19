/**
 * Серверные действия жалоб (система репортов).
 * Пользователь создаёт — модератор принимает решение (/admin/reports).
 */
"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getServerSession } from "@/lib/server-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { reportCreateSchema } from "@/lib/validations";
import { logBotEvent } from "@/lib/bot-logger";

export interface ReportFormState {
  status: "idle" | "error" | "success";
  message?: string;
}

async function ipAddress(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

export async function createReportAction(
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { status: "error", message: "Войдите, чтобы пожаловаться." };
  }

  const ip = await ipAddress();
  const rl = rateLimit(`report:${ip ?? session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.success) {
    return { status: "error", message: "Слишком много жалоб. Попробуйте позже." };
  }

  const parsed = reportCreateSchema.safeParse({
    targetType: String(formData.get("targetType") ?? ""),
    targetId: String(formData.get("targetId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Проверьте форму." };
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason.trim(),
    },
  });

  const actor = session.user;
  await logBotEvent("report_created", {
    actor: { name: actor.name ?? actor.username ?? "Участник", username: actor.username ?? null },
    target: `${parsed.data.targetType}: ${parsed.data.reason.trim().slice(0, 80)}`,
    targetUrl: "/admin/reports",
  });

  return {
    status: "success",
    message: "Жалоба отправлена. Модераторы рассмотрят её в ближайшее время.",
  };
}

export async function resolveReportAction(
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "MODERATOR")) {
    throw new Error("FORBIDDEN");
  }

  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "");
  const resolution = String(formData.get("resolution") ?? "").trim().slice(0, 1000);
  if (!reportId || !["RESOLVED", "REJECTED", "IN_REVIEW"].includes(status)) {
    return { status: "error", message: "Некорректные данные." };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: status as "RESOLVED" | "REJECTED" | "IN_REVIEW",
      resolution: resolution || null,
      resolvedById: session.user.id,
    },
  });

  try {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "report.resolve",
        targetType: "REPORT",
        targetId: reportId,
        metadata: { status },
      },
    });
  } catch (error) {
    console.error("[audit]", error);
  }

  revalidatePath("/admin/reports");
  return { status: "success", message: "Статус жалобы обновлён." };
}
