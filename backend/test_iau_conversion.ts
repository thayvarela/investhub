
import axios from 'axios';

const TOKEN = 'sHCJaVprWckgemVUC2RhqX';

async function testIAU() {
    try {
        console.log("--- Testing IAU ---");
        const res = await axios.get(`https://brapi.dev/api/quote/IAU?token=${TOKEN}`);
        const result = res.data.results[0];
        console.log(`Symbol: ${result.symbol}`);
        console.log(`Currency: ${result.currency}`);
        console.log(`Price: ${result.regularMarketPrice}`);
        console.log(`Name: ${result.longName}`);
    } catch (e: any) {
        console.error("IAU Error:", e.message);
    }
}

async function testCurrency() {
    try {
        console.log("\n--- Testing USDBRL via Quote ---");
        const res = await axios.get(`https://brapi.dev/api/quote/USDBRL=X?token=${TOKEN}`);
        const result = res.data.results[0];
        console.log(`Symbol: ${result.symbol}`);
        console.log(`Price (Rate): ${result.regularMarketPrice}`);
    } catch (e: any) {
        console.error("Currency Quote Error:", e.message);
    }
}

async function main() {
    await testIAU();
    await testCurrency();
}

main();
