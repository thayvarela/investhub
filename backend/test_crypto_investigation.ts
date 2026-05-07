
import axios from 'axios';

async function main() {
    try {
        console.log("Testing CoinGecko...");
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
        console.log(response.data);
    } catch (e: any) {
        console.error(e.message);
    }
}

main();
