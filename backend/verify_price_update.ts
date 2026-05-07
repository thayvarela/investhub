import { updateAllAssetPrices } from './src/services/priceService';
import prisma from './src/utils/prisma';

async function verify() {
    console.log('🔍 Checking initial prices...');
    const initialAssets = await prisma.asset.findMany();
    if (initialAssets.length === 0) {
        console.log('⚠️ No assets found to update.');
        return;
    }

    const firstAsset = initialAssets[0];
    console.log(`Asset: ${firstAsset.ticker}, Price: ${firstAsset.currentPrice}`);

    console.log('⚡ Running price update service manually...');
    await updateAllAssetPrices();

    const updatedAssets = await prisma.asset.findMany();
    const updatedAsset = updatedAssets.find(a => a.id === firstAsset.id);

    if (updatedAsset && updatedAsset.currentPrice !== firstAsset.currentPrice) {
        console.log(`✅ Success! Price updated for ${firstAsset.ticker}: ${firstAsset.currentPrice} -> ${updatedAsset.currentPrice}`);
    } else {
        console.log('⚠️ Price did not change (random variation might be small or logic failed).');
        console.log(`Old: ${firstAsset.currentPrice}, New: ${updatedAsset?.currentPrice}`);
    }

    await prisma.$disconnect();
}

verify();
