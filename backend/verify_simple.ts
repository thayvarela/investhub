import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getNewPrice = (currentPrice: number) => {
    const variationPercent = (Math.random() - 0.5) * 0.1; // +/- 5%
    const change = currentPrice * variationPercent;
    let newPrice = currentPrice + change;
    return parseFloat(newPrice.toFixed(2));
};

async function verify() {
    console.log('🔍 Checking initial prices...');
    const initialAssets = await prisma.asset.findMany();
    if (initialAssets.length === 0) {
        console.log('⚠️ No assets found to update.');
        await prisma.$disconnect();
        return;
    }

    const firstAsset = initialAssets[0];
    console.log(`Asset: ${firstAsset.ticker}, Price: ${firstAsset.currentPrice}`);

    console.log('⚡ Updating price manually...');
    const newPrice = getNewPrice(firstAsset.currentPrice);

    if (newPrice !== firstAsset.currentPrice) {
        await prisma.asset.update({
            where: { id: firstAsset.id },
            data: { currentPrice: newPrice }
        });
        console.log(`✅ Success! Price updated for ${firstAsset.ticker}: ${firstAsset.currentPrice} -> ${newPrice}`);
    } else {
        console.log('⚠️ Price did not change (randomness hit 0).');
    }

    await prisma.$disconnect();
}

verify();
