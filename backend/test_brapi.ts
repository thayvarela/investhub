
const axios = require('axios');

async function test() {
    const token = "sHCJaVprWckgemVUC2RhqX";
    const tickers = ['ITUB4', 'CPLE6', 'MXRF11'];

    for (const t of tickers) {
        try {
            console.log(`Fetching ${t}...`);
            const res = await axios.get(`https://brapi.dev/api/quote/${t}?token=${token}`);
            const result = res.data.results[0];
            console.log(`--- ${t} ---`);
            console.log("Sector:", result.sector);
            console.log("Type:", result.type); // sometimes exists?
            console.log("ShortServerName:", result.shortName);
            console.log("Full Object Keys:", Object.keys(result));
        } catch (e) {
            console.error(e.message);
        }
    }
}

test();
