import React, { useState } from 'react';
import { Asset } from '../types';

interface AssetTableProps {
  assets: Asset[];
  onUpdateAsset: (updatedAsset: Asset) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ assets, onUpdateAsset }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});

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

  return (
    <div className="overflow-x-auto rounded-lg border border-dark-border">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-dark-card uppercase text-xs text-slate-400">
          <tr>
            <th className="px-6 py-3">Ticker</th>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">Categoria</th>
            <th className="px-6 py-3">Sub-Categoria</th>
            <th className="px-6 py-3 text-right">Qtd</th>
            <th className="px-6 py-3 text-right">Preço Médio</th>
            <th className="px-6 py-3 text-right">Preço Atual</th>
            <th className="px-6 py-3 text-right">Total</th>
            <th className="px-6 py-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-border bg-dark-bg">
          {assets.map((asset) => {
            const isEditing = editingId === asset.id;
            const total = asset.quantity * asset.currentPrice;

            return (
              <tr key={asset.id} className="hover:bg-dark-card/50 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{asset.ticker}</td>
                <td className="px-6 py-4">{asset.name}</td>
                
                {/* Editable Category */}
                <td className="px-6 py-4">
                  {isEditing ? (
                    <input
                      type="text"
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-24"
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Cat"
                    />
                  ) : (
                    <span className="inline-block px-2 py-1 bg-brand-900/50 text-brand-500 rounded text-xs font-semibold">
                      {asset.category}
                    </span>
                  )}
                </td>

                {/* Editable SubCategory */}
                <td className="px-6 py-4">
                  {isEditing ? (
                    <input
                      type="text"
                      className="bg-slate-800 border border-slate-600 text-white rounded px-2 py-1 w-24"
                      value={editForm.subCategory || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, subCategory: e.target.value }))}
                      placeholder="Sub"
                    />
                  ) : (
                    <span className="text-slate-400">{asset.subCategory}</span>
                  )}
                </td>

                {/* Editable Quantity */}
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

                 {/* Editable Avg Price */}
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
                         <span className="text-slate-500 text-xs">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.averagePrice)}
                         </span>
                    )}
                </td>

                {/* Editable Current Price */}
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
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.currentPrice)
                    )}
                </td>
                
                <td className="px-6 py-4 text-right font-bold text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isEditing && editForm.quantity && editForm.currentPrice ? editForm.quantity * editForm.currentPrice : total)}
                </td>
                
                <td className="px-6 py-4 text-center">
                  {isEditing ? (
                    <div className="flex justify-center space-x-2">
                       <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 font-bold bg-emerald-900/20 p-1 rounded">✓</button>
                       <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400 font-bold bg-red-900/20 p-1 rounded">✕</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEdit(asset)} 
                      className="text-brand-500 hover:text-brand-400 text-xs font-medium border border-brand-500/30 px-2 py-1 rounded hover:bg-brand-500/10 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};