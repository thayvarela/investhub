const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.asset.findMany({ select: { ticker: true, change1D: true, change5D: true, change1M: true, isManual: true } })
  .then(a => console.log(JSON.stringify(a, null, 2)))
  .finally(() => prisma.$disconnect());
