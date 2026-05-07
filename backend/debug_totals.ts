import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany();
    
    let totalBRL = 0;
    let totalUSD_raw = 0;
    
    console.log('\n=== ASSET BREAKDOWN ===\n');
    for (const a of assets) {
        const value = a.quantity * a.currentPrice;
        console.log(`${a.ticker.padEnd(10)} | qty: ${a.quantity.toString().padStart(10)} | price: ${a.currentPrice.toFixed(2).padStart(12)} | currency: ${a.currency} | value: ${value.toFixed(2).padStart(15)} ${a.currency}`);
        
        if (a.currency === 'USD') {
            totalUSD_raw += value;
        } else {
            totalBRL += value;
        }
    }
    
    console.log('\n=== TOTALS ===');
    console.log(`Total BRL (direct):    R$ ${totalBRL.toFixed(2)}`);
    console.log(`Total USD (raw):       US$ ${totalUSD_raw.toFixed(2)}`);
    console.log(`Total USD (x5.70 BRL): R$ ${(totalUSD_raw * 5.70).toFixed(2)}`);
    console.log(`Total USD (x5.80 BRL): R$ ${(totalUSD_raw * 5.80).toFixed(2)}`);
    console.log(`Total w/o conversion:  R$ ${(totalBRL + totalUSD_raw).toFixed(2)} (treating USD as BRL - BUG!)`);
    console.log(`Grand Total (@ 5.70):  R$ ${(totalBRL + totalUSD_raw * 5.70).toFixed(2)}`);
    console.log(`Grand Total (@ 5.80):  R$ ${(totalBRL + totalUSD_raw * 5.80).toFixed(2)}`);
    
    console.log('\n=== ASSETS BY CATEGORY ===');
    const byCategory = new Map<string, { brl: number, usd: number }>();
    for (const a of assets) {
        const val = a.quantity * a.currentPrice;
        const cat = a.category;
        const entry = byCategory.get(cat) || { brl: 0, usd: 0 };
        if (a.currency === 'USD') entry.usd += val;
        else entry.brl += val;
        byCategory.set(cat, entry);
    }
    for (const [cat, val] of byCategory) {
        console.log(`${cat.padEnd(20)} | BRL: ${val.brl.toFixed(2).padStart(12)} | USD: ${val.usd.toFixed(2).padStart(12)}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
