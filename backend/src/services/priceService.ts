import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';
import { fetchAssetPrice, fetchUSDRate } from './marketDataService';

export const updateAllAssetPrices = async () => {
    try {
        console.log('🔄 Starting automated price update with REAL market data...');
        const assets = await prisma.asset.findMany();

        let updatedCount = 0;

        for (const asset of assets) {
            try {
                const priceData = await fetchAssetPrice(asset.ticker);

                if (priceData && priceData.currentPrice !== asset.currentPrice) {
                    await prisma.asset.update({
                        where: { id: asset.id },
                        data: {
                            currentPrice: priceData.currentPrice,
                            currency: priceData.currency || asset.currency,
                            change1D: priceData.change1D || asset.change1D,
                            change5D: priceData.change5D || asset.change5D,
                            change1M: priceData.change1M || asset.change1M,
                            updatedAt: new Date()
                        }
                    });
                    updatedCount++;
                } else if (priceData && (priceData.change1D !== asset.change1D || priceData.change5D !== (asset.change5D || 0) || priceData.change1M !== (asset.change1M || 0))) {
                     // Update even if price is same but changes differ
                     await prisma.asset.update({
                        where: { id: asset.id },
                        data: {
                            change1D: priceData.change1D,
                            change5D: priceData.change5D || 0,
                            change1M: priceData.change1M || 0,
                            updatedAt: new Date()
                        }
                    });
                    updatedCount++;
                }
            } catch (err) {
                console.error(`Error updating asset ${asset.ticker}:`, err);
            }
        }

        // Take a snapshot for the Portfolio Evolution chart
        await takePortfolioSnapshot();

        console.log(`✅ Updated REAL prices for ${updatedCount} assets.`);
    } catch (error) {
        console.error('❌ Error in automated price update loop:', error);
    }
};

export const takePortfolioSnapshot = async () => {
    try {
        console.log('📸 Taking portfolio snapshots for all users...');
        const users = await prisma.user.findMany({
            include: { assets: true }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usdRate = await fetchUSDRate();

        for (const user of users) {
             let totalVal = 0;
             let totalInv = 0;
             
             user.assets.forEach(a => {
                const rate = a.currency === 'USD' ? usdRate : 1;
                totalVal += (a.quantity * a.currentPrice) * rate;
                totalInv += (a.quantity * a.averagePrice) * rate;
             });

             if (totalVal > 0) {
                 // Check if user already has a snapshot for today
                 const existingToday = await prisma.portfolioHistory.findFirst({
                     where: {
                         userId: user.id,
                         date: {
                             gte: today
                         }
                     }
                 });

                 if (!existingToday) {
                     await prisma.portfolioHistory.create({
                         data: {
                             userId: user.id,
                             totalValue: totalVal,
                             totalInvested: totalInv,
                             // date defaults to now()
                         }
                     });
                 }
             }
        }
        console.log(`✅ Snapshot process finished for ${users.length} users.`);
    } catch (err) {
        console.error('❌ Error taking snapshots:', err);
    }
}
