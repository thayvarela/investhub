// Force update all assets with change1D, change5D, change1M
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// We need to use ts-node for the marketDataService, so let's inline a simpler approach
const axios = require('axios');
require('dotenv').config();

const BRAPI_BASE_URL = 'https://brapi.dev/api';

const cryptoMap = {
    'BITCOIN': 'bitcoin', 'BTC': 'bitcoin',
    'ETHEREUM': 'ethereum', 'ETHERIUM': 'ethereum', 'ETH': 'ethereum',
    'SOLANA': 'solana', 'SOL': 'solana',
    'RIPPLE': 'ripple', 'XRP': 'ripple',
};

async function fetchCrypto(id, symbol) {
    try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_last_updated_at=true&include_24hr_change=true&price_change_percentage=24h,7d,30d`, {
            headers: { 'User-Agent': 'AssetFlow/1.0' }
        });
        if (res.data && res.data[id]) {
            const d = res.data[id];
            return {
                currentPrice: d.usd,
                currency: 'USD',
                change1D: d.usd_24h_change || 0,
                change5D: d.usd_7d_change || 0,
                change1M: d.usd_30d_change || 0,
            };
        }
    } catch (e) {
        console.log(`  [CRYPTO SKIP] ${symbol}: ${e.message}`);
    }
    return null;
}

async function fetchBrapi(ticker) {
    try {
        const token = process.env.BRAPI_TOKEN;
        const res = await axios.get(`${BRAPI_BASE_URL}/quote/${ticker}`, {
            params: { range: '1mo', interval: '1d', token }
        });
        const results = res.data.results;
        if (results && results.length > 0) {
            const r = results[0];
            const price = r.regularMarketPrice;
            let change5D = 0, change1M = 0;
            if (r.historicalDataPrice && r.historicalDataPrice.length > 0) {
                const hist = r.historicalDataPrice;
                const idx5D = Math.max(0, hist.length - 6);
                const p5D = hist[idx5D]?.close;
                if (p5D) change5D = ((price - p5D) / p5D) * 100;
                const p1M = hist[0]?.close;
                if (p1M) change1M = ((price - p1M) / p1M) * 100;
            }
            return {
                currentPrice: price,
                currency: r.currency || 'BRL',
                change1D: r.regularMarketChangePercent || 0,
                change5D,
                change1M,
            };
        }
    } catch (e) {
        console.log(`  [BRAPI SKIP] ${ticker}: ${e.message}`);
    }
    return null;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const assets = await prisma.asset.findMany();
    console.log(`Found ${assets.length} assets to update.\n`);

    for (const asset of assets) {
        const upper = asset.ticker.toUpperCase();
        let data = null;

        if (cryptoMap[upper]) {
            console.log(`[CRYPTO] ${asset.ticker} -> ${cryptoMap[upper]}`);
            data = await fetchCrypto(cryptoMap[upper], upper);
            await sleep(1500); // CoinGecko rate limit
        } else if (upper === 'DOLAR' || upper === 'IPCA') {
            console.log(`[SKIP] ${asset.ticker} (manual only)`);
            continue;
        } else {
            console.log(`[BRAPI] ${asset.ticker}`);
            data = await fetchBrapi(upper);
            await sleep(300); // Brapi rate limit
        }

        if (data) {
            await prisma.asset.update({
                where: { id: asset.id },
                data: {
                    currentPrice: data.currentPrice,
                    currency: data.currency,
                    change1D: data.change1D,
                    change5D: data.change5D,
                    change1M: data.change1M,
                    updatedAt: new Date(),
                },
            });
            console.log(`  ✅ ${asset.ticker}: 1D=${data.change1D?.toFixed(2)}% | 5D=${data.change5D?.toFixed(2)}% | 1M=${data.change1M?.toFixed(2)}%`);
        } else {
            console.log(`  ❌ ${asset.ticker}: no data`);
        }
    }

    console.log('\nDone! Verifying...');
    const sample = await prisma.asset.findMany({ select: { ticker: true, change1D: true, change5D: true, change1M: true }, take: 5 });
    console.log(JSON.stringify(sample, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
