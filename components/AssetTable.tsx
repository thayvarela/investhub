import React, { useState, useMemo } from 'react';
import { Asset } from '../types';

interface AssetTableProps {
  assets: Asset[];
  quotes: { [key: string]: number };
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset?: (id: string) => void; // Optional delete handler
}

export const AssetTable: React.FC<AssetTableProps> = ({ assets, quotes, onUpdateAsset, onDeleteAsset }) => {
  if (assets.length === 0) {
    return <div className="text-center py-8 text-slate-500">Nenhum ativo encontrado neste filtro.</div>;
  }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const usdRate = quotes.USDBRL || 1;
  const metrics = useMemo(() => {
    const totalCurrent = assets.reduce((acc, a) => {
      const rate = a.currency === 'USD' ? usdRate : 1;
      return acc + (a.quantity * a.currentPrice * rate);
    }, 0);

    const totalInvested = assets.reduce((acc, a) => {
      const rate = a.currency === 'USD' ? usdRate : 1;
      return acc + (a.quantity * a.averagePrice * rate);
    }, 0);

    const gainLoss = totalCurrent - totalInvested;
    const gainLossPerc = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    return { totalCurrent, totalInvested, gainLoss, gainLossPerc };
  }, [assets, usdRate]);

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setEditForm({ ...asset });
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      const original = assets.find(a => a.id === editingId);
      if (original) {
        onUpdateAsset({
          ...original,
          ...editForm,
          // Ensure numbers are numbers
          quantity: Number(editForm.quantity),
          currentPrice: Number(editForm.currentPrice),
          averagePrice: Number(editForm.averagePrice)
        } as Asset);
      }
      setEditingId(null);
    }
  };

  // Sorting Logic
  const sortedAssets = useMemo(() => {
    let sortableAssets = [...assets];
    if (sortConfig !== null) {
      sortableAssets.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Asset];
        let bValue: any = b[sortConfig.key as keyof Asset];

        // Handle computed columns specially if needed, or mapping
        if (sortConfig.key === 'total') {
          aValue = a.quantity * a.currentPrice;
          bValue = b.quantity * b.currentPrice;
        } else if (sortConfig.key === 'gainLossPerc') {
          const aInvested = a.quantity * a.averagePrice;
          const aCurrent = a.quantity * a.currentPrice;
          aValue = aInvested > 0 ? ((aCurrent - aInvested) / aInvested) : 0;

          const bInvested = b.quantity * b.averagePrice;
          const bCurrent = b.quantity * b.currentPrice;
          bValue = bInvested > 0 ? ((bCurrent - bInvested) / bInvested) : 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableAssets;
  }, [assets, sortConfig]);

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-dark-border">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-dark-card uppercase text-xs text-slate-400">
          <tr>
            <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('ticker')}>Ticker{getSortIndicator('ticker')}</th>
            <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('name')}>Nome{getSortIndicator('name')}</th>
            <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('category')}>Categoria{getSortIndicator('category')}</th>
            <th className="px-6 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('subCategory')}>Sub-Categoria{getSortIndicator('subCategory')}</th>
            <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('quantity')}>Qtd{getSortIndicator('quantity')}</th>
            <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('averagePrice')}>Preço Médio{getSortIndicator('averagePrice')}</th>
            <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('currentPrice')}>Preço Atual{getSortIndicator('currentPrice')}</th>
            <th className="px-6 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('total')}>Total{getSortIndicator('total')}</th>
            <th className="pb-4 cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('gainLossPerc')}>Variação %{getSortIndicator('gainLossPerc')}</th>
            <th className="pb-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sortedAssets.map((asset) => {
            const currentValue = asset.quantity * asset.currentPrice;
            const investedValue = asset.quantity * asset.averagePrice;
            const gainLoss = currentValue - investedValue;
            const gainLossPerc = investedValue > 0 ? (gainLoss / investedValue) * 100 : 0;

            const isEditing = editingId === asset.id;
            const total = asset.quantity * asset.currentPrice;

            return (
              <tr key={asset.id} className="border-b border-dark-border hover:bg-dark-card/50 transition-colors">
                <td className="px-6 py-4 font-bold text-white tracking-wider">{asset.ticker}</td>
                <td className="px-6 py-4 text-slate-400">{asset.name}</td>

                {/* Category */}
                <td className="px-6 py-4">
                  {isEditing ? (
                    <input
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-24"
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Cat"
                    />
                  ) : (
                    <span className="px-2 py-1 rounded-full bg-slate-800 text-xs text-slate-300 border border-slate-700">
                      {asset.category}
                    </span>
                  )}
                </td>

                {/* Sub-Category */}
                <td className="px-6 py-4">
                  {isEditing ? (
                    <input
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-24"
                      value={editForm.subCategory || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, subCategory: e.target.value }))}
                      placeholder="Sub"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">{asset.subCategory}</span>
                  )}
                </td>

                {/* Edit Quantity */}
                <td className="px-6 py-4 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      step="any"
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-20 text-right"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                  ) : (
                    asset.quantity
                  )}
                </td>

                {/* Edit Avg Price */}
                <td className="px-6 py-4 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      step="any"
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-20 text-right"
                      value={editForm.averagePrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, averagePrice: Number(e.target.value) }))}
                    />
                  ) : (
                    <span className="text-slate-400">
                      {new Intl.NumberFormat(asset.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: asset.currency }).format(asset.averagePrice)}
                    </span>
                  )}
                </td>

                {/* Edit Current Price */}
                <td className="px-6 py-4 text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      step="any"
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-20 text-right"
                      value={editForm.currentPrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, currentPrice: Number(e.target.value) }))}
                    />
                  ) : (
                    <span className={asset.currentPrice > asset.averagePrice ? "text-emerald-400" : "text-slate-200"}>
                      {new Intl.NumberFormat(asset.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: asset.currency }).format(asset.currentPrice)}
                    </span>
                  )}
                </td>

                {/* Total */}
                <td className="px-6 py-4 text-right font-bold text-white">
                  {new Intl.NumberFormat(asset.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: asset.currency }).format(total)}
                </td>

                {/* Variation */}
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${gainLoss >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {gainLoss >= 0 ? '+' : ''}{gainLossPerc.toFixed(2)}%
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-center">
                  {isEditing ? (
                    <div className="flex justify-center space-x-2">
                      <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 font-bold bg-emerald-900/20 p-2 rounded transition-colors">✓</button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400 font-bold bg-red-900/20 p-2 rounded transition-colors">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => startEdit(asset)}
                        className="text-brand-400 hover:text-brand-300 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {onDeleteAsset && (
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir este ativo?')) {
                              onDeleteAsset(asset.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Excluir"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-slate-800/50 font-bold border-t-2 border-brand-500/30">
          <tr>
            <td colSpan={5} className="px-6 py-4 text-slate-400 text-xs uppercase tracking-wider text-right">Totais (BRL):</td>
            {/* Alturas correspondentes: Pago, Mercado, Total, Var */}
            <td className="px-6 py-4 text-right text-slate-400 text-xs">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalInvested)}
            </td>
            <td className="px-6 py-4 text-right text-slate-400 text-xs text-brand-500/50">
              -
            </td>
            <td className="px-6 py-4 text-right text-emerald-400 text-sm">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalCurrent)}
            </td>
            <td className="px-6 py-4 text-center">
              <span className={`text-xs font-bold px-2 py-1 rounded ${metrics.gainLoss >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {metrics.gainLoss >= 0 ? '+' : ''}{metrics.gainLossPerc.toFixed(2)}%
              </span>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table >
    </div >
  );
};