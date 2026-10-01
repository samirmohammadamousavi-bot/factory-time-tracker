import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export interface AuthenticatedSession {
  user: {
    id: string;
    role: string;
    nationalId: string;
    name?: string | null;
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      role: session.user.role,
      nationalId: session.user.nationalId,
      name: session.user.name,
    },
  };
}

export async function requireAuth(): Promise<AuthenticatedSession> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedSession> {
  const user = await requireAuth();
  if (user.user.role !== 'ADMIN') {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

export async function requireWorker(): Promise<AuthenticatedSession> {
  const user = await requireAuth();
  if (user.user.role === 'ADMIN') {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

export function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}