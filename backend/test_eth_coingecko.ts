
import axios from 'axios';

async function main() {
    try {
        console.log("Testing CoinGecko for Ethereum...");
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=brl&include_last_updated_at=true');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        console.error(e.message);
    }
}

main();
