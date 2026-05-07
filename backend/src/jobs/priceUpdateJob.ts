import cron from 'node-cron';
import { updateAllAssetPrices } from '../services/priceService';

export const startPriceUpdateJob = () => {
    // Schedule task to run every 1 minute for demonstration (usually would be every hour or daily)
    // Cron syntax: * * * * * (minute hour day month day-of-week)
    cron.schedule('*/1 * * * *', async () => {
        console.log('⏰ Cron Job triggered: Price Update');
        await updateAllAssetPrices();
    });

    console.log('🚀 Price Update Job scheduled (runs every 1 minute)');
};
