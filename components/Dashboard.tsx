import React, { useState, useMemo } from 'react';
import { Asset, ChartDataPoint, HistoryDataPoint, TimeRange } from '../types';
import { Card } from './ui/Card';
import { PortfolioPieChart, HistoryAreaChart } from './Charts';
import { AssetTable } from './AssetTable';
import { PerformanceRanking } from './PerformanceRanking';

interface DashboardProps {
  assets: Asset[];
  history: HistoryDataPoint[];
  onUpdateAsset: (asset: Asset) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ assets, history, onUpdateAsset }) => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

  // Big Numbers Calculations
  const summary = useMemo(() => {
    let totalVal = 0;
    let totalInv = 0;

    assets.forEach(a => {
      totalVal += a.quantity * a.currentPrice;
      totalInv += a.quantity * a.averagePrice;
    });

    const pl = totalVal - totalInv;
    const plPerc = totalInv > 0 ? (pl / totalInv) * 100 : 0;

    return { totalVal, totalInv, pl, plPerc };
  }, [assets]);

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
    assets.forEach(a => {
      const val = a.quantity * a.currentPrice;
      map.set(a.category, (map.get(a.category) || 0) + val);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [assets]);

  // Chart Logic - Level 1 (Sub Categories of Selected)
  const subCategoryData = useMemo(() => {
    if (!selectedSegment) return [];
    
    const map = new Map<string, number>();
    assets
      .filter(a => a.category === selectedSegment)
      .forEach(a => {
        const val = a.quantity * a.currentPrice;
        map.set(a.subCategory, (map.get(a.subCategory) || 0) + val);
      });
      
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [assets, selectedSegment]);

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

      {/* History Section */}
      <Card 
        title="Evolução do Patrimônio"
        action={
          <div className="flex bg-slate-800 rounded-lg p-1 space-x-1">
             {(['1M', '6M', '1Y', 'YTD', 'ALL'] as TimeRange[]).map(range => (
               <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    timeRange === range 
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
              onClickSegment={() => {}} 
            />
          ) : (
             <div className="h-[350px] flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/30">
                <p className="text-slate-500 text-center px-4">
                  Clique em uma fatia do gráfico "Por Segmento" <br/> para ver a distribuição dos sub-segmentos.
                </p>
             </div>
          )}
        </Card>
      </div>

      {/* Detailed Table */}
      <Card title="Meus Ativos">
         <div className="mb-4 text-sm text-slate-400">
            {selectedSegment 
              ? `Exibindo ativos de: ${selectedSegment}` 
              : "Exibindo todos os ativos"}
         </div>
         <AssetTable assets={filteredAssets} onUpdateAsset={onUpdateAsset} />
      </Card>

    </div>
  );
};