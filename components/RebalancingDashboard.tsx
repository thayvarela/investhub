import React, { useState, useMemo, useEffect } from 'react';
import { Asset, SimulationResult, TargetAllocation } from '../types';
import { Card } from './ui/Card';

interface RebalancingDashboardProps {
  assets: Asset[];
  onBatchUpdateAssets?: (assets: Asset[]) => void;
}

export const RebalancingDashboard: React.FC<RebalancingDashboardProps> = ({ assets, onBatchUpdateAssets }) => {
  const [contribution, setContribution] = useState<number>(0);
  const [segmentWeights, setSegmentWeights] = useState<TargetAllocation>({});
  const [subSegmentWeights, setSubSegmentWeights] = useState<TargetAllocation>({});
  const [assetWeights, setAssetWeights] = useState<TargetAllocation>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Editing states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<string | null>(null); // key: "Cat:Sub"
  const [editingAsset, setEditingAsset] = useState<string | null>(null); // id
  const [editValue, setEditValue] = useState<string>("");
  // Additional asset edit fields
  const [editAssetCat, setEditAssetCat] = useState("");
  const [editAssetSub, setEditAssetSub] = useState("");

  // 1. Group Data Hierarchy
  const hierarchy = useMemo(() => {
    const groups: Record<string, Record<string, Asset[]>> = {};
    
    assets.forEach(asset => {
      if (!groups[asset.category]) groups[asset.category] = {};
      if (!groups[asset.category][asset.subCategory]) groups[asset.category][asset.subCategory] = [];
      groups[asset.category][asset.subCategory].push(asset);
    });
    return groups;
  }, [assets]);

  // 2. Initialize Weights (Default to Equal Distribution) if empty
  useEffect(() => {
    if (Object.keys(hierarchy).length === 0) return;
    
    // Only init if empty to avoid overwriting user edits
    if (Object.keys(segmentWeights).length === 0) {
      const segCount = Object.keys(hierarchy).length;
      const newSegWeights: TargetAllocation = {};
      const newSubWeights: TargetAllocation = {};
      const newAssetWeights: TargetAllocation = {};

      Object.keys(hierarchy).forEach(cat => {
        newSegWeights[cat] = 100 / segCount;
        
        const subCategories = Object.keys(hierarchy[cat]);
        subCategories.forEach(sub => {
          const key = `${cat}:${sub}`;
          newSubWeights[key] = 100 / subCategories.length;

          const catAssets = hierarchy[cat][sub];
          catAssets.forEach(a => {
            const aKey = `${cat}:${sub}:${a.ticker}`;
            newAssetWeights[aKey] = 100 / catAssets.length;
          });
        });
      });

      setSegmentWeights(newSegWeights);
      setSubSegmentWeights(newSubWeights);
      setAssetWeights(newAssetWeights);
    }
  }, [hierarchy]);

  // 3. Helper to equalize weights at any level
  const equalize = (level: 'segment' | 'sub' | 'asset', parentKey?: string) => {
    if (level === 'segment') {
      const keys = Object.keys(hierarchy);
      const val = 100 / keys.length;
      const newW = { ...segmentWeights };
      keys.forEach(k => newW[k] = val);
      setSegmentWeights(newW);
    } else if (level === 'sub' && parentKey) {
      const subs = Object.keys(hierarchy[parentKey]);
      const val = 100 / subs.length;
      const newW = { ...subSegmentWeights };
      subs.forEach(s => newW[`${parentKey}:${s}`] = val);
      setSubSegmentWeights(newW);
    } else if (level === 'asset' && parentKey) {
       // parentKey here is "Category:SubCategory"
       const [cat, sub] = parentKey.split(':');
       const assetList = hierarchy[cat][sub];
       const val = 100 / assetList.length;
       const newW = { ...assetWeights };
       assetList.forEach(a => newW[`${cat}:${sub}:${a.ticker}`] = val);
       setAssetWeights(newW);
    }
  };

  const toggleExpand = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Renaming Handlers
  const startEditCategory = (cat: string) => {
    setEditingCategory(cat);
    setEditValue(cat);
  };
  const saveCategory = (oldName: string) => {
    if (!editValue.trim() || !onBatchUpdateAssets) return;
    const assetsToUpdate = assets.filter(a => a.category === oldName).map(a => ({...a, category: editValue.trim()}));
    onBatchUpdateAssets(assetsToUpdate);
    
    // Update weights key
    const newWeights = {...segmentWeights};
    if (newWeights[oldName]) {
        newWeights[editValue.trim()] = newWeights[oldName];
        delete newWeights[oldName];
        setSegmentWeights(newWeights);
    }
    
    setEditingCategory(null);
  };

  const startEditSubCategory = (cat: string, sub: string) => {
    setEditingSubCategory(`${cat}:${sub}`);
    setEditValue(sub);
  };
  const saveSubCategory = (cat: string, oldSub: string) => {
     if (!editValue.trim() || !onBatchUpdateAssets) return;
     const assetsToUpdate = assets.filter(a => a.category === cat && a.subCategory === oldSub).map(a => ({...a, subCategory: editValue.trim()}));
     onBatchUpdateAssets(assetsToUpdate);

     // Update weights
     const oldKey = `${cat}:${oldSub}`;
     const newKey = `${cat}:${editValue.trim()}`;
     const newWeights = {...subSegmentWeights};
     if (newWeights[oldKey]) {
        newWeights[newKey] = newWeights[oldKey];
        delete newWeights[oldKey];
        setSubSegmentWeights(newWeights);
     }

     setEditingSubCategory(null);
  };

  const startEditAsset = (asset: Asset) => {
      setEditingAsset(asset.id);
      setEditValue(asset.ticker);
      setEditAssetCat(asset.category);
      setEditAssetSub(asset.subCategory);
  };
  const saveAsset = (originalAsset: Asset) => {
      if(!onBatchUpdateAssets) return;
      onBatchUpdateAssets([{
          ...originalAsset,
          ticker: editValue.trim(),
          category: editAssetCat.trim(),
          subCategory: editAssetSub.trim()
      }]);
      setEditingAsset(null);
  };

  // 4. Calculate Simulation
  const simulationData = useMemo(() => {
    const currentTotal = assets.reduce((acc, a) => acc + (a.quantity * a.currentPrice), 0);
    const projectedTotal = currentTotal + contribution;
    
    const results: SimulationResult[] = [];

    assets.forEach(asset => {
       const catKey = asset.category;
       const subKey = `${asset.category}:${asset.subCategory}`;
       const assetKey = `${asset.category}:${asset.subCategory}:${asset.ticker}`;

       const wCat = (segmentWeights[catKey] || 0) / 100;
       const wSub = (subSegmentWeights[subKey] || 0) / 100;
       const wAsset = (assetWeights[assetKey] || 0) / 100;

       // Global Target % for this asset
       const globalTargetPercent = wCat * wSub * wAsset;
       
       const currentValue = asset.quantity * asset.currentPrice;
       const targetValue = projectedTotal * globalTargetPercent;
       
       results.push({
         ticker: asset.ticker,
         currentValue,
         currentPercent: projectedTotal > 0 ? currentValue / projectedTotal : 0, // Using projected base to show dilution
         targetValue,
         targetPercent: globalTargetPercent,
         actionAmount: targetValue - currentValue
       });
    });

    return results.sort((a, b) => b.actionAmount - a.actionAmount); // Sort by buy urgency
  }, [assets, contribution, segmentWeights, subSegmentWeights, assetWeights]);

  const totalSegmentWeight = (Object.values(segmentWeights) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Left Column: Configuration */}
      <div className="lg:col-span-7 space-y-6">
        <Card title="Definição de Alvos & Estrutura">
           <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-200">
             Use os ícones de lápis (✎) para renomear segmentos ou mover ativos. Defina os percentuais alvo para que o sistema calcule os aportes.
           </div>
           
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segmentos Macro</span>
              <button onClick={() => equalize('segment')} className="text-xs text-brand-400 hover:text-brand-300">
                Igualar Tudo
              </button>
           </div>

           <div className="space-y-4">
             {Object.keys(hierarchy).map(cat => (
               <div key={cat} className="border border-dark-border rounded-lg overflow-hidden bg-slate-800/30">
                 {/* Category Header */}
                 <div className="flex items-center justify-between p-3 bg-slate-800/80">
                    <div className="flex items-center flex-1">
                        <button onClick={() => toggleExpand(cat)} className="mr-2">
                           <span className={`transform transition-transform inline-block ${expandedCategories.includes(cat) ? 'rotate-90' : ''}`}>▶</span>
                        </button>
                        
                        {editingCategory === cat ? (
                            <div className="flex items-center space-x-1">
                                <input 
                                    className="bg-slate-700 text-white text-sm px-1 py-0.5 rounded border border-slate-600 focus:border-brand-500 outline-none"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={() => saveCategory(cat)} className="text-emerald-500 font-bold px-1">✓</button>
                                <button onClick={() => setEditingCategory(null)} className="text-red-500 font-bold px-1">✕</button>
                            </div>
                        ) : (
                            <div className="flex items-center group">
                                <span className="font-medium text-white">{cat}</span>
                                <button onClick={() => startEditCategory(cat)} className="ml-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">✎</button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                       <input 
                         type="number" 
                         min="0" max="100"
                         value={Math.round(segmentWeights[cat] || 0)}
                         onChange={(e) => setSegmentWeights({...segmentWeights, [cat]: Number(e.target.value)})}
                         className="w-16 bg-dark-bg border border-slate-600 rounded px-2 py-1 text-right text-white focus:border-brand-500"
                       />
                       <span className="text-slate-400 text-sm">%</span>
                    </div>
                 </div>

                 {/* SubCategories (Accordion Body) */}
                 {expandedCategories.includes(cat) && (
                   <div className="p-3 border-t border-dark-border space-y-4">
                      <div className="flex justify-between">
                        <span className="text-xs text-slate-500">Sub-segmentos de {cat}</span>
                        <button onClick={() => equalize('sub', cat)} className="text-xs text-brand-400 hover:text-brand-300">
                          Igualar
                        </button>
                      </div>

                      {Object.keys(hierarchy[cat]).map(sub => {
                        const subKey = `${cat}:${sub}`;
                        const isEditingSub = editingSubCategory === subKey;
                        
                        return (
                          <div key={sub} className="ml-2 pl-3 border-l-2 border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                               {isEditingSub ? (
                                    <div className="flex items-center space-x-1">
                                        <input 
                                            className="bg-slate-700 text-white text-xs px-1 py-0.5 rounded border border-slate-600 focus:border-brand-500 outline-none"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => saveSubCategory(cat, sub)} className="text-emerald-500 font-bold px-1">✓</button>
                                        <button onClick={() => setEditingSubCategory(null)} className="text-red-500 font-bold px-1">✕</button>
                                    </div>
                               ) : (
                                    <div className="flex items-center group">
                                       <span className="text-sm text-slate-200">{sub}</span>
                                       <button onClick={() => startEditSubCategory(cat, sub)} className="ml-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs">✎</button>
                                    </div>
                               )}
                               
                               <div className="flex items-center space-x-2">
                                  <input 
                                    type="number" 
                                    min="0" max="100"
                                    value={Math.round(subSegmentWeights[subKey] || 0)}
                                    onChange={(e) => setSubSegmentWeights({...subSegmentWeights, [subKey]: Number(e.target.value)})}
                                    className="w-14 bg-dark-bg border border-slate-600 rounded px-2 py-1 text-right text-xs text-white"
                                  />
                                  <span className="text-slate-500 text-xs">%</span>
                               </div>
                            </div>

                            {/* Assets */}
                            <div className="bg-dark-bg/50 rounded p-2 space-y-2">
                               <div className="flex justify-between mb-1">
                                  <span className="text-[10px] text-slate-500 uppercase">Ativos em {sub}</span>
                                  <button onClick={() => equalize('asset', subKey)} className="text-[10px] text-brand-400 hover:text-brand-300">
                                    Igualar
                                  </button>
                               </div>
                               {hierarchy[cat][sub].map(asset => {
                                 const assetKey = `${cat}:${sub}:${asset.ticker}`;
                                 const isEditingThisAsset = editingAsset === asset.id;

                                 return (
                                   <div key={asset.id} className="flex flex-col border-b border-slate-700/50 pb-1 last:border-0 last:pb-0">
                                      <div className="flex justify-between items-center">
                                          {isEditingThisAsset ? (
                                              <div className="flex flex-col space-y-1 w-full mr-2">
                                                  <input 
                                                      className="bg-slate-700 text-white text-[10px] px-1 rounded border border-slate-600"
                                                      value={editValue} onChange={e => setEditValue(e.target.value)} placeholder="Ticker"
                                                  />
                                                  <div className="flex space-x-1">
                                                     <input 
                                                        className="bg-slate-700 text-white text-[10px] px-1 rounded border border-slate-600 w-1/2"
                                                        value={editAssetCat} onChange={e => setEditAssetCat(e.target.value)} placeholder="Cat."
                                                     />
                                                     <input 
                                                        className="bg-slate-700 text-white text-[10px] px-1 rounded border border-slate-600 w-1/2"
                                                        value={editAssetSub} onChange={e => setEditAssetSub(e.target.value)} placeholder="Sub."
                                                     />
                                                  </div>
                                                  <div className="flex space-x-2 mt-1">
                                                      <button onClick={() => saveAsset(asset)} className="bg-emerald-600 text-white text-[10px] px-2 rounded">Salvar</button>
                                                      <button onClick={() => setEditingAsset(null)} className="bg-slate-600 text-white text-[10px] px-2 rounded">Cancelar</button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="flex items-center group">
                                                 <span className="text-xs text-slate-400">{asset.ticker}</span>
                                                 <button onClick={() => startEditAsset(asset)} className="ml-2 text-slate-600 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">✎</button>
                                              </div>
                                          )}
                                          
                                          {!isEditingThisAsset && (
                                              <div className="flex items-center space-x-1">
                                                  <input 
                                                      type="number" 
                                                      min="0" max="100"
                                                      value={Math.round(assetWeights[assetKey] || 0)}
                                                      onChange={(e) => setAssetWeights({...assetWeights, [assetKey]: Number(e.target.value)})}
                                                      className="w-12 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-right text-xs text-slate-200"
                                                  />
                                                  <span className="text-slate-600 text-[10px]">%</span>
                                              </div>
                                          )}
                                      </div>
                                   </div>
                                 )
                               })}
                            </div>
                          </div>
                        )
                      })}
                   </div>
                 )}
               </div>
             ))}
           </div>
           
           {/* Total Check */}
           <div className="mt-4 flex justify-between text-sm">
              <span className="text-slate-400">Total Segmentos:</span>
              <span className={`font-bold ${Math.abs(totalSegmentWeight - 100) < 1 ? 'text-emerald-500' : 'text-red-500'}`}>
                {totalSegmentWeight.toFixed(0)}%
              </span>
           </div>
        </Card>
      </div>

      {/* Right Column: Simulation */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="bg-gradient-to-br from-dark-card to-slate-900 border-brand-500/30">
           <h3 className="text-lg font-semibold text-white mb-4">Simulação de Aporte</h3>
           <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-1">Novo Aporte (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500">R$</span>
                <input 
                  type="number" 
                  value={contribution}
                  onChange={(e) => setContribution(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg font-bold focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                  placeholder="0.00"
                />
              </div>
           </div>
           
           <div className="space-y-3">
              <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                 <span className="text-slate-400">Patrimônio Atual</span>
                 <span className="text-white font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assets.reduce((a,b)=>a + b.quantity*b.currentPrice, 0))}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                 <span className="text-slate-400">Patrimônio Projetado</span>
                 <span className="text-emerald-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assets.reduce((a,b)=>a + b.quantity*b.currentPrice, 0) + contribution)}</span>
              </div>
           </div>
        </Card>

        <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-dark-border bg-slate-800/50">
             <h3 className="font-semibold text-white">Plano de Compra</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-xs text-slate-400 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Ativo</th>
                  <th className="px-4 py-2 text-right">Target</th>
                  <th className="px-4 py-2 text-right">Sugestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {simulationData.map((sim) => (
                  <tr key={sim.ticker} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                       <div className="font-bold text-white">{sim.ticker}</div>
                       <div className="text-[10px] text-slate-500">
                         Atual: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sim.currentValue)}
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <div className="text-brand-400 font-medium">{(sim.targetPercent * 100).toFixed(1)}%</div>
                       <div className="text-[10px] text-slate-500">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sim.targetValue)}
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                       {sim.actionAmount > 0 ? (
                         <span className="inline-block px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded border border-emerald-800 font-bold">
                           + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sim.actionAmount)}
                         </span>
                       ) : (
                         <span className="text-slate-600 text-xs">Aguardar</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};