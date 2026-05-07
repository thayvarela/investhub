const { PrismaClient } = require('@prisma/client');
const { fetchAssetPrice } = require('./src/services/marketDataService');
const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany();
    console.log(`Found ${assets.length} assets. Updating...`);
    for (const asset of assets) {
        if (!asset.isManual) {
            console.log(`Fetching price for ${asset.ticker}...`);
            const priceData = await fetchAssetPrice(asset.ticker);
            if (priceData) {
                await prisma.asset.update({
                    where: { id: asset.id },
                    data: {
                        currentPrice: priceData.currentPrice,
                        currency: priceData.currency,
                        change1D: priceData.change1D || asset.change1D,
                        change5D: priceData.change5D || asset.change5D,
                        change1M: priceData.change1M || asset.change1M,
                    }
                });
                console.log(`Updated ${asset.ticker}`);
            }
        }
    }
    console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
