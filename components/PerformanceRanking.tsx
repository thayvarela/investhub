import React, { useState, useMemo } from 'react';
import { Asset, PerformancePeriod } from '../types';
import { Card } from './ui/Card';

interface RankingRowProps {
  asset: Asset;
  type: 'gain' | 'loss';
  value: number;
}

const RankingRow: React.FC<RankingRowProps> = ({ asset, type, value }) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
          type === 'gain' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {asset.ticker.slice(0, 2)}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{asset.ticker}</div>
          <div className="text-xs text-slate-500">{asset.name.length > 20 ? asset.name.substring(0, 20) + '...' : asset.name}</div>
        </div>
      </div>
      <div className={`text-sm font-bold ${type === 'gain' ? 'text-emerald-400' : 'text-red-400'}`}>
        {type === 'gain' ? '+' : ''}{value.toFixed(2)}%
      </div>
    </div>
  );
};

interface PerformanceRankingProps {
  assets: Asset[];
}

export const PerformanceRanking: React.FC<PerformanceRankingProps> = ({ assets }) => {
  const [period, setPeriod] = useState<PerformancePeriod>('5D');

  const getPerformance = (asset: Asset, p: PerformancePeriod) => {
    switch (p) {
      case '1D': return asset.change1D;
      case '5D': return asset.change5D;
      case '1M': return asset.change1M;
      case 'YTD': return asset.changeYTD;
      default: return 0;
    }
  };

  const { gainers, losers } = useMemo(() => {
    const sorted = [...assets].sort((a, b) => getPerformance(b, period) - getPerformance(a, period));
    // Top 5 gainers
    const gainers = sorted.slice(0, 5).filter(a => getPerformance(a, period) > 0);
    // Bottom 5 losers (reverse order of sorted end)
    const losers = sorted.slice().reverse().slice(0, 5).filter(a => getPerformance(a, period) < 0);
    
    return { gainers, losers };
  }, [assets, period]);

  const PeriodButton = ({ p, label }: { p: PerformancePeriod, label: string }) => (
    <button
      onClick={() => setPeriod(p)}
      className={`px-3 py-1 text-xs font-medium rounded transition-colors border ${
        period === p 
          ? 'bg-brand-600 border-brand-500 text-white' 
          : 'bg-transparent border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card 
        title="Maiores Altas" 
        action={
          <div className="flex space-x-1">
             <PeriodButton p="1D" label="24h" />
             <PeriodButton p="5D" label="5D" />
             <PeriodButton p="1M" label="1M" />
             <PeriodButton p="YTD" label="Ano" />
          </div>
        }
      >
        <div className="min-h-[250px]">
          {gainers.length > 0 ? (
            gainers.map(asset => <RankingRow key={asset.id} asset={asset} type="gain" value={getPerformance(asset, period)} />)
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Nenhum ativo com valorização neste período.
            </div>
          )}
        </div>
      </Card>

      <Card 
        title="Maiores Baixas"
        action={
          <div className="flex space-x-1">
             <PeriodButton p="1D" label="24h" />
             <PeriodButton p="5D" label="5D" />
             <PeriodButton p="1M" label="1M" />
             <PeriodButton p="YTD" label="Ano" />
          </div>
        }
      >
        <div className="min-h-[250px]">
          {losers.length > 0 ? (
            losers.map(asset => <RankingRow key={asset.id} asset={asset} type="loss" value={getPerformance(asset, period)} />)
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Nenhum ativo com desvalorização neste período.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};