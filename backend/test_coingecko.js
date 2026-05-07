const axios = require('axios');
async function test() {
    // Use coins/markets endpoint which gives proper change data
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
            vs_currency: 'usd',
            ids: 'bitcoin,ethereum,solana,ripple',
            price_change_percentage: '24h,7d,30d',
        },
        headers: { 'User-Agent': 'AssetFlow/1.0' }
    });
    res.data.forEach(coin => {
        console.log(`${coin.symbol.toUpperCase()}: price=${coin.current_price}, 1D=${coin.price_change_percentage_24h}, 7D=${coin.price_change_percentage_7d_in_currency}, 30D=${coin.price_change_percentage_30d_in_currency}`);
    });
    console.log('\nFull first coin keys:', Object.keys(res.data[0]).join(', '));
}
test().catch(e => console.error(e.response?.status, e.message));
