/**
 * Серверные действия форума. Всегда проверяем сессию и права внутри action —
 * Server Actions доступны по прямой POST-ссылке.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isPremiumActive } from "@/lib/utils";
import { slugifyOrFallback } from "@/lib/translit";
import { notify, notifyMentions } from "@/lib/notifications";
import { logBotEvent } from "@/lib/bot-logger";
import {
  postCreateSchema,
  topicCreateSchema,
} from "@/lib/validations";

export interface ForumActionResult {
  ok: boolean;
  error?: string;
}

async function requireSessionUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/signin?callbackUrl=/forum");
  }
  return { id: userId, role: session.user.role };
}

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

async function writeAudit(
  userId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        metadata: metadata as object | undefined,
        ip: await clientIp(),
      },
    });
  } catch (error) {
    console.error("[audit] не удалось записать лог", error);
  }
}

/** Создание темы в разделе. Возвращает slug созданной темы. */
export async function createTopicAction(
  categoryId: string,
  input: { title: string; content: string; premiumOnly: boolean },
): Promise<ForumActionResult & { slug?: string }> {
  const user = await requireSessionUser();

  const parsed = topicCreateSchema.safeParse({
    categoryId,
    ...input,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const ip = await clientIp();
  const rl = rateLimit(`topic:${ip ?? user.id}`, 5, 60 * 60 * 1000);
  if (!rl.success) {
    return { ok: false, error: "Слишком частые публикации. Попробуйте позже." };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    select: { id: true, slug: true, premiumOnly: true },
  });
  if (!category) {
    return { ok: false, error: "Раздел не найден" };
  }

  // Премиум-ограничение: и на раздел, и на премиум-тему
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { premiumUntil: true, role: true },
  });
  const premium = isPremiumActive(dbUser);
  if (category.premiumOnly && !premium && dbUser?.role === "USER") {
    return { ok: false, error: "Этот раздел доступен только премиум-подписчикам" };
  }
  const premiumOnly = parsed.data.premiumOnly && premium;

  // Уникальный человекочитаемый slug по заголовку
  const base = slugifyOrFallback(parsed.data.title, "tema");
  let slug = base;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const exists = await prisma.topic.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) break;
    slug = `${base.slice(0, 72)}-${attempt + 1}`;
  }

  const topic = await prisma.topic.create({
    data: {
      categoryId: category.id,
      authorId: user.id,
      title: parsed.data.title.trim(),
      slug,
      content: parsed.data.content.trim(),
      premiumOnly,
      lastPostAt: new Date(),
    },
    select: { slug: true },
  });

  await writeAudit(user.id, "topic.create", "TOPIC", topic.slug, { title: parsed.data.title });

  const topicLink = `/forum/topic/${topic.slug}`;
  await notifyMentions(parsed.data.content.trim(), user.id, topicLink);

  const actor = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, username: true },
  });
  await logBotEvent("topic_created", {
    actor: { name: actor?.name ?? actor?.username ?? "Участник", username: actor?.username ?? null },
    target: parsed.data.title.trim(),
    targetUrl: topicLink,
  });

  revalidatePath("/forum");
  revalidatePath(`/forum/${category.slug}`);
  return { ok: true, slug: topic.slug };
}

/** Ответ в теме. */
export async function createPostAction(
  topicId: string,
  input: { content: string },
): Promise<ForumActionResult> {
  const user = await requireSessionUser();

  const parsed = postCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const ip = await clientIp();
  const rl = rateLimit(`post:${ip ?? user.id}`, 30, 60 * 1000);
  if (!rl.success) {
    return { ok: false, error: "Вы отвечаете слишком часто. Подождите минуту." };
  }

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, slug: true, locked: true, premiumOnly: true, category: { select: { premiumOnly: true } } },
  });
  if (!topic) {
    return { ok: false, error: "Тема не найдена" };
  }
  if (topic.locked) {
    return { ok: false, error: "Тема закрыта для ответов" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { premiumUntil: true, role: true },
  });
  const premium = isPremiumActive(dbUser);
  const isStaff = dbUser && dbUser.role !== "USER";
  const premiumRequired = topic.premiumOnly || topic.category.premiumOnly;
  if (premiumRequired && !premium && !isStaff) {
    return { ok: false, error: "Раздел доступен только премиум-подписчикам" };
  }

  const result = await prisma.post.create({
    data: {
      topicId: topic.id,
      authorId: user.id,
      content: parsed.data.content.trim(),
    },
    select: { id: true },
  });

  await prisma.topic.update({
    where: { id: topic.id },
    data: {
      replyCount: { increment: 1 },
      lastPostAt: new Date(),
    },
  });

  await writeAudit(user.id, "post.create", "TOPIC", topic.slug);

  // Уведомления: автору темы (если отвечал не он) и упомянутым
  const postLink = `/forum/topic/${topic.slug}#post-${result.id}`;
  const fresh = await prisma.topic.findUnique({
    where: { id: topic.id },
    select: { authorId: true, title: true },
  });
  if (fresh && fresh.authorId !== user.id) {
    const actor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, username: true },
    });
    await notify({
      userId: fresh.authorId,
      type: "reply",
      title: `${actor?.name ?? actor?.username ?? "Участник"} ответил в теме «${fresh.title.slice(0, 60)}»`,
      body: parsed.data.content.trim().replace(/\s+/g, " ").slice(0, 140),
      link: postLink,
    });
  }
  await notifyMentions(parsed.data.content.trim(), user.id, postLink);

  const postActor = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, username: true },
  });
  await logBotEvent("post_created", {
    actor: { name: postActor?.name ?? postActor?.username ?? "Участник", username: postActor?.username ?? null },
    target: fresh?.title ?? "тема",
    targetUrl: postLink,
  });

  revalidatePath(`/forum/topic/${topic.slug}`);
  revalidatePath("/forum");
  return { ok: true };
}

/** Лайк/анлайк поста (переключатель). */
export async function togglePostLikeAction(
  postId: string,
): Promise<ForumActionResult & { liked?: boolean; count?: number }> {
  const user = await requireSessionUser();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, topic: { select: { slug: true } } },
  });
  if (!post) {
    return { ok: false, error: "Сообщение не найдено" };
  }

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { postId, userId: user.id } });
  }

  const count = await prisma.postLike.count({ where: { postId } });
  revalidatePath(`/forum/topic/${post.topic.slug}`);
  return { ok: true, liked: !existing, count };
}

/** Закрыть/открыть тему. Автор темы или персонал. */
export async function toggleTopicLockAction(
  topicId: string,
): Promise<ForumActionResult> {
  const user = await requireSessionUser();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, slug: true, authorId: true, locked: true },
  });
  if (!topic) return { ok: false, error: "Тема не найдена" };

  const isOwner = topic.authorId === user.id;
  const isStaff = user.role !== "USER";
  if (!isOwner && !isStaff) {
    return { ok: false, error: "Недостаточно прав" };
  }

  await prisma.topic.update({
    where: { id: topic.id },
    data: { locked: !topic.locked },
  });
  await writeAudit(user.id, topic.locked ? "topic.unlock" : "topic.lock", "TOPIC", topic.slug);

  revalidatePath(`/forum/topic/${topic.slug}`);
  return { ok: true };
}

/** Закрепить/открепить тему. Только модерация. */
export async function toggleTopicPinAction(
  topicId: string,
): Promise<ForumActionResult> {
  const user = await requireSessionUser();
  if (user.role === "USER") return { ok: false, error: "Недостаточно прав" };

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, slug: true, pinned: true },
  });
  if (!topic) return { ok: false, error: "Тема не найдена" };

  await prisma.topic.update({
    where: { id: topic.id },
    data: { pinned: !topic.pinned },
  });
  await writeAudit(user.id, topic.pinned ? "topic.unpin" : "topic.pin", "TOPIC", topic.slug);

  revalidatePath(`/forum/topic/${topic.slug}`);
  revalidatePath("/forum");
  return { ok: true };
}

/** Отметить посты как решение. Только автор темы. */
export async function markSolutionAction(
  topicId: string,
  postId: string,
): Promise<ForumActionResult> {
  const user = await requireSessionUser();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, slug: true, authorId: true },
  });
  if (!topic) return { ok: false, error: "Тема не найдена" };

  const isOwner = topic.authorId === user.id;
  if (!isOwner && user.role === "USER") {
    return { ok: false, error: "Отметить решение может только автор темы" };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, topicId: true },
  });
  if (!post || post.topicId !== topic.id) {
    return { ok: false, error: "Сообщение не из этой темы" };
  }

  await prisma.$transaction([
    prisma.post.updateMany({
      where: { topicId: topic.id },
      data: { isSolution: false },
    }),
    prisma.post.update({
      where: { id: post.id },
      data: { isSolution: true },
    }),
  ]);

  const solutionPost = await prisma.post.findUnique({
    where: { id: post.id },
    select: { authorId: true, topic: { select: { title: true } } },
  });
  if (solutionPost && solutionPost.authorId !== user.id) {
    await notify({
      userId: solutionPost.authorId,
      type: "solution",
      title: "Ваш ответ отмечен как решение",
      body: solutionPost.topic.title.slice(0, 100),
      link: `/forum/topic/${topic.slug}#post-${post.id}`,
    });
  }

  await writeAudit(user.id, "topic.solution", "POST", post.id);

  revalidatePath(`/forum/topic/${topic.slug}`);
  return { ok: true };
}

/** Удалить тему. Автор, модератор или админ. */
export async function deleteTopicAction(topicId: string): Promise<ForumActionResult> {
  const user = await requireSessionUser();

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, slug: true, authorId: true, category: { select: { slug: true } } },
  });
  if (!topic) return { ok: false, error: "Тема не найдена" };

  const isOwner = topic.authorId === user.id;
  const isStaff = user.role !== "USER";
  if (!isOwner && !isStaff) return { ok: false, error: "Недостаточно прав" };

  await prisma.topic.delete({ where: { id: topic.id } });
  await writeAudit(user.id, "topic.delete", "TOPIC", topic.slug);

  revalidatePath("/forum");
  revalidatePath(`/forum/${topic.category.slug}`);
  redirect(`/forum/${topic.category.slug}`);
}

/** Удалить пост. Автор поста или персонал. */
export async function deletePostAction(postId: string): Promise<ForumActionResult> {
  const user = await requireSessionUser();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, topicId: true, topic: { select: { slug: true } } },
  });
  if (!post) return { ok: false, error: "Сообщение не найдено" };

  const isOwner = post.authorId === user.id;
  const isStaff = user.role !== "USER";
  if (!isOwner && !isStaff) return { ok: false, error: "Недостаточно прав" };

  await prisma.$transaction([
    prisma.post.delete({ where: { id: post.id } }),
    prisma.topic.update({
      where: { id: post.topicId },
      data: { replyCount: { decrement: 1 } },
    }),
  ]);
  await writeAudit(user.id, "post.delete", "POST", post.id);

  revalidatePath(`/forum/topic/${post.topic.slug}`);
  return { ok: true };
}
