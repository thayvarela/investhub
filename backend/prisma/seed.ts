import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    const backupPath = path.join(__dirname, 'seed_backup.json');

    if (fs.existsSync(backupPath)) {
        console.log('📦 Backup file found. Restoring data...');
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

        for (const user of backupData) {
            console.log(`Restoring user: ${user.email}`);

            // Delete existing records to avoid duplicate conflicts (Prisma does not cascade delete by default unless configured, so we delete relations first)
            await prisma.asset.deleteMany({ where: { userId: user.id } });
            await prisma.portfolioHistory.deleteMany({ where: { userId: user.id } });
            await prisma.targetAllocation.deleteMany({ where: { userId: user.id } });
            
            // Delete user if they exist
            await prisma.user.deleteMany({ where: { id: user.id } });

            // Create user and nested relations
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    name: user.name,
                    createdAt: new Date(user.createdAt),
                    assets: {
                        create: user.assets.map((asset: any) => ({
                            id: asset.id,
                            ticker: asset.ticker,
                            name: asset.name,
                            quantity: asset.quantity,
                            averagePrice: asset.averagePrice,
                            currentPrice: asset.currentPrice,
                            currency: asset.currency,
                            category: asset.category,
                            subCategory: asset.subCategory,
                            change1D: asset.change1D || 0,
                            change5D: asset.change5D || 0,
                            change1M: asset.change1M || 0,
                            isManual: asset.isManual,
                            updatedAt: new Date(asset.updatedAt)
                        }))
                    },
                    history: {
                        create: user.history.map((hist: any) => ({
                            id: hist.id,
                            date: new Date(hist.date),
                            totalValue: hist.totalValue,
                            totalInvested: hist.totalInvested,
                            assetSnapshots: hist.assetSnapshots ? {
                                create: hist.assetSnapshots.map((snap: any) => ({
                                    id: snap.id,
                                    ticker: snap.ticker,
                                    name: snap.name,
                                    quantity: snap.quantity,
                                    averagePrice: snap.averagePrice,
                                    currentPrice: snap.currentPrice,
                                    currency: snap.currency,
                                    category: snap.category,
                                    subCategory: snap.subCategory,
                                    change1D: snap.change1D || 0,
                                    change5D: snap.change5D || 0,
                                    change1M: snap.change1M || 0
                                }))
                            } : undefined
                        }))
                    },
                    targets: {
                        create: user.targets.map((target: any) => ({
                            id: target.id,
                            segmentKey: target.segmentKey,
                            targetPercentage: target.targetPercentage
                        }))
                    }
                }
            });
        }
        console.log('✅ Database restore from backup completed!');
    } else {
        console.log('⚠️ No backup file found. Seeding default test data...');
        // hashed password for "password123"
        const passwordHash = await bcrypt.hash('password123', 10);

        // 1. Create User
        const user = await prisma.user.upsert({
            where: { email: 'testuser@example.com' },
            update: {
                passwordHash,
            },
            create: {
                email: 'testuser@example.com',
                name: 'Test User',
                passwordHash,
                // 2. Create Assets
                assets: {
                    create: [
                        {
                            ticker: 'AAPL',
                            name: 'Apple Inc.',
                            quantity: 10,
                            averagePrice: 150.00,
                            currentPrice: 175.00,
                            category: 'Stocks',
                            subCategory: 'US Stocks',
                            isManual: true,
                        },
                        {
                            ticker: 'PETR4',
                            name: 'Petrobras',
                            quantity: 100,
                            averagePrice: 30.00,
                            currentPrice: 35.50,
                            category: 'Stocks',
                            subCategory: 'BR Stocks',
                            isManual: true,
                        },
                        {
                            ticker: 'BTC',
                            name: 'Bitcoin',
                            quantity: 0.05,
                            averagePrice: 40000.00,
                            currentPrice: 65000.00,
                            category: 'Crypto',
                            subCategory: 'Bitcoin',
                            isManual: true,
                        },
                    ],
                },
                // 3. Create History
                history: {
                    create: [
                        {
                            date: new Date(new Date().setDate(new Date().getDate() - 30)), // 30 days ago
                            totalValue: 10000,
                            totalInvested: 8000,
                        },
                        {
                            date: new Date(), // Today
                            totalValue: 12500,
                            totalInvested: 9000,
                        },
                    ],
                },
            },
        });

        console.log(`✅ User created: ${user.email}`);
        console.log('✅ Seed completed!');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

