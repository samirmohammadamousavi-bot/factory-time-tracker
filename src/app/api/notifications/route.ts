import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { listNotifications, getUnreadCount } from '@/lib/notifications';

export const runtime = 'nodejs';

export async function GET() {
  let session;
  try {
    session = await requireAuth();
  } catch (response) {
    return response as NextResponse;
  }
  const workerId = Number(session.user.id);
  const [notifications, unread] = await Promise.all([
    listNotifications(workerId, 30),
    getUnreadCount(workerId),
  ]);
  return NextResponse.json({ notifications, unread });
}