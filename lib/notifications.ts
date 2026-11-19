/**
 * Внутренние уведомления на сайте + дублирование на почту (если настроен SMTP).
 * Запись в БД никогда не должна ломать бизнес-действие — ошибки только логируются.
 */
import "server-only";

import { prisma } from "@/lib/db";
import { sendNotificationMail } from "@/lib/mail";
import { absoluteUrl } from "@/lib/utils";

export interface NotifyInput {
  userId: string;
  type: "reply" | "mention" | "solution" | "report" | "system" | "ticket";
  title: string;
  body?: string;
  /** Внутренний путь, например /forum/topic/slug */
  link?: string;
  /** Дублировать на email (по умолчанию true) */
  email?: boolean;
}

export async function notify(input: NotifyInput): Promise<void> {
  try {
    const created = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
      select: {
        id: true,
        user: { select: { email: true, username: true } },
      },
    });

    if (input.email !== false && created.user.email) {
      void sendNotificationMail(
        created.user.email,
        created.user.username,
        input.title,
        input.body ?? null,
        input.link ? absoluteUrl(input.link) : absoluteUrl("/notifications"),
      );
    }
  } catch (error) {
    console.error("[notify] не удалось создать уведомление", error);
  }
}

/** Упоминания @username в тексте → уведомления (до 5 пользователей, без автора). */
export async function notifyMentions(
  content: string,
  authorId: string,
  link: string,
): Promise<void> {
  const matches = [...content.matchAll(/@([a-zA-Z0-9_]{3,24})/g)].map((m) => m[1]);
  if (matches.length === 0) return;

  const unique = [...new Set(matches)].slice(0, 5);
  const users = await prisma.user.findMany({
    where: { username: { in: unique }, NOT: { id: authorId } },
    select: { id: true, username: true },
  });

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true, username: true },
  });
  const authorLabel = author?.name ?? author?.username ?? "Кто-то";

  await Promise.all(
    users.map((user) =>
      notify({
        userId: user.id,
        type: "mention",
        title: `${authorLabel} упомянул вас`,
        body: content.replace(/\s+/g, " ").slice(0, 140),
        link,
      }),
    ),
  );
}
