import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { fetchUSDRate } from '../services/marketDataService';

export const getHistory = async (req: Request, res: Response) => {
    try {
        const history = await prisma.portfolioHistory.findMany({
            where: { userId: req.user!.id },
            orderBy: { date: 'asc' },
        });
        return res.json(history);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
};

export const getReturns = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get current portfolio value by computing from live assets
        const assets = await prisma.asset.findMany({ where: { userId } });
        const usdRate = await fetchUSDRate();

        let currentValue = 0;
        let totalInvested = 0;

        assets.forEach(a => {
            const rate = a.currency === 'USD' ? usdRate : 1;
            currentValue += (a.quantity * a.currentPrice) * rate;
            totalInvested += (a.quantity * a.averagePrice) * rate;
        });

        // Get all history snapshots ordered by date descending
        const history = await prisma.portfolioHistory.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });

        // Helper: find the closest snapshot to a target date (looking backwards)
        const findSnapshotNear = (daysAgo: number) => {
            const target = new Date();
            target.setDate(target.getDate() - daysAgo);
            target.setHours(0, 0, 0, 0);

            // Find the snapshot closest to the target date (allow +/- 2 days tolerance)
            let best = null;
            let bestDiff = Infinity;

            for (const snap of history) {
                const snapDate = new Date(snap.date);
                const diff = Math.abs(snapDate.getTime() - target.getTime());
                if (diff < bestDiff) {
                    bestDiff = diff;
                    best = snap;
                }
            }

            // Only return if the best match is within 3 days of the target
            if (best && bestDiff <= 3 * 86400000) {
                return best;
            }
            return null;
        };

        // Calculate returns for each period
        const calcReturn = (pastValue: number | null) => {
            if (pastValue === null || pastValue === 0) return null;
            const diff = currentValue - pastValue;
            const pct = (diff / pastValue) * 100;
            return { value: diff, percentage: pct };
        };

        const snap1D = findSnapshotNear(1);
        const snap7D = findSnapshotNear(7);
        const snap30D = findSnapshotNear(30);

        // Total return: current vs invested
        const totalReturn = totalInvested > 0
            ? { value: currentValue - totalInvested, percentage: ((currentValue - totalInvested) / totalInvested) * 100 }
            : { value: 0, percentage: 0 };

        const returns = {
            currentValue,
            totalInvested,
            periods: {
                '1D': snap1D ? calcReturn(snap1D.totalValue) : null,
                '7D': snap7D ? calcReturn(snap7D.totalValue) : null,
                '1M': snap30D ? calcReturn(snap30D.totalValue) : null,
                'Total': totalReturn,
            }
        };

        return res.json(returns);
    } catch (error) {
        console.error('Error computing returns:', error);
        return res.status(500).json({ error: 'Failed to compute returns' });
    }
};

export const exportHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const usdRate = await fetchUSDRate();

        // Get all history snapshots with asset details, ordered by date desc
        const history = await prisma.portfolioHistory.findMany({
            where: { userId },
            include: {
                assetSnapshots: true
            },
            orderBy: { date: 'desc' },
        });

        // Generate CSV content
        const headers = ['Data', 'Ticker', 'Nome', 'Categoria', 'Sub-Categoria', 'Moeda', 'Quantidade', 'Preço Médio', 'Preço Atual', 'Total (BRL)', 'Variação %'];
        const rows: string[] = [];

        for (const snap of history) {
            const dateStr = new Date(snap.date).toISOString().slice(0, 10); // YYYY-MM-DD
            
            if (snap.assetSnapshots && snap.assetSnapshots.length > 0) {
                for (const asset of snap.assetSnapshots) {
                    const rate = asset.currency === 'USD' ? usdRate : 1;
                    const total = asset.quantity * asset.currentPrice * rate;
                    const variation = asset.averagePrice > 0
                        ? ((asset.currentPrice - asset.averagePrice) / asset.averagePrice * 100).toFixed(2)
                        : '0.00';
                    
                    rows.push([
                        dateStr,
                        asset.ticker,
                        asset.name,
                        asset.category,
                        asset.subCategory,
                        asset.currency,
                        asset.quantity.toString(),
                        asset.averagePrice.toFixed(2),
                        asset.currentPrice.toFixed(2),
                        total.toFixed(2),
                        variation
                    ].map(v => `"${v}"`).join(','));
                }
            } else {
                // Fallback for old history without asset details
                rows.push([
                    dateStr,
                    'PORTFOLIO_TOTAL',
                    'Total do Portfólio (Histórico)',
                    'Geral',
                    'Geral',
                    'BRL',
                    '1',
                    snap.totalInvested.toFixed(2),
                    snap.totalValue.toFixed(2),
                    snap.totalValue.toFixed(2),
                    snap.totalInvested > 0 ? (((snap.totalValue - snap.totalInvested) / snap.totalInvested) * 100).toFixed(2) : '0.00'
                ].map(v => `"${v}"`).join(','));
            }
        }

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=historico_carteira_${new Date().toISOString().slice(0, 10)}.csv`);
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error('Error exporting history:', error);
        return res.status(500).json({ error: 'Failed to export history' });
    }
};

