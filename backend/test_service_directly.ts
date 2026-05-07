
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { fetchAssetPrice } from './src/services/marketDataService';

async function test() {
    console.log("--- Testing IAU Service Logic ---");
    const result = await fetchAssetPrice('IAU');
    console.log(JSON.stringify(result, null, 2));

    console.log("\n--- Testing Apple (AAPL) for USD/Exterior Suggestion ---");
    const result2 = await fetchAssetPrice('AAPL');
    console.log(JSON.stringify(result2, null, 2));
}

test();
