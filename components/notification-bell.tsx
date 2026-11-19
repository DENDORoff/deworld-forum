import { prisma } from "@/lib/db";
import { NotificationBellClient, type BellItem } from "@/components/notification-bell-client";

/** Серверная часть колокольчика: загружает счётчик и 5 последних уведомлений. */
export async function NotificationBell({ userId }: { userId: string }) {
  const [unreadCount, items] = await Promise.all([
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, title: true, body: true, link: true, createdAt: true },
    }),
  ]);

  const bellItems: BellItem[] = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return <NotificationBellClient unreadCount={unreadCount} items={bellItems} />;
}
