import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

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

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
