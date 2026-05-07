
const axios = require('axios');

async function test() {
    const token = "sHCJaVprWckgemVUC2RhqX";
    const tickers = ['CPLE6'];

    for (const t of tickers) {
        try {
            console.log(`Fetching List for ${t}...`);
            const res = await axios.get(`https://brapi.dev/api/quote/list?search=${t}&token=${token}`);

            if (res.data.stocks && res.data.stocks.length > 0) {
                const result = res.data.stocks[0];
                console.log("Sector Value:", result.sector || "NOT FOUND");
                console.log("Name:", result.name);
                console.log("Full Keys:", Object.keys(result));
            } else {
                console.log("No stocks found in list.");
            }
        } catch (e) {
            console.error(e.message);
        }
    }
}

test();
