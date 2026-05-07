const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.asset.findMany({ select: { ticker: true, change1D: true } }).then(a => console.log(a)).finally(() => prisma.$disconnect());
