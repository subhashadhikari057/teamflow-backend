import { PrismaPg } from '@prisma/adapter-pg';
import { GlobalRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

process.loadEnvFile();

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const passwordHash = await bcrypt.hash('Superadmin@123', 10);

    await prisma.user.upsert({
      where: {
        email: 'superadmin@gmail.com',
      },
      update: {
        name: 'Super Admin',
        username: 'superadmin',
        role: GlobalRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        deletedAt: null,
        passwordHash,
      },
      create: {
        email: 'superadmin@gmail.com',
        username: 'superadmin',
        name: 'Super Admin',
        role: GlobalRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
        passwordHash,
      },
    });

    console.log('Super admin seeded: superadmin@gmail.com');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Failed to seed super admin', error);
  process.exit(1);
});
