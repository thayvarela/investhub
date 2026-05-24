const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ include: { assets: true } });
  console.log(`Users: ${users.length}`);
  for (let u of users) {
    console.log(`User ${u.email} has ${u.assets.length} assets`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
