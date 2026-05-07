import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';

const assetSchema = z.object({
    ticker: z.string(),
    name: z.string(),
    quantity: z.number().nonnegative(),
    averagePrice: z.number().nonnegative(),
    currentPrice: z.number().nonnegative(),
    currency: z.string().default("BRL"),
    category: z.string(),
    subCategory: z.string(),
    change1D: z.number().optional(),
    change5D: z.number().optional(),
    change1M: z.number().optional(),
    isManual: z.boolean(),
});

const batchAssetSchema = z.array(
    assetSchema.extend({
        id: z.string().optional(), // If present, update. If not, create? Or matching logic.
        // The requirement says "Atualização em lote".
    })
);

export const getAssets = async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            where: { userId: req.user!.id },
        });
        return res.json(assets);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch assets' });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    try {
        const data = assetSchema.parse(req.body);
        const userId = req.user!.id;

        // Check if asset already exists for this user
        const existingAsset = await prisma.asset.findFirst({
            where: {
                userId,
                ticker: data.ticker
            }
        });

        if (existingAsset) {
            const newQuantity = existingAsset.quantity + data.quantity;
            // Weighted average price calculation: (Q1*P1 + Q2*P2) / (Q1+Q2)
            const newAveragePrice = ((existingAsset.quantity * existingAsset.averagePrice) + (data.quantity * data.averagePrice)) / newQuantity;

            const updatedAsset = await prisma.asset.update({
                where: { id: existingAsset.id },
                data: {
                    ...data,
                    quantity: newQuantity,
                    averagePrice: newAveragePrice,
                },
            });
            return res.json(updatedAsset);
        }

        const asset = await prisma.asset.create({
            data: {
                ...data,
                userId,
            },
        });
        return res.status(201).json(asset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Create Asset Error:", error);
        return res.status(500).json({ error: 'Failed to create asset' });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = assetSchema.partial().parse(req.body);

        const asset = await prisma.asset.findUnique({ where: { id } });
        if (!asset || asset.userId !== req.user!.id) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        const updatedAsset = await prisma.asset.update({
            where: { id },
            data,
        });
        return res.json(updatedAsset);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to update asset' });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findUnique({ where: { id } });

        if (!asset || asset.userId !== req.user!.id) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        await prisma.asset.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete asset' });
    }
};

// Batch update for rebalancing or sync
export const batchUpdateAssets = async (req: Request, res: Response) => {
    try {
        const assetsToUpdate = z.array(assetSchema.extend({ id: z.string() })).parse(req.body);

        // Using transaction for batch update relies on multiple update calls or a fancy raw query.
        // simpler to loop in transaction.
        await prisma.$transaction(
            assetsToUpdate.map(asset => {
                const { id, ...data } = asset;
                // Verify ownership (simplified) - in prod, better to fetch all IDs first.
                // For now, assuming standard usage.
                return prisma.asset.updateMany({
                    where: { id, userId: req.user!.id },
                    data
                });
            })
        );

        return res.status(200).json({ message: 'Batch update successful' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        return res.status(500).json({ error: 'Failed to batch update' });
    }
};

export const refreshAssetPrice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findUnique({ where: { id } });

        if (!asset || asset.userId !== req.user!.id) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        if (!asset.isManual) {
            return res.status(400).json({ error: 'Only manual assets can be refreshed manually.' });
        }

        const { fetchAssetPrice } = require('../services/marketDataService'); // Dynamic import to avoid circular dep issues if any
        const priceData = await fetchAssetPrice(asset.ticker);

        if (!priceData) {
            return res.status(404).json({ error: 'Price data not found for this ticker.' });
        }

        const updatedAsset = await prisma.asset.update({
            where: { id },
            data: {
                currentPrice: priceData.currentPrice,
                currency: priceData.currency,
                change1D: priceData.change1D || asset.change1D,
                change5D: priceData.change5D || asset.change5D,
                change1M: priceData.change1M || asset.change1M,
                // Optional: Update name or other metadata if available from API
            }
        });

        return res.json(updatedAsset);
    } catch (error) {
        console.error("Refresh Price Error", error);
        return res.status(500).json({ error: 'Failed to refresh price' });
    }
};

export const getAssetPrice = async (req: Request, res: Response) => {
    try {
        const { ticker } = req.params;
        if (!ticker) return res.status(400).json({ error: 'Ticker is required' });

        const { fetchAssetPrice } = require('../services/marketDataService');
        const priceData = await fetchAssetPrice(ticker.toUpperCase());

        if (!priceData) {
            return res.status(404).json({ error: 'Price not found' });
        }

        return res.json(priceData);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch price' });
    }
};

export const searchAssets = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required' });
        }

        const { searchSymbol } = require('../services/marketDataService');
        const results = await searchSymbol(query);

        return res.json(results);
    } catch (error) {
        console.error("Search Error", error);
        return res.status(500).json({ error: 'Failed to search assets' });
    }
};

export const getQuotes = async (req: Request, res: Response) => {
    try {
        const { fetchUSDRate } = require('../services/marketDataService');
        const rate = await fetchUSDRate();
        return res.json({ USDBRL: rate });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};
