const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const assets = await prisma.asset.findMany();
  for (let i = 0; i < 5 && i < assets.length; i++) {
    console.log(`${assets[i].ticker}: ${assets[i].currentPrice}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
