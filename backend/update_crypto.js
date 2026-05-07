const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

const cryptoMap = {
    'BTC': 'bitcoin', 'ETHERIUM': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
};

async function main() {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: { vs_currency: 'usd', ids: 'bitcoin,ethereum,solana,ripple', price_change_percentage: '24h,7d,30d' },
        headers: { 'User-Agent': 'AssetFlow/1.0' }
    });
    
    const coinData = {};
    res.data.forEach(c => { coinData[c.id] = c; });

    for (const [ticker, coinId] of Object.entries(cryptoMap)) {
        const coin = coinData[coinId];
        if (!coin) { console.log(`No data for ${ticker}`); continue; }
        
        await prisma.asset.updateMany({
            where: { ticker },
            data: {
                currentPrice: coin.current_price,
                change1D: coin.price_change_percentage_24h || 0,
                change5D: coin.price_change_percentage_7d_in_currency || 0,
                change1M: coin.price_change_percentage_30d_in_currency || 0,
                updatedAt: new Date(),
            }
        });
        console.log(`✅ ${ticker}: 1D=${coin.price_change_percentage_24h?.toFixed(2)}% | 7D=${coin.price_change_percentage_7d_in_currency?.toFixed(2)}% | 30D=${coin.price_change_percentage_30d_in_currency?.toFixed(2)}%`);
    }
    console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
