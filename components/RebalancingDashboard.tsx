import React, { useState, useMemo, useEffect } from 'react';
import { Asset, SimulationResult, TargetAllocation } from '../types';
import { Card } from './ui/Card';
import * as rebalanceService from '../services/rebalanceService';

interface RebalancingDashboardProps {
  assets: Asset[];
  quotes: { [key: string]: number };
  targets?: rebalanceService.BackendTarget[];
  onBatchUpdateAssets?: (assets: Asset[]) => void;
}

export const RebalancingDashboard: React.FC<RebalancingDashboardProps> = ({ assets, quotes, targets, onBatchUpdateAssets }) => {
  const [contribution, setContribution] = useState<number>(0);
  const [displayCurrency, setDisplayCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [isRebalanceMode, setIsRebalanceMode] = useState<boolean>(false);
  const [segmentWeights, setSegmentWeights] = useState<TargetAllocation>({});
  const [subSegmentWeights, setSubSegmentWeights] = useState<TargetAllocation>({});
  const [assetWeights, setAssetWeights] = useState<TargetAllocation>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [collapsedPlanCategories, setCollapsedPlanCategories] = useState<string[]>([]);
  const [collapsedPlanSubCategories, setCollapsedPlanSubCategories] = useState<string[]>([]);

  const togglePlanCat = (cat: string) => {
    setCollapsedPlanCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const togglePlanSub = (subKey: string) => {
    setCollapsedPlanSubCategories(prev => prev.includes(subKey) ? prev.filter(c => c !== subKey) : [...prev, subKey]);
  };

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

  // 2. Initialize Weights
  useEffect(() => {
    if (Object.keys(hierarchy).length === 0) return;

    // A. Priority: Use targets from backend if available
    if (targets && targets.length > 0) {
      const newSegWeights: TargetAllocation = {};
      const newSubWeights: TargetAllocation = {};
      const newAssetWeights: TargetAllocation = {};

      targets.forEach(t => {
        const parts = t.segmentKey.split(':');
        if (parts.length === 1) {
          newSegWeights[t.segmentKey] = t.targetPercentage;
        } else if (parts.length === 2) {
          newSubWeights[t.segmentKey] = t.targetPercentage;
        } else if (parts.length === 3) {
          newAssetWeights[t.segmentKey] = t.targetPercentage;
        }
      });

      // Fill in missing parts from hierarchy with 0 if necessary, 
      // but usually the logic handles missing as 0% effectively.
      setSegmentWeights(newSegWeights);
      setSubSegmentWeights(newSubWeights);
      setAssetWeights(newAssetWeights);
      return;
    }

    // B. Fallback: Default to Equal Distribution if empty
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
  }, [hierarchy, targets]);

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
    const assetsToUpdate = assets.filter(a => a.category === oldName).map(a => ({ ...a, category: editValue.trim() }));
    onBatchUpdateAssets(assetsToUpdate);

    // Update weights key
    const newWeights = { ...segmentWeights };
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
    const assetsToUpdate = assets.filter(a => a.category === cat && a.subCategory === oldSub).map(a => ({ ...a, subCategory: editValue.trim() }));
    onBatchUpdateAssets(assetsToUpdate);

    // Update weights
    const oldKey = `${cat}:${oldSub}`;
    const newKey = `${cat}:${editValue.trim()}`;
    const newWeights = { ...subSegmentWeights };
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
    if (!onBatchUpdateAssets) return;
    onBatchUpdateAssets([{
      ...originalAsset,
      ticker: editValue.trim(),
      category: editAssetCat.trim(),
      subCategory: editAssetSub.trim()
    }]);
    setEditingAsset(null);
  };

  const handleSaveTargets = async () => {
    try {
      setIsSaving(true);
      const flatTargets: rebalanceService.BackendTarget[] = [];
      const sanitize = (val: any) => {
        const num = Number(val);
        if (isNaN(num)) return 0;
        return Math.min(100, Math.max(0, num));
      };

      // Collect segments
      Object.entries(segmentWeights).forEach(([key, val]) => {
        flatTargets.push({ segmentKey: key, targetPercentage: sanitize(val) });
      });
      // Collect sub-segments
      Object.entries(subSegmentWeights).forEach(([key, val]) => {
        flatTargets.push({ segmentKey: key, targetPercentage: sanitize(val) });
      });
      // Collect assets
      Object.entries(assetWeights).forEach(([key, val]) => {
        flatTargets.push({ segmentKey: key, targetPercentage: sanitize(val) });
      });

      await rebalanceService.saveTargets(flatTargets);
      alert("Estratégia salva com sucesso!");
    } catch (error) {
      console.error("Failed to save targets", error);
      alert("Erro ao salvar estratégia.");
    } finally {
      setIsSaving(false);
    }
  };

  const usdRate = quotes.USDBRL || 1;

  const getAssetRate = (assetCurrency: string) => {
    if (assetCurrency === displayCurrency) return 1;
    return displayCurrency === 'BRL' ? usdRate : 1 / usdRate;
  };

  const formatCurrency = (val: number, maxFractionDigits?: number) => {
    return new Intl.NumberFormat(displayCurrency === 'USD' ? 'en-US' : 'pt-BR', { 
      style: 'currency', 
      currency: displayCurrency,
      ...(maxFractionDigits !== undefined ? { maximumFractionDigits: maxFractionDigits } : {})
    }).format(val);
  };

  const simulationData = useMemo(() => {
    const currentTotal = assets.reduce((acc, a) => {
      const rate = getAssetRate(a.currency);
      return acc + (a.quantity * a.currentPrice * rate);
    }, 0);
    const projectedTotal = currentTotal + (contribution || 0);

    // 1. Group hierarchy and calculate targets
    const categories: Record<string, { current: number, targetPercent: number, subs: Record<string, { current: number, targetPercent: number, assets: any[] }> }> = {};

    assets.forEach(asset => {
      const catKey = asset.category;
      const subKey = `${asset.category}:${asset.subCategory}`;
      const assetKey = `${asset.category}:${asset.subCategory}:${asset.ticker}`;

      const wCat = (segmentWeights[catKey] || 0) / 100;
      const wSub = (subSegmentWeights[subKey] || 0) / 100;
      const wAsset = (assetWeights[assetKey] || 0) / 100;

      const rate = getAssetRate(asset.currency);
      const currentValue = asset.quantity * asset.currentPrice * rate;

      if (!categories[catKey]) categories[catKey] = { current: 0, targetPercent: wCat, subs: {} };
      categories[catKey].current += currentValue;

      if (!categories[catKey].subs[subKey]) categories[catKey].subs[subKey] = { current: 0, targetPercent: wSub, assets: [] };
      categories[catKey].subs[subKey].current += currentValue;

      categories[catKey].subs[subKey].assets.push({
        asset,
        currentValue,
        targetPercent: wAsset,
        globalTargetPercent: wCat * wSub * wAsset,
        targetValue: projectedTotal * wCat * wSub * wAsset
      });
    });

    if (isRebalanceMode) {
      const finalResults: SimulationResult[] = [];
      const modeProjectedTotal = currentTotal + (contribution || 0);
      Object.entries(categories).forEach(([catKey, catData]) => {
        Object.entries(catData.subs).forEach(([subKey, subData]) => {
          subData.assets.forEach(a => {
            finalResults.push({
              ticker: a.asset.ticker,
              currentValue: a.currentValue,
              currentPercent: modeProjectedTotal > 0 ? a.currentValue / modeProjectedTotal : 0,
              targetValue: a.targetValue,
              targetPercent: a.globalTargetPercent,
              actionAmount: a.targetValue - a.currentValue,
              smartActionAmount: a.targetValue - a.currentValue
            });
          });
        });
      });
      return finalResults.sort((a, b) => b.actionAmount - a.actionAmount);
    }

    // Helper for top-down proportional distribution
    function distribute(amount: number, nodes: { key: string, target: number, current: number, weight: number }[]) {
      const nodesWithDeficit = nodes.map(n => ({
        ...n,
        deficit: Math.max(0, n.target - n.current),
        allocated: 0
      }));

      let remaining = amount;
      const totalDeficit = nodesWithDeficit.reduce((sum, n) => sum + n.deficit, 0);

      if (totalDeficit > 0) {
        for (const node of nodesWithDeficit) {
          if (node.deficit > 0) {
            const alloc = amount <= totalDeficit
              ? amount * (node.deficit / totalDeficit)
              : node.deficit;
            node.allocated += alloc;
            remaining -= alloc;
          }
        }
      }

      if (remaining > 0.01) {
        const totalWeight = nodesWithDeficit.reduce((sum, n) => sum + n.weight, 0);
        for (const node of nodesWithDeficit) {
          const w = totalWeight > 0 ? node.weight / totalWeight : 1 / nodesWithDeficit.length;
          node.allocated += remaining * w;
        }
      }

      return nodesWithDeficit;
    }

    // 2. Top-Down Distribution
    const catNodes = Object.entries(categories).map(([catKey, data]) => ({
      key: catKey,
      target: projectedTotal * data.targetPercent,
      current: data.current,
      weight: data.targetPercent
    }));

    let topAmount = contribution || 0;
    if (!contribution || contribution === 0) {
      // If no aporte, we want to show exactly the difference for each category to reach its target
      topAmount = catNodes.reduce((sum, n) => sum + Math.max(0, n.target - n.current), 0);
    }

    const catResults = distribute(topAmount, catNodes);
    const finalResults: SimulationResult[] = [];

    catResults.forEach(catRes => {
      const catData = categories[catRes.key];
      const subNodes = Object.entries(catData.subs).map(([subKey, data]) => ({
        key: subKey,
        target: projectedTotal * catData.targetPercent * data.targetPercent,
        current: data.current,
        weight: data.targetPercent
      }));

      const subResults = distribute(catRes.allocated, subNodes);

      subResults.forEach(subRes => {
        const subData = catData.subs[subRes.key];
        const assetNodes = subData.assets.map(a => ({
          key: a.asset.ticker,
          target: a.targetValue,
          current: a.currentValue,
          weight: a.targetPercent,
          assetObj: a
        }));

        const assetResults = distribute(subRes.allocated, assetNodes);

        assetResults.forEach(assetRes => {
          finalResults.push({
            ticker: assetRes.assetObj.asset.ticker,
            currentValue: assetRes.assetObj.currentValue,
            currentPercent: projectedTotal > 0 ? assetRes.assetObj.currentValue / projectedTotal : 0,
            targetValue: assetRes.assetObj.targetValue,
            targetPercent: assetRes.assetObj.globalTargetPercent,
            actionAmount: assetRes.allocated
          });
        });
      });
    });

    // 3. Smart Distribution (Water-filling)
    if (contribution > 0) {
      let low = 0;
      let high = projectedTotal * 2;
      for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        let needed = 0;
        finalResults.forEach(r => {
          if (r.targetPercent > 0) {
            needed += Math.max(0, mid * r.targetPercent - r.currentValue);
          }
        });
        if (needed > contribution) high = mid;
        else low = mid;
      }
      finalResults.forEach(r => {
        if (r.targetPercent > 0) {
          r.smartActionAmount = Math.max(0, low * r.targetPercent - r.currentValue);
        } else {
          r.smartActionAmount = 0;
        }
      });
    } else {
      let maxRatio = 0;
      finalResults.forEach(r => {
        if (r.targetPercent > 0) {
          const ratio = r.currentValue / r.targetPercent;
          if (ratio > maxRatio) maxRatio = ratio;
        }
      });
      finalResults.forEach(r => {
        if (r.targetPercent > 0) {
          r.smartActionAmount = maxRatio * r.targetPercent - r.currentValue;
        } else {
          r.smartActionAmount = 0;
        }
      });
    }

    return finalResults.sort((a, b) => b.actionAmount - a.actionAmount);
  }, [assets, contribution, segmentWeights, subSegmentWeights, assetWeights, usdRate, displayCurrency, isRebalanceMode]);

  const totalPortfolioValue = useMemo(() => {
    return assets.reduce((acc, a) => {
      const rate = getAssetRate(a.currency);
      return acc + (a.quantity * a.currentPrice * rate);
    }, 0);
  }, [assets, usdRate, displayCurrency]);

  const groupedSimData = useMemo(() => {
    const groups: any = {};
    simulationData.forEach(sim => {
      const asset = assets.find(a => a.ticker === sim.ticker);
      if (!asset) return;
      if (!groups[asset.category]) groups[asset.category] = { currentValue: 0, targetValue: 0, actionAmount: 0, smartActionAmount: 0, subs: {} };
      groups[asset.category].currentValue += sim.currentValue;
      groups[asset.category].targetValue += sim.targetValue;
      groups[asset.category].actionAmount += sim.actionAmount;
      groups[asset.category].smartActionAmount += sim.smartActionAmount || 0;

      if (!groups[asset.category].subs[asset.subCategory]) groups[asset.category].subs[asset.subCategory] = { currentValue: 0, targetValue: 0, actionAmount: 0, smartActionAmount: 0, assets: [] };
      groups[asset.category].subs[asset.subCategory].currentValue += sim.currentValue;
      groups[asset.category].subs[asset.subCategory].targetValue += sim.targetValue;
      groups[asset.category].subs[asset.subCategory].actionAmount += sim.actionAmount;
      groups[asset.category].subs[asset.subCategory].smartActionAmount += sim.smartActionAmount || 0;

      sim.overweight = (sim.currentPercent - sim.targetPercent) * 100;
      groups[asset.category].subs[asset.subCategory].assets.push(sim);
    });

    // Compute currentPercent / targetPercent for each level
    const projectedTotal = totalPortfolioValue + contribution;
    Object.values(groups).forEach((catData: any) => {
      catData.currentPercent = projectedTotal > 0 ? (catData.currentValue / projectedTotal) * 100 : 0;
      catData.targetPercent = projectedTotal > 0 ? (catData.targetValue / projectedTotal) * 100 : 0;
      catData.overweight = catData.currentPercent - catData.targetPercent;
      Object.values(catData.subs).forEach((subData: any) => {
        subData.currentPercent = projectedTotal > 0 ? (subData.currentValue / projectedTotal) * 100 : 0;
        subData.targetPercent = projectedTotal > 0 ? (subData.targetValue / projectedTotal) * 100 : 0;
        subData.overweight = subData.currentPercent - subData.targetPercent;
      });
    });
    return groups;
  }, [simulationData, assets, totalPortfolioValue, contribution]);

  const hasDeviationWarning = useMemo(() => {
    let warning = false;
    Object.values(groupedSimData).forEach((catData: any) => {
      if (Math.abs(catData.overweight) > 5) warning = true;
      Object.values(catData.subs).forEach((subData: any) => {
        if (Math.abs(subData.overweight) > 5) warning = true;
        subData.assets.forEach((sim: any) => {
          if (Math.abs(sim.overweight) > 5) warning = true;
        });
      });
    });
    return warning;
  }, [groupedSimData]);

  // Top gainers and losers by P/L %
  const { topGainers, topLosers } = useMemo(() => {
    const withPL = assets.map(a => {
      const plPercent = a.averagePrice > 0 ? ((a.currentPrice - a.averagePrice) / a.averagePrice) * 100 : 0;
      return { ...a, plPercent };
    });
    const sorted = [...withPL].sort((a, b) => b.plPercent - a.plPercent);
    return {
      topGainers: sorted.filter(a => a.plPercent > 0).slice(0, 5),
      topLosers: sorted.filter(a => a.plPercent < 0).slice().reverse().slice(0, 5),
    };
  }, [assets]);

  const priorityMap = useMemo(() => {
    const map: Record<string, { rank: number; deficit: number; deficitPercent: number; level: string }> = {};
    const allAssets: { ticker: string; deficit: number; deficitPercent: number }[] = [];

    Object.values(groupedSimData).forEach((catData: any) => {
      Object.values(catData.subs).forEach((subData: any) => {
        subData.assets.forEach((sim: any) => {
          const deficit = sim.targetValue - sim.currentValue;
          const deficitPercent = sim.targetValue > 0 ? (deficit / sim.targetValue) * 100 : 0;
          allAssets.push({ ticker: sim.ticker, deficit, deficitPercent });
        });
      });
    });

    // Sort by deficit descending (highest need first)
    allAssets.sort((a, b) => b.deficit - a.deficit);
    allAssets.forEach((a, idx) => {
      const level = a.deficit > 0
        ? (idx < Math.ceil(allAssets.length * 0.33) ? 'alta' : idx < Math.ceil(allAssets.length * 0.66) ? 'media' : 'baixa')
        : 'ok';
      map[a.ticker] = { rank: idx + 1, deficit: a.deficit, deficitPercent: a.deficitPercent, level };
    });
    return map;
  }, [groupedSimData]);

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
            <div className="flex items-center space-x-4">
              <button onClick={() => equalize('segment')} className="text-xs text-brand-400 hover:text-brand-300">
                Igualar Tudo
              </button>
              <button
                onClick={handleSaveTargets}
                disabled={isSaving}
                className={`text-xs px-3 py-1 rounded font-bold transition-all ${isSaving ? 'bg-slate-700 text-slate-500' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20'}`}
              >
                {isSaving ? 'Salvando...' : 'Salvar Estratégia'}
              </button>
            </div>
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
                      min="0" max="100" step="any"
                      value={segmentWeights[cat] !== undefined ? segmentWeights[cat] : ''}
                      onChange={(e) => setSegmentWeights({ ...segmentWeights, [cat]: e.target.value ? Number(e.target.value) : 0 })}
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
                                min="0" max="100" step="any"
                                value={subSegmentWeights[subKey] !== undefined ? subSegmentWeights[subKey] : ''}
                                onChange={(e) => setSubSegmentWeights({ ...subSegmentWeights, [subKey]: e.target.value ? Number(e.target.value) : 0 })}
                                className="w-16 bg-dark-bg border border-slate-600 rounded px-2 py-1 text-right text-xs text-white"
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
                                          min="0" max="100" step="any"
                                          value={assetWeights[assetKey] !== undefined ? assetWeights[assetKey] : ''}
                                          onChange={(e) => setAssetWeights({ ...assetWeights, [assetKey]: e.target.value ? Number(e.target.value) : 0 })}
                                          className="w-14 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-right text-xs text-slate-200"
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Simulação</h3>
            <div className="flex items-center space-x-4">
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setDisplayCurrency('BRL')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${displayCurrency === 'BRL' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  BRL
                </button>
                <button
                  onClick={() => setDisplayCurrency('USD')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${displayCurrency === 'USD' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  USD
                </button>
              </div>
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setIsRebalanceMode(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isRebalanceMode ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Aportar
                </button>
                <button 
                  onClick={() => setIsRebalanceMode(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isRebalanceMode ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Rebalancear
                </button>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-xs text-slate-400 mb-1">{isRebalanceMode ? `Aporte Opcional (${displayCurrency})` : `Novo Aporte (${displayCurrency})`}</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500">{displayCurrency === 'USD' ? 'US$' : 'R$'}</span>
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
              <span className="text-white font-medium">{formatCurrency(totalPortfolioValue)}</span>
            </div>
            <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
              <span className="text-slate-400">Patrimônio Projetado</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(totalPortfolioValue + contribution)}</span>
            </div>
          </div>
        </Card>

        <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-dark-border bg-slate-800/50">
            <h3 className="font-semibold text-white">Plano de Compra</h3>
          </div>
          {hasDeviationWarning && (
            <div className="bg-amber-900/40 border-b border-amber-700/50 p-3 flex items-start gap-3">
              <span className="text-amber-500 text-xl">⚠️</span>
              <div>
                <h4 className="text-amber-400 font-bold text-sm">Necessidade de Rebalanceamento</h4>
                <p className="text-amber-200/80 text-xs mt-0.5">Existem ativos ou segmentos com mais de 5% de desvio do alvo. Considere utilizar o modo "Rebalancear".</p>
              </div>
            </div>
          )}
          <div className="max-h-[600px] overflow-y-auto">
            <div className="w-full text-left text-sm">
              <div className="flex bg-slate-800 text-xs text-slate-400 sticky top-0 px-4 py-2 font-bold z-10">
                <div className="flex-1">Categoria / Ativo</div>
                <div className="w-24 text-right">Atual</div>
                <div className="w-24 text-right">Target</div>
                <div className="w-24 text-right">Sugestão</div>
              </div>
              <div className="divide-y divide-slate-700">
                {Object.entries(groupedSimData).map(([cat, catData]: any) => (
                  <div key={cat} className="mb-2 border-b border-slate-700/50 pb-2">
                    {/* Category Header */}
                    <div className="flex flex-col">
                      <div className="flex px-4 py-2 bg-slate-800/30 font-bold text-white items-center hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => togglePlanCat(cat)}>
                        <div className="flex items-center flex-1">
                          <span className={`mr-2 transform transition-transform text-[10px] text-slate-400 ${!collapsedPlanCategories.includes(cat) ? 'rotate-90' : ''}`}>▶</span>
                          <span className="uppercase text-xs tracking-wider border-l-2 border-brand-500 pl-2">{cat}</span>
                        </div>
                        <div className="w-24 text-right text-[11px] text-slate-400">
                           {formatCurrency(catData.currentValue)}
                        </div>
                        <div className="w-24 text-right text-[11px] text-slate-400">
                           {formatCurrency(catData.targetValue)}
                        </div>
                        <div className="w-24 text-right">
                          {catData.actionAmount > 0.01 ? (
                            <span className="text-emerald-400 text-xs font-bold">+ {formatCurrency(catData.actionAmount)}</span>
                          ) : catData.actionAmount < -0.01 ? (
                            <span className="text-red-400 text-xs font-bold">- {formatCurrency(Math.abs(catData.actionAmount))}</span>
                          ) : <span className="text-slate-600 text-[10px]">-</span>}
                        </div>
                      </div>
                      {Math.abs(catData.overweight) > 5 && (
                        <div className="mx-4 mb-1 flex items-center gap-2 px-2 py-1 bg-amber-900/30 border border-amber-700/50 rounded text-[10px]">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-black font-bold text-[8px]">⚠</span>
                          <span className="text-amber-400 font-semibold">{catData.overweight > 0 ? 'Sobrecarregado:' : 'Abaixo do alvo:'}</span>
                          <span className="text-amber-200">Atual {catData.currentPercent.toFixed(1)}%</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-amber-200">Target {catData.targetPercent.toFixed(1)}%</span>
                          <span className="text-amber-500 font-bold">({catData.overweight > 0 ? '+' : ''}{catData.overweight.toFixed(1)}%)</span>
                        </div>
                      )}
                    </div>

                    {/* Subcategories */}
                    {!collapsedPlanCategories.includes(cat) && Object.entries(catData.subs).map(([sub, subData]: any) => {
                      const subKey = `${cat}:${sub}`;
                      return (
                      <div key={sub} className="ml-4 border-l border-slate-700 pt-1">
                        <div className="flex flex-col">
                          <div className="flex px-4 py-1.5 text-slate-300 items-center bg-slate-800/10 hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => togglePlanSub(subKey)}>
                            <div className="flex items-center flex-1">
                               <span className={`mr-2 transform transition-transform text-[8px] text-slate-500 ${!collapsedPlanSubCategories.includes(subKey) ? 'rotate-90' : ''}`}>▶</span>
                               <span className="text-xs font-medium text-slate-400">{sub}</span>
                            </div>
                            <div className="w-24 text-right text-[10px] text-slate-500">
                              {formatCurrency(subData.currentValue)}
                            </div>
                            <div className="w-24 text-right text-[10px] text-slate-500">
                              {formatCurrency(subData.targetValue)}
                            </div>
                            <div className="w-24 text-right">
                              {subData.actionAmount > 0.01 ? (
                                <span className="text-emerald-500/80 text-[10px] font-semibold">+ {formatCurrency(subData.actionAmount)}</span>
                              ) : subData.actionAmount < -0.01 ? (
                                <span className="text-red-500/80 text-[10px] font-semibold">- {formatCurrency(Math.abs(subData.actionAmount))}</span>
                              ) : <span className="text-slate-600 text-[10px]">-</span>}
                            </div>
                          </div>
                          {Math.abs(subData.overweight) > 5 && (
                            <div className="mx-4 mb-1 flex items-center gap-1.5 px-2 py-0.5 bg-amber-900/20 border border-amber-800/40 rounded text-[9px]">
                              <span className="text-amber-400">⚠</span>
                              <span className="text-amber-300">Atual {subData.currentPercent.toFixed(1)}%</span>
                              <span className="text-slate-600">→</span>
                              <span className="text-amber-300">Target {subData.targetPercent.toFixed(1)}%</span>
                              <span className="text-amber-500 font-semibold">({subData.overweight > 0 ? '+' : ''}{subData.overweight.toFixed(1)}%)</span>
                            </div>
                          )}
                        </div>

                        {/* Assets */}
                        {!collapsedPlanSubCategories.includes(subKey) && (
                        <div className="divide-y divide-slate-700/30">
                          {subData.assets.map((sim: any) => (
                            <div key={sim.ticker} className="flex px-4 py-2 ml-4 hover:bg-slate-800/30 transition-colors items-center">
                              <div className="flex-1 flex items-center gap-2">
                                <div className="font-bold text-slate-200 text-xs">{sim.ticker}</div>
                                {Math.abs(sim.overweight) > 5 && (
                                  <span className="text-amber-500 text-[10px] font-bold" title="Desvio > 5%">⚠</span>
                                )}
                              </div>
                              <div className="w-24 text-right">
                                <div className="text-slate-400 font-medium text-[11px]">{formatCurrency(sim.currentValue)}</div>
                              </div>
                              <div className="w-24 text-right">
                                <div className="text-brand-400 font-medium text-[11px]">{(sim.targetPercent * 100).toFixed(1)}%</div>
                                <div className="text-[10px] text-slate-500">
                                  {formatCurrency(sim.targetValue)}
                                </div>
                              </div>
                              <div className="w-24 text-right flex justify-end">
                                {sim.actionAmount > 0.01 ? (
                                  <span className="inline-flex justify-center items-center px-1.5 py-0.5 bg-emerald-900/50 text-emerald-400 rounded border border-emerald-800 font-bold text-[10px]">
                                    + {formatCurrency(sim.actionAmount, 0)}
                                  </span>
                                ) : sim.actionAmount < -0.01 ? (
                                  <span className="inline-flex justify-center items-center px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded border border-red-800 font-bold text-[10px]">
                                    - {formatCurrency(Math.abs(sim.actionAmount), 0)}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[10px]">Aguardar</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Gainers / Losers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 border-b border-dark-border bg-slate-800/50 flex items-center gap-2">
              <span className="text-emerald-400 text-sm">▲</span>
              <h3 className="font-semibold text-white text-sm">Maiores Valorizações</h3>
            </div>
            <div className="p-2">
              {topGainers.length > 0 ? topGainers.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 border-b border-slate-800 last:border-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                      {a.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{a.ticker}</div>
                      <div className="text-[10px] text-slate-500">{a.name.length > 18 ? a.name.substring(0, 18) + '...' : a.name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">+{a.plPercent.toFixed(2)}%</span>
                </div>
              )) : (
                <div className="text-center text-slate-500 text-xs py-6">Nenhum ativo valorizado</div>
              )}
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 border-b border-dark-border bg-slate-800/50 flex items-center gap-2">
              <span className="text-red-400 text-sm">▼</span>
              <h3 className="font-semibold text-white text-sm">Maiores Desvalorizações</h3>
            </div>
            <div className="p-2">
              {topLosers.length > 0 ? topLosers.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 border-b border-slate-800 last:border-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold bg-red-500/10 text-red-500">
                      {a.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{a.ticker}</div>
                      <div className="text-[10px] text-slate-500">{a.name.length > 18 ? a.name.substring(0, 18) + '...' : a.name}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-400">{a.plPercent.toFixed(2)}%</span>
                </div>
              )) : (
                <div className="text-center text-slate-500 text-xs py-6">Nenhum ativo desvalorizado</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};