import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

const DEPARTMENTS = ['PRODUCTION', 'PACKAGING', 'MAINTENANCE', 'QUALITY', 'WAREHOUSE', 'ADMIN'] as const;
const ROLES = ['ADMIN', 'WORKER'] as const;
const GENDERS = ['MALE', 'FEMALE'] as const;

/* ---------------- PATCH: edit an existing user ---------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const workerId = Number(id);
  if (!workerId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const existing = await db.orm.public.Worker.where({ id: workerId }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { nationalId, phone, firstName, lastName, role, gender, department, isActive } = body;

  const updates: Record<string, unknown> = {};
  if (typeof nationalId === 'string' && nationalId.trim()) updates.nationalId = nationalId.trim();
  if (typeof phone === 'string' && phone.trim()) updates.phone = phone.trim();
  if (typeof firstName === 'string' && firstName.trim()) updates.firstName = firstName.trim();
  if (typeof lastName === 'string' && lastName.trim()) updates.lastName = lastName.trim();
  if (ROLES.includes(role)) updates.role = role;
  if (GENDERS.includes(gender)) updates.gender = gender;
  if (DEPARTMENTS.includes(department)) updates.department = department;

  if (typeof isActive === 'boolean') {
    if (workerId === Number(session.user.id) && isActive === false) {
      return NextResponse.json({ error: 'نمی‌توانید حساب خودتان را غیرفعال کنید' }, { status: 400 });
    }
    updates.isActive = isActive;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    await db.orm.public.Worker.where({ id: workerId }).update(updates);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : '';
    if (code === 'ORM.CONSTRAINT_VIOLATION' || message.includes('unique')) {
      return NextResponse.json({ error: 'کد ملی یا شماره تلفن تکراری است' }, { status: 400 });
    }
    throw error;
  }
}

/* ---------------- DELETE: remove a user ---------------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const workerId = Number(id);
  if (!workerId) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Prevent admin from deleting themselves
  if (workerId === Number(session.user.id)) {
    return NextResponse.json({ error: 'نمی‌توانید حساب خودتان را حذف کنید' }, { status: 400 });
  }

  const existing = await db.orm.public.Worker.where({ id: workerId }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.orm.public.Worker.where({ id: workerId }).delete();

  return NextResponse.json({ ok: true, message: 'کاربر حذف شد' });
}