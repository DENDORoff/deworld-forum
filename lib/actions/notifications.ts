"use server";

import { revalidatePath } from "next/cache";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
