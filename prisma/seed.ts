import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../src/prisma/contract.json' with { type: 'json' };
import bcrypt from 'bcryptjs';

const db = postgres({ contractJson, url: process.env['DATABASE_URL']! });

async function main() {
  const adminNationalId = '2981045776';
  const adminPhone = '09134419272';

  const existingAdmin = await db.orm.public.Worker
    .where({ nationalId: adminNationalId })
    .first();

  if (existingAdmin) {
    console.log('Admin user already exists');
  } else {
    const passwordHash = await bcrypt.hash(adminPhone, 10);
    await db.orm.public.Worker.create({
      nationalId: adminNationalId,
      phone: adminPhone,
      passwordHash,
      firstName: 'امیر',
      lastName: 'موسوی',
      role: 'ADMIN',
      isActive: true,
      gender: 'MALE',
      department: 'ADMIN',
      theme: 'a',
    });
    console.log('Admin user created');
  }

  console.log('Database seeded successfully');
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});