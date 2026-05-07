import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('Starting user check...');
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected. Querying user...');
        const user = await prisma.user.findUnique({
            where: { email: 'testuser@example.com' }
        });
        console.log('User check result:', user);
    } catch (e: any) {
        console.error('Error checking user:');
        console.error('Message:', e.message);
        console.error('Code:', e.code);
        console.error('Meta:', e.meta);
        console.error('Full Error:', JSON.stringify(e, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
