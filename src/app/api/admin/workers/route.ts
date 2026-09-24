import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const workers = await db.orm.public.Worker
    .orderBy((model) => model.createdAt.desc())
    .all();

  return NextResponse.json(workers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { nationalId, phone, firstName, lastName } = await req.json();

  if (!nationalId || !phone || !firstName || !lastName) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  // Initial password = phone number
  const passwordHash = await bcrypt.hash(phone, 10);

  try {
    const worker = await db.orm.public.Worker.create({
      nationalId,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: 'WORKER',
      isActive: true,
    });

    return NextResponse.json({ id: worker.id }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ORM.CONSTRAINT_VIOLATION' || error.message?.includes('unique')) {
      return NextResponse.json({ error: 'National ID or phone already exists' }, { status: 400 });
    }
    throw error;
  }
}