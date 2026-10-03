import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
  console.log('--- Iniciando importação de dados para o banco na Nuvem (Neon) ---');
  
  const backupPath = path.join(__dirname, 'backup_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Arquivo backup_data.json não encontrado!');
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(raw);

  console.log(`Carregando backup com ${backup.usersCount} usuários e ${backup.totalAssets} ativos...`);

  for (const user of backup.data) {
    console.log(`Importando usuário: ${user.email}...`);

    // 1. Criar ou atualizar usuário
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: user.passwordHash
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        createdAt: new Date(user.createdAt)
      }
    });

    // 2. Importar ativos
    console.log(`Importando ${user.assets.length} ativos para ${user.email}...`);
    for (const asset of user.assets) {
      await prisma.asset.upsert({
        where: { id: asset.id },
        update: {
          ticker: asset.ticker,
          name: asset.name,
          quantity: asset.quantity,
          averagePrice: asset.averagePrice,
          currentPrice: asset.currentPrice,
          currency: asset.currency,
          category: asset.category,
          subCategory: asset.subCategory,
          change1D: asset.change1D,
          change5D: asset.change5D,
          change1M: asset.change1M,
          isManual: asset.isManual,
          updatedAt: new Date(asset.updatedAt)
        },
        create: {
          id: asset.id,
          userId: user.id,
          ticker: asset.ticker,
          name: asset.name,
          quantity: asset.quantity,
          averagePrice: asset.averagePrice,
          currentPrice: asset.currentPrice,
          currency: asset.currency,
          category: asset.category,
          subCategory: asset.subCategory,
          change1D: asset.change1D,
          change5D: asset.change5D,
          change1M: asset.change1M,
          isManual: asset.isManual,
          updatedAt: new Date(asset.updatedAt)
        }
      });
    }

    // 3. Importar histórico patrimonial
    if (user.history && user.history.length > 0) {
      console.log(`Importando ${user.history.length} registros de histórico...`);
      for (const h of user.history) {
        await prisma.portfolioHistory.upsert({
          where: { id: h.id },
          update: {
            totalValue: h.totalValue,
            totalInvested: h.totalInvested,
            date: new Date(h.date)
          },
          create: {
            id: h.id,
            userId: user.id,
            totalValue: h.totalValue,
            totalInvested: h.totalInvested,
            date: new Date(h.date)
          }
        });
      }
    }

    // 4. Importar metas de rebalanceamento
    if (user.targets && user.targets.length > 0) {
      console.log(`Importando ${user.targets.length} metas de alocação...`);
      for (const t of user.targets) {
        await prisma.targetAllocation.upsert({
          where: { id: t.id },
          update: {
            segmentKey: t.segmentKey,
            targetPercentage: t.targetPercentage
          },
          create: {
            id: t.id,
            userId: user.id,
            segmentKey: t.segmentKey,
            targetPercentage: t.targetPercentage
          }
        });
      }
    }
  }

  console.log('🎉 Migração concluída com sucesso total! Todos os dados estão no Neon.');
}

importData()
  .catch((err) => {
    console.error('Erro na importação:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
