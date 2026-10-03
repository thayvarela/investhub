import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
  console.log('--- Iniciando exportação de dados do banco local ---');
  
  const users = await prisma.user.findMany({
    include: {
      assets: true,
      history: true,
      targets: true
    }
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    usersCount: users.length,
    totalAssets: users.reduce((acc, u) => acc + u.assets.length, 0),
    data: users
  };

  const outputPath = path.join(__dirname, 'backup_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportPayload, null, 2), 'utf-8');

  console.log(`✅ Sucesso! Exportados ${exportPayload.usersCount} usuários e ${exportPayload.totalAssets} ativos.`);
  console.log(`Salvo em: ${outputPath}`);
}

exportData()
  .catch((err) => {
    console.error('Erro ao exportar dados:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
