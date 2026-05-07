import { PluggyClient, Investment, Account } from 'pluggy-sdk';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const LOG_FILE = path.join(__dirname, '../../pluggy_debug.txt');

const logToFile = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logMsg);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
};

const CLIENT_ID = process.env.PLUGGY_CLIENT_ID;
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing Pluggy Credentials in .env");
}

const client = new PluggyClient({
    clientId: CLIENT_ID || '',
    clientSecret: CLIENT_SECRET || '',
});

export const getConnectToken = async (itemId?: string) => {
    try {
        const data = await client.createConnectToken(itemId);
        return data.accessToken;
    } catch (error) {
        console.error("Error creating connect token:", error);
        throw new Error("Failed to create connect token");
    }
};

export const syncItem = async (userId: string, itemId: string) => {
    try {
        logToFile(`[SYNC START] Syncing item ${itemId} for user ${userId}`);

        // Polling existing Item Status
        let attempts = 0;
        let item = await client.fetchItem(itemId);

        logToFile(`Initial Item Status: ${item.status}`);

        while (item.status === 'UPDATING' || item.status === 'WAITING_USER_INPUT') {
            if (attempts > 20) break; // 40 seconds timeout
            await new Promise(r => setTimeout(r, 2000));
            item = await client.fetchItem(itemId);
            logToFile(`Polling Item Status (${attempts}): ${item.status}`);
            attempts++;
        }

        if (item.status === 'LOGIN_ERROR' || item.status === 'OUTDATED') {
            logToFile(`[SYNC ERROR] Item status invalid: ${item.status}`);
            throw new Error(`Pluggy Sync Failed: ${item.status}`);
        }

        // 1. Fetch Investments & Accounts
        const investments = await client.fetchInvestments(itemId);
        logToFile(`Investments fetched: ${investments.results.length}`);

        const accounts = await client.fetchAccounts(itemId);
        logToFile(`Accounts fetched: ${accounts.results.length}`);

        // 2. Prepare Assets Logic
        const allNewAssets: any[] = [];
        const tickersToSync: string[] = [];

        // PROCESS INVESTMENTS
        for (const inv of investments.results) {
            let ticker = inv.code || inv.name;
            // Clean ticker if necessary (e.g., remove trailing F like PETR4F)
            if (ticker && ticker.length > 5 && ticker.endsWith('F')) {
                // simple heuristic, be careful not to break funds
            }

            const name = inv.name;
            const quantity = inv.quantity || inv.balance || 1;

            // Logic for price: Prefer 'value' (total) / quantity. 
            // If value is missing, use balance.
            let totalValue = inv.value || inv.balance;
            let currentPrice = 0;

            if (quantity && quantity !== 0) {
                currentPrice = totalValue / quantity;
            } else {
                currentPrice = totalValue; // Fallback
            }

            let category = 'Outros';
            let subCategory = 'Geral';

            if (inv.type === 'EQUITY' || inv.type === 'ETF') {
                category = 'Bolsa BR';
                subCategory = inv.subtype || 'Ações';
            } else if (inv.type === 'FIXED_INCOME') {
                category = 'Renda Fixa';
                subCategory = inv.subtype || 'CDB';
            } else if (inv.type === 'MUTUAL_FUND') {
                category = 'Fundos';
                subCategory = inv.subtype || 'Multimercado';
            } else if (inv.currencyCode !== 'BRL') {
                category = 'Exterior';
                subCategory = 'Stocks';
            }

            allNewAssets.push({
                ticker,
                name,
                quantity,
                averagePrice: currentPrice, // In Sync, avg price is often just current unless we have history
                currentPrice,
                category,
                subCategory,
                isManual: false
            });
            tickersToSync.push(ticker);
        }

        // PROCESS ACCOUNTS (Balances)
        for (const acc of accounts.results) {
            if (acc.balance <= 0) continue;

            const ticker = `SALDO-${acc.number?.slice(-4) || 'ACC'}`;
            allNewAssets.push({
                ticker: ticker,
                name: `${acc.name} - Saldo`,
                quantity: 1,
                averagePrice: acc.balance,
                currentPrice: acc.balance,
                category: 'Renda Fixa',
                subCategory: 'Saldo em Conta',
                isManual: false
            });
            // We generally don't delete manual "Saldo" unless exact match, which is rare.
        }

        // 3. CONFLICT RESOLUTION: Delete Manual Assets that match incoming Pluggy Tickers
        // This ensures "Pluggy overrides Manual" behavior.
        if (tickersToSync.length > 0) {
            const deleted = await prisma.asset.deleteMany({
                where: {
                    userId,
                    ticker: { in: tickersToSync },
                    isManual: true
                }
            });
            logToFile(`[CONFLICT] Deleted ${deleted.count} manual assets that overlapped with Pluggy import.`);
        }

        // 4. CLEAR OLD PLUGGY ASSETS (To avoid duplication if re-syncing same item)
        // Ideally we delete ONLY assets associated with this ITEM, but our schema doesn't have itemId on Asset yet.
        // For now, we unfortunately delete ALL non-manual assets for this user to ensure clean state.
        // IMPROVEMENT: Add 'itemId' to Asset model later to delete only specific connection assets.
        await prisma.asset.deleteMany({
            where: {
                userId,
                isManual: false
            }
        });
        logToFile(`[CLEANUP] Deleted old Open Finance assets for user.`);

        // 5. INSERT NEW ASSETS
        let processedCount = 0;
        for (const assetData of allNewAssets) {
            await prisma.asset.create({
                data: {
                    userId,
                    ...assetData
                }
            });
            processedCount++;
        }

        logToFile(`[SYNC SUCCESS] Successfully imported ${processedCount} assets.`);
        return { success: true, count: processedCount };

    } catch (error) {
        logToFile("[SYNC CRITICAL ERROR]", error);
        console.error("Error syncing item:", error);
        throw new Error("Failed to sync item");
    }
};
