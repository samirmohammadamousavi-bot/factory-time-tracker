import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../src/prisma/contract.json' with { type: 'json' };
import bcrypt from 'bcryptjs';

const db = postgres({ contractJson, url: process.env['DATABASE_URL']! });

async function main() {
  // Create admin user
  const adminNationalId = '0011223344';
  const adminPhone = '09123456789';

  const existingAdmin = await db.orm.public.Worker
    .where({ nationalId: adminNationalId })
    .first();

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPhone, 10);
    await db.orm.public.Worker.create({
      nationalId: adminNationalId,
      phone: adminPhone,
      passwordHash,
      firstName: 'مدیر',
      lastName: 'سیستم',
      role: 'ADMIN',
      isActive: true,
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }

  // Create sample workers
  const sampleWorkers = [
    { nationalId: '1122334455', phone: '09121112233', firstName: 'احمد', lastName: 'محمدی' },
    { nationalId: '2233445566', phone: '09122223344', firstName: 'رضا', lastName: 'احمدی' },
    { nationalId: '3344556677', phone: '09123334455', firstName: 'مهدی', lastName: 'رضایی' },
    { nationalId: '4455667788', phone: '09124445566', firstName: 'علی', lastName: 'کریمی' },
    { nationalId: '5566778899', phone: '09125556677', firstName: 'حسین', lastName: 'نعمتی' },
  ];

  for (const worker of sampleWorkers) {
    const existing = await db.orm.public.Worker
      .where({ nationalId: worker.nationalId })
      .first();
    if (!existing) {
      const passwordHash = await bcrypt.hash(worker.phone, 10);
      await db.orm.public.Worker.create({
        ...worker,
        passwordHash,
        role: 'WORKER',
        isActive: true,
      });
      console.log(`Worker ${worker.firstName} ${worker.lastName} created`);
    }
  }

  console.log('Database seeded successfully');
  await db.close();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });