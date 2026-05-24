import React, { useState, useMemo } from 'react';
import { Asset, ChartDataPoint, HistoryDataPoint, TimeRange, PortfolioReturns, PeriodReturn } from '../types';
import { Card } from './ui/Card';
import { PortfolioPieChart, HistoryAreaChart } from './Charts';
import { AssetTable } from './AssetTable';
import { PerformanceRanking } from './PerformanceRanking';
import * as rebalanceService from '../services/rebalanceService';

interface DashboardProps {
  assets: Asset[];
  history: HistoryDataPoint[];
  quotes: { [key: string]: number };
  returns: PortfolioReturns | null;
  targets?: rebalanceService.BackendTarget[];
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
}

// Helper component for the return period cards
const ReturnPeriodCard: React.FC<{
  label: string;
  sublabel: string;
  data: PeriodReturn | null;
  accentColor: string;
  icon: string;
}> = ({ label, sublabel, data, accentColor, icon }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const isPositive = data ? data.value >= 0 : true;
  const colorClass = !data ? 'text-slate-500' : isPositive ? 'text-emerald-400' : 'text-red-400';
  const bgGlow = !data ? '' : isPositive ? 'shadow-emerald-500/5' : 'shadow-red-500/5';

  return (
    <div className={`relative overflow-hidden bg-dark-card border border-dark-border rounded-xl p-5 shadow-lg ${bgGlow} transition-all duration-300 hover:border-slate-600 hover:shadow-xl group`}>
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accentColor}`}></div>
      
      {/* Period label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-semibold text-slate-300">{label}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{sublabel}</p>
          </div>
        </div>
      </div>

      {data ? (
        <div className="space-y-1">
          {/* Percentage - big number */}
          <p className={`text-2xl font-bold ${colorClass} transition-colors`}>
            {data.percentage >= 0 ? '+' : ''}{data.percentage.toFixed(2)}%
          </p>
          {/* Absolute value */}
          <p className={`text-sm font-medium ${colorClass} opacity-80`}>
            {data.value >= 0 ? '+' : ''}{formatCurrency(data.value)}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-slate-600">—</p>
          <p className="text-xs text-slate-600">Sem dados</p>
        </div>
      )}

      {/* Subtle indicator arrow */}
      {data && (
        <div className={`absolute top-4 right-4 ${colorClass} opacity-30 group-hover:opacity-60 transition-opacity`}>
          <svg className={`w-6 h-6 ${isPositive ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ assets, history, quotes, returns, targets, onUpdateAsset, onDeleteAsset }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

  // Big Numbers Calculations
  const summary = useMemo(() => {
    let totalVal = 0;
    let totalInv = 0;
    const usdRate = quotes.USDBRL || 1;

    assets.forEach(a => {
      const rate = a.currency === 'USD' ? usdRate : 1;
      totalVal += (a.quantity * a.currentPrice) * rate;
      totalInv += (a.quantity * a.averagePrice) * rate;
    });

    const pl = totalVal - totalInv;
    const plPerc = totalInv > 0 ? (pl / totalInv) * 100 : 0;

    return { totalVal, totalInv, pl, plPerc };
  }, [assets, quotes]);

  // Filter History Data based on Range
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeRange) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'YTD':
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'ALL':
        return history;
    }

    return history.filter(h => new Date(h.date) >= cutoffDate);
  }, [history, timeRange]);


  // Chart Logic - Level 0 (Main Categories)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    const usdRate = quotes.USDBRL || 1;
    assets.forEach(a => {
      const rate = a.currency === 'USD' ? usdRate : 1;
      const val = (a.quantity * a.currentPrice) * rate;
      map.set(a.category, (map.get(a.category) || 0) + val);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [assets, quotes]);

  // Chart Logic - Level 1 (Sub Categories of Selected)
  const subCategoryData = useMemo(() => {
    if (!selectedSegment) return [];

    const map = new Map<string, number>();
    const usdRate = quotes.USDBRL || 1;
    assets
      .filter(a => a.category === selectedSegment)
      .forEach(a => {
        const rate = a.currency === 'USD' ? usdRate : 1;
        const val = (a.quantity * a.currentPrice) * rate;
        map.set(a.subCategory, (map.get(a.subCategory) || 0) + val);
      });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [assets, selectedSegment, quotes]);

  // Handler for chart clicks
  const handleChartClick = (data: any) => {
    if (!data) return;
    // Directly switch the selected segment, even if one is already selected
    setSelectedSegment(data.name);
  };

  const filteredAssets = selectedSegment
    ? assets.filter(a => a.category === selectedSegment)
    : assets;

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* Big Numbers Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-500">
          <p className="text-slate-400 text-sm font-medium">Patrimônio Total</p>
          <p className="text-2xl font-bold text-white mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalVal)}
          </p>
        </Card>
        <Card className="border-l-4 border-l-slate-500">
          <p className="text-slate-400 text-sm font-medium">Total Aportado</p>
          <p className="text-2xl font-bold text-white mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalInv)}
          </p>
        </Card>
        <Card className={`border-l-4 ${summary.pl >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <p className="text-slate-400 text-sm font-medium">Variação (R$)</p>
          <p className={`text-2xl font-bold mt-1 ${summary.pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.pl >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.pl)}
          </p>
        </Card>
        <Card className={`border-l-4 ${summary.plPerc >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <p className="text-slate-400 text-sm font-medium">Rentabilidade</p>
          <p className={`text-2xl font-bold mt-1 ${summary.plPerc >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.plPerc >= 0 ? '+' : ''}{summary.plPerc.toFixed(2)}%
          </p>
        </Card>
      </div>

      {/* Rentabilidade por Período */}
      <Card 
        title="Rentabilidade por Período"
        action={
          <span className="text-xs text-slate-500">
            Variação R$ e % em cada janela de tempo
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReturnPeriodCard
            label="24 Horas"
            sublabel="Último dia"
            data={returns?.periods['1D'] ?? null}
            accentColor="from-blue-500 to-cyan-400"
            icon="⏱️"
          />
          <ReturnPeriodCard
            label="7 Dias"
            sublabel="Última semana"
            data={returns?.periods['7D'] ?? null}
            accentColor="from-violet-500 to-purple-400"
            icon="📅"
          />
          <ReturnPeriodCard
            label="30 Dias"
            sublabel="Último mês"
            data={returns?.periods['1M'] ?? null}
            accentColor="from-amber-500 to-orange-400"
            icon="📆"
          />
          <ReturnPeriodCard
            label="Total"
            sublabel="Desde o início"
            data={returns?.periods['Total'] ?? null}
            accentColor="from-emerald-500 to-teal-400"
            icon="🏆"
          />
        </div>
      </Card>

      {/* History Section */}
      <Card
        title="Evolução do Patrimônio"
        action={
          <div className="flex bg-slate-800 rounded-lg p-1 space-x-1">
            {(['1M', '6M', '1Y', 'YTD', 'ALL'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeRange === range
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        }
      >
        <HistoryAreaChart data={filteredHistory} />
      </Card>

      {/* Performance Ranking (Gainers/Losers) */}
      <PerformanceRanking assets={assets} />

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Segment Chart */}
        <Card title="Alocação por Segmento">
          <PortfolioPieChart
            data={categoryData}
            onClickSegment={handleChartClick}
            title="Clique para detalhar"
          />
        </Card>

        {/* Drill Down Chart */}
        <Card
          title={selectedSegment ? `Detalhamento: ${selectedSegment}` : 'Selecione um segmento ao lado'}
          action={
            selectedSegment && (
              <button
                onClick={() => setSelectedSegment(null)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded border border-slate-600"
              >
                Voltar p/ Geral
              </button>
            )
          }
        >
          {selectedSegment ? (
            <PortfolioPieChart
              data={subCategoryData}
              onClickSegment={() => { }}
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
              <p className="text-slate-500 text-center px-4">
                Clique em uma fatia do gráfico "Por Segmento" <br /> para ver a distribuição dos sub-segmentos.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Table */}
      <Card
        title="Meus Ativos"
        action={
          <button
            onClick={() => {
              const usdRate = quotes.USDBRL || 1;
              const portfolioTotal = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice * (a.currency === 'USD' ? usdRate : 1)), 0);

              const headers = ['Ticker', 'Nome', 'Categoria', 'Sub-Categoria', 'Moeda', 'Qtd', 'Preço Médio', 'Preço Atual', 'Total (BRL)', 'Variação %', '% Atual', '% Alvo'];
              const rows = filteredAssets.map(a => {
                const rate = a.currency === 'USD' ? usdRate : 1;
                const total = a.quantity * a.currentPrice * rate;
                const variation = a.averagePrice > 0
                  ? ((a.currentPrice - a.averagePrice) / a.averagePrice * 100).toFixed(2)
                  : '0.00';
                
                const percentualAtual = portfolioTotal > 0 ? ((total / portfolioTotal) * 100).toFixed(2) + '%' : '0.00%';
                
                let percentualAlvo = 'N/A';
                if (targets && targets.length > 0) {
                  const catKey = a.category;
                  const subKey = `${a.category}:${a.subCategory}`;
                  const assetKey = `${a.category}:${a.subCategory}:${a.ticker}`;
                  
                  const wCat = (targets.find(t => t.segmentKey === catKey)?.targetPercentage || 0) / 100;
                  const wSub = (targets.find(t => t.segmentKey === subKey)?.targetPercentage || 0) / 100;
                  const wAsset = (targets.find(t => t.segmentKey === assetKey)?.targetPercentage || 0) / 100;
                  
                  percentualAlvo = (wCat * wSub * wAsset * 100).toFixed(2) + '%';
                }

                return [
                  a.ticker,
                  a.name,
                  a.category,
                  a.subCategory,
                  a.currency,
                  a.quantity.toString(),
                  a.averagePrice.toFixed(2),
                  a.currentPrice.toFixed(2),
                  total.toFixed(2),
                  variation,
                  percentualAtual,
                  percentualAlvo
                ].map(v => `"${v}"`).join(',');
              });
              const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `ativos_${new Date().toISOString().slice(0, 10)}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40 hover:border-emerald-400/50 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
        }
      >
        <div className="mb-4 text-sm text-slate-400">
          {selectedSegment
            ? `Exibindo ativos de: ${selectedSegment}`
            : "Exibindo todos os ativos"}
        </div>
        <AssetTable assets={filteredAssets} quotes={quotes} onUpdateAsset={onUpdateAsset} onDeleteAsset={onDeleteAsset} />
      </Card>

    </div>
  );
};