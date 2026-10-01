import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const runtime = 'nodejs';

const DEPARTMENTS = [
  'PRODUCTION',
  'PACKAGING',
  'MAINTENANCE',
  'QUALITY',
  'WAREHOUSE',
  'ADMIN',
] as const;

export async function GET() {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const workers = await db.orm.public.Worker
    .orderBy((model) => model.createdAt.desc())
    .all();

  return NextResponse.json(workers);
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch (response) {
    return response as NextResponse;
  }

  const body = await req.json();
  const { nationalId, phone, firstName, lastName, role, gender, department } = body;

  if (!nationalId || !phone || !firstName || !lastName) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const safeRole: 'ADMIN' | 'WORKER' = role === 'ADMIN' ? 'ADMIN' : 'WORKER';
  const safeGender: 'MALE' | 'FEMALE' = gender === 'FEMALE' ? 'FEMALE' : 'MALE';
  const safeDepartment = (DEPARTMENTS as readonly string[]).includes(department)
    ? department
    : 'PRODUCTION';

  const passwordHash = await bcrypt.hash(phone, 10);

  try {
    const worker = await db.orm.public.Worker.create({
      nationalId,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: safeRole,
      isActive: true,
      gender: safeGender,
      department: safeDepartment,
      theme: 'a',
    });

    return NextResponse.json({ id: worker.id }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : '';
    if (code === 'ORM.CONSTRAINT_VIOLATION' || message.includes('unique')) {
      return NextResponse.json({ error: 'National ID or phone already exists' }, { status: 400 });
    }
    throw error;
  }
}
