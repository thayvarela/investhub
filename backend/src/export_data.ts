import prisma from './utils/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function exportData() {
    console.log('🤖 Starting database export...');
    try {
        const users = await prisma.user.findMany({
            include: {
                assets: true,
                history: {
                    include: {
                        assetSnapshots: true
                    }
                },
                targets: true
            }
        });

        console.log(`Found ${users.length} user(s) in the database.`);

        // Map data to a clean, serializable format
        const backupData = users.map(user => ({
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            name: user.name,
            createdAt: user.createdAt.toISOString(),
            assets: user.assets.map(asset => ({
                id: asset.id,
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
                updatedAt: asset.updatedAt.toISOString()
            })),
            history: user.history.map(hist => ({
                id: hist.id,
                date: hist.date.toISOString(),
                totalValue: hist.totalValue,
                totalInvested: hist.totalInvested,
                assetSnapshots: hist.assetSnapshots ? hist.assetSnapshots.map(snap => ({
                    id: snap.id,
                    ticker: snap.ticker,
                    name: snap.name,
                    quantity: snap.quantity,
                    averagePrice: snap.averagePrice,
                    currentPrice: snap.currentPrice,
                    currency: snap.currency,
                    category: snap.category,
                    subCategory: snap.subCategory,
                    change1D: snap.change1D,
                    change5D: snap.change5D,
                    change1M: snap.change1M
                })) : []
            })),
            targets: user.targets.map(target => ({
                id: target.id,
                segmentKey: target.segmentKey,
                targetPercentage: target.targetPercentage
            }))
        }));

        const outputPath = path.join(__dirname, '../prisma/seed_backup.json');
        fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf-8');
        console.log(`✅ Export completed successfully! Saved to: ${outputPath}`);
    } catch (error) {
        console.error('❌ Export failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
