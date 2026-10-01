import '@/lib/temporal-setup';
import { db } from './prisma';

export type NotificationType =
  | 'VACATION_APPROVED'
  | 'VACATION_REJECTED'
  | 'VACATION_REQUEST'
  | 'AUTO_VACATION'
  | 'SYSTEM';

export async function createNotification(
  workerId: number,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
): Promise<void> {
  await db.orm.public.Notification.create({
    workerId,
    type,
    title,
    body: body ?? null,
    link: link ?? null,
  });
}

export async function notifyAdmins(
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
): Promise<void> {
  const admins = await db.orm.public.Worker
    .where({ role: 'ADMIN', isActive: true })
    .all();
  for (const a of admins) {
    await createNotification(a.id, type, title, body, link);
  }
}

export async function getUnreadCount(workerId: number): Promise<number> {
  const rows = await db.orm.public.Notification.where({ workerId }).all();
  return rows.filter((r) => r.readAt === null).length;
}

export async function listNotifications(workerId: number, limit = 20) {
  const rows = await db.orm.public.Notification.where({ workerId }).all();
  return rows
    .sort((a, b) =>
      a.createdAt.epochMilliseconds < b.createdAt.epochMilliseconds ? 1 : -1,
    )
    .slice(0, limit);
}

export async function markRead(workerId: number, id: number): Promise<void> {
  const n = await db.orm.public.Notification.where({ id, workerId }).first();
  if (!n || n.readAt) return;
  await db.orm.public.Notification.where({ id }).update({
    readAt: Temporal.Now.instant(),
  });
}

export async function markAllRead(workerId: number): Promise<void> {
  const rows = await db.orm.public.Notification.where({ workerId }).all();
  const unread = rows.filter((r) => r.readAt === null);
  const now = Temporal.Now.instant();
  for (const r of unread) {
    await db.orm.public.Notification.where({ id: r.id }).update({ readAt: now });
  }
}