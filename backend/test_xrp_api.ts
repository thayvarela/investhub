
import axios from 'axios';

async function main() {
    try {
        console.log("Testing fetchAssetPrice for XRP...");
        // This won't work easily because I need the service instance and dependencies.
        // Let's just test the API call like a client would.
        const response = await axios.get('http://localhost:3001/assets/price/XRP');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        if (e.response) {
            console.error('Error status:', e.response.status);
            console.error('Error data:', e.response.data);
        } else {
            console.error('Error message:', e.message);
        }
    }
}

main();
