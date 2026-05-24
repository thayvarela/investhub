import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BRAPI_BASE_URL = 'https://brapi.dev/api';
const DEBUG_LOG_PATH = path.join(__dirname, '../../market_debug.txt');

const logToFile = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(DEBUG_LOG_PATH, logMessage);
    } catch (err) {
        console.error("Failed to write to debug log", err);
    }
};

const SECTOR_MAP: Record<string, { category: string, subCategory: string }> = {
    // Bancos / Financeiro
    'ITUB4': { category: 'Bolsa BR', subCategory: 'Financeiro' },
    'ITUB3': { category: 'Bolsa BR', subCategory: 'Financeiro' },
    'BBDC4': { category: 'Bolsa BR', subCategory: 'Financeiro' },
    'BBDC3': { category: 'Bolsa BR', subCategory: 'Financeiro' },
    'BBAS3': { category: 'Bolsa BR', subCategory: 'Financeiro' },
    'SANB11': { category: 'Bolsa BR', subCategory: 'Financeiro' },
    'BPAC11': { category: 'Bolsa BR', subCategory: 'Financeiro' },

    // Mineração / Materiais
    'VALE3': { category: 'Bolsa BR', subCategory: 'Mineração' },
    'CMIN3': { category: 'Bolsa BR', subCategory: 'Mineração' },
    'GGBR4': { category: 'Bolsa BR', subCategory: 'Siderurgia' },
    'CSNA3': { category: 'Bolsa BR', subCategory: 'Siderurgia' },

    // Petróleo / Energia
    'PETR4': { category: 'Bolsa BR', subCategory: 'Petróleo & Gás' },
    'PETR3': { category: 'Bolsa BR', subCategory: 'Petróleo & Gás' },
    'PRIO3': { category: 'Bolsa BR', subCategory: 'Petróleo & Gás' },
    'ELET3': { category: 'Bolsa BR', subCategory: 'Energia Elétrica' },
    'ELET6': { category: 'Bolsa BR', subCategory: 'Energia Elétrica' },
    'CPLE6': { category: 'Bolsa BR', subCategory: 'Energia Elétrica' },
    'CPLE3': { category: 'Bolsa BR', subCategory: 'Energia Elétrica' },
    'TAEE11': { category: 'Bolsa BR', subCategory: 'Energia Elétrica' },
    'TRPL4': { category: 'Bolsa BR', subCategory: 'Energia Elétrica' },

    // Varejo
    'MGLU3': { category: 'Bolsa BR', subCategory: 'Varejo' },
    'LREN3': { category: 'Bolsa BR', subCategory: 'Varejo' },
    'VIIA3': { category: 'Bolsa BR', subCategory: 'Varejo' }, // BHIA3 now but keep legacy just in case
    'BHIA3': { category: 'Bolsa BR', subCategory: 'Varejo' },
    'RDOR3': { category: 'Bolsa BR', subCategory: 'Saúde' },
    'HAPV3': { category: 'Bolsa BR', subCategory: 'Saúde' },

    // Industriais
    'WEGE3': { category: 'Bolsa BR', subCategory: 'Bens Industriais' },
    'EMBR3': { category: 'Bolsa BR', subCategory: 'Aviação' },

    // Exterior / Ouro / REITs
    'IAU': { category: 'Exterior', subCategory: 'Ouro' },
    'O': { category: 'Exterior', subCategory: 'REITs' },
};

interface PriceData {
    ticker: string;
    currentPrice: number;
    currency: string;
    updatedAt: Date;
    suggestedCategory?: string;
    suggestedSubCategory?: string;
    change1D?: number;
    change5D?: number;
    change1M?: number;
}

// Helper to get USD Rate with multiple fallback sources
let cachedUSDRate: { rate: number; timestamp: number } | null = null;
const USD_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export const fetchUSDRate = async (): Promise<number> => {
    // Return cached rate if still valid
    if (cachedUSDRate && (Date.now() - cachedUSDRate.timestamp) < USD_CACHE_TTL) {
        logToFile(`[USD] Using cached rate: ${cachedUSDRate.rate}`);
        return cachedUSDRate.rate;
    }

    // Source 1: Brapi
    try {
        const token = process.env.BRAPI_TOKEN;
        const res = await axios.get(`${BRAPI_BASE_URL}/quote/USDBRL=X`, { params: { token }, timeout: 5000 });
        const rate = res.data.results?.[0]?.regularMarketPrice;
        if (rate && rate > 1) {
            logToFile(`[USD] Brapi rate: ${rate}`);
            cachedUSDRate = { rate, timestamp: Date.now() };
            return rate;
        }
    } catch (e: any) {
        logToFile(`[USD] Brapi failed: ${e.message}`);
    }

    // Source 2: AwesomeAPI (free, no auth required)
    try {
        const res = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL', { timeout: 5000 });
        const rate = parseFloat(res.data?.USDBRL?.bid);
        if (rate && rate > 1) {
            logToFile(`[USD] AwesomeAPI rate: ${rate}`);
            cachedUSDRate = { rate, timestamp: Date.now() };
            return rate;
        }
    } catch (e: any) {
        logToFile(`[USD] AwesomeAPI failed: ${e.message}`);
    }

    // Source 3: Banco Central do Brasil (PTAX)
    try {
        const today = new Date();
        const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
        const res = await axios.get(`https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dateStr}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`, { timeout: 5000 });
        const rate = res.data?.value?.[0]?.cotacaoVenda;
        if (rate && rate > 1) {
            logToFile(`[USD] BCB PTAX rate: ${rate}`);
            cachedUSDRate = { rate, timestamp: Date.now() };
            return rate;
        }
    } catch (e: any) {
        logToFile(`[USD] BCB PTAX failed: ${e.message}`);
    }

    // Last resort: use cached rate even if expired, or hardcoded fallback
    if (cachedUSDRate) {
        logToFile(`[USD] Using expired cached rate: ${cachedUSDRate.rate}`);
        return cachedUSDRate.rate;
    }

    logToFile(`[USD] ALL SOURCES FAILED. Using emergency fallback of 5.70`);
    return 5.70;
}

// Helper for Crypto
const fetchCryptoPrice = async (id: string, symbol: string): Promise<PriceData | null> => {
    try {
        logToFile(`[CRYPTO] Fetching from CoinGecko: ${id} (${symbol})`);
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
            params: {
                vs_currency: 'usd',
                ids: id,
                price_change_percentage: '24h,7d,30d',
            },
            headers: {
                'User-Agent': 'AssetFlow/1.0'
            }
        });

        if (response.data && response.data.length > 0) {
            const data = response.data[0];
            logToFile(`[CRYPTO] Success: ${id} price is ${data.current_price} USD`);
            return {
                ticker: symbol,
                currentPrice: data.current_price,
                currency: 'USD',
                updatedAt: new Date(data.last_updated) || new Date(),
                suggestedCategory: 'Cripto',
                suggestedSubCategory: 'Coin',
                change1D: data.price_change_percentage_24h || 0,
                change5D: data.price_change_percentage_7d_in_currency || 0,
                change1M: data.price_change_percentage_30d_in_currency || 0
            };
        }
        logToFile(`[CRYPTO] No data found for ${id} in CoinGecko response`);
        return null;
    } catch (error: any) {
        logToFile(`[CRYPTO] Error for ${id}: ${error.message}`);
        console.error(`Crypto Fetch Error for ${id}:`, error.message);
        return null;
    }
}

// Yahoo Finance Fallback for international tickers not in Brapi
const fetchYahooPrice = async (ticker: string): Promise<PriceData | null> => {
    try {
        let queryTicker = ticker;
        // Auto-append .SA for Brazilian stocks (e.g., PETR4, ITUB3, AAPL34, TAEE11)
        if (/^[A-Z]{4}\d{1,2}$/.test(ticker)) {
            queryTicker = `${ticker}.SA`;
        }

        logToFile(`[YAHOO] Fetching from Yahoo Finance: ${queryTicker}`);
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${queryTicker}`, {
            params: {
                interval: '1d',
                range: '1mo'
            },
            headers: {
                'User-Agent': 'AssetFlow/1.0'
            }
        });

        const result = response.data?.chart?.result?.[0];
        if (result) {
            const meta = result.meta;
            const price = meta.regularMarketPrice;
            const currency = meta.currency || 'USD';
            const shortName = meta.shortName || meta.symbol || ticker;

            // Categorize based on currency and type
            let category = 'Exterior';
            let subCategory = 'Ações/ETFs';

            // Check SECTOR_MAP first
            if (SECTOR_MAP[ticker]) {
                category = SECTOR_MAP[ticker].category;
                subCategory = SECTOR_MAP[ticker].subCategory;
            } else if (meta.quoteType === 'ETF') {
                subCategory = 'ETFs';
            } else if (meta.quoteType === 'MUTUALFUND') {
                subCategory = 'Fundos';
            } else if (meta.quoteType === 'CRYPTOCURRENCY') {
                category = 'Cripto';
                subCategory = 'Coin';
            }

            let change5D = 0;
            let change1M = 0;
            const closePrices = result.indicators?.quote?.[0]?.close || [];
            if (closePrices.length > 0) {
                const validPrices = closePrices.filter((p: number | null) => p !== null);
                if (validPrices.length > 0) {
                    const latestClose = validPrices[validPrices.length - 1] || price;
                    const idx5D = Math.max(0, validPrices.length - 6); // 5 previous days
                    const price5D = validPrices[idx5D];
                    if (price5D) change5D = ((latestClose - price5D) / price5D) * 100;

                    const price1M = validPrices[0];
                    if (price1M) change1M = ((latestClose - price1M) / price1M) * 100;
                }
            }

            logToFile(`[YAHOO] Found: ${ticker} = ${price} ${currency} (${category}/${subCategory})`);
            return {
                ticker: meta.symbol || ticker,
                currentPrice: price,
                currency: currency,
                updatedAt: new Date(meta.regularMarketTime * 1000) || new Date(),
                suggestedCategory: category,
                suggestedSubCategory: subCategory,
                change1D: meta.regularMarketChangePercent || 0,
                change5D: change5D,
                change1M: change1M
            };
        }

        logToFile(`[YAHOO] No data found for ${ticker}`);
        return null;
    } catch (error: any) {
        logToFile(`[YAHOO] Error for ${ticker}: ${error.message}`);
        console.error(`Yahoo Finance Error for ${ticker}:`, error.message);
        return null;
    }
};

export const fetchAssetPrice = async (ticker: string): Promise<PriceData | null> => {
    let cleanTicker = ticker.toUpperCase().trim();
    try {
        logToFile(`[SERVICE] fetchAssetPrice entry: "${cleanTicker}"`);

        // Normalize ticker if it contains a dot (common for US stock classes like BRK.B -> BRK-B)
        if (cleanTicker.includes('.')) {
            const normalized = cleanTicker.replace('.', '-');
            logToFile(`[SERVICE] Normalizing ticker: ${cleanTicker} -> ${normalized}`);
            cleanTicker = normalized;
        }

        // 0. Crypto Overrides (Aliases and popular coins)
        const cryptoMap: Record<string, string> = {
            'BITCOIN': 'bitcoin',
            'BTC': 'bitcoin',
            'ETHEREUM': 'ethereum',
            'ETHERIUM': 'ethereum', // Common misspelling
            'ETH': 'ethereum',
            'ETHER': 'ethereum',
            'SOLANA': 'solana',
            'SOL': 'solana',
            'CARDANO': 'cardano',
            'ADA': 'cardano',
            'RIPPLE': 'ripple',
            'XRP': 'ripple',
            'POLKADOT': 'polkadot',
            'DOT': 'polkadot',
            'DOGECOIN': 'dogecoin',
            'DOGE': 'dogecoin',
            'POLYGON': 'matic-network',
            'MATIC': 'matic-network',
            'AVALANCHE': 'avalanche-2',
            'AVAX': 'avalanche-2',
            'CHAINLINK': 'chainlink',
            'LINK': 'chainlink',
            'UNISWAP': 'uniswap',
            'UNI': 'uniswap',
            'LITECOIN': 'litecoin',
            'LTC': 'litecoin',
            'SHIBA': 'shiba-inu',
            'SHIB': 'shiba-inu',
            'BNB': 'binancecoin',
        };

        if (cryptoMap[cleanTicker]) {
            const coinId = cryptoMap[cleanTicker];
            logToFile(`[SERVICE] Crypto match found: ${cleanTicker} -> ${coinId}`);
            return await fetchCryptoPrice(coinId, cleanTicker.length > 5 ? (cleanTicker === 'BITCOIN' ? 'BTC' : (cleanTicker.includes('ETHER') ? 'ETH' : cleanTicker)) : cleanTicker);
        }

        // TEMPORARY: Bypass Brapi due to rate limits and use Yahoo Finance directly
        logToFile(`[SERVICE] Bypassing Brapi temporarily due to limits. Fetching price for: ${cleanTicker} via Yahoo Finance`);
        const yahooResult = await fetchYahooPrice(cleanTicker);
        if (yahooResult) {
            return yahooResult;
        }
        logToFile(`[FALLBACK] No results from Yahoo Finance for ${cleanTicker}`);
        return null;

    } catch (error: any) { // Explicitly type error as 'any' or 'unknown' for broader catch
        logToFile(`Error fetching ${cleanTicker}: ${error.message}`);
        console.error(`Error fetching price for ${cleanTicker}:`, error);
        return null;
    }
};

export const searchSymbol = async (query: string): Promise<any[]> => {
    try {
        // TEMPORARY: Bypass Brapi search and use Yahoo Finance autocomplete
        const response = await axios.get(`https://query2.finance.yahoo.com/v1/finance/search`, {
            params: { q: query },
            headers: { 'User-Agent': 'AssetFlow/1.0' }
        });

        let results: any[] = [];
        if (response.data && response.data.quotes) {
            results = response.data.quotes
                .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'MUTUALFUND')
                .map((q: any) => {
                    let ticker = q.symbol;
                    // Remove .SA suffix for Brazilian stocks to keep UI clean
                    if (ticker.endsWith('.SA')) {
                        ticker = ticker.replace('.SA', '');
                    }
                    return {
                        ticker: ticker,
                        name: q.shortname || q.longname || ticker,
                        currency: q.exchange === 'SAO' ? 'BRL' : 'USD'
                    };
                });
        }

        const exactMatch = query.toUpperCase();
        const popularCrypto = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'LTC', 'SHIB', 'BNB'];
        if (popularCrypto.includes(exactMatch) && !results.find((r: any) => r.ticker === exactMatch)) {
            results = [{ ticker: exactMatch, name: `Cripto: ${exactMatch}`, currency: 'USD' }, ...results];
        } else {
            const exists = results.find((r: any) => r.ticker === exactMatch);
            if (!exists) {
                results = [{ ticker: exactMatch, name: `Ticker: ${exactMatch}`, currency: exactMatch.length <= 3 ? 'USD' : 'BRL' }, ...results];
            }
        }

        return results;
    } catch (error) {
        console.error("Search Symbol Error", error);
        return [];
    }
};
