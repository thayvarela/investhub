import React, { useState } from 'react';
import { Asset, HistoryDataPoint, ViewMode } from './types';
import { MOCK_BANK_ASSETS } from './constants';
import { classifyAssets } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { Tabs } from './components/ui/Tabs';
import { RebalancingDashboard } from './components/RebalancingDashboard';

// Mock UUID generation
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

// Mock History Generator
const generateMockHistory = (currentTotalValue: number, days: number = 365): HistoryDataPoint[] => {
  const history: HistoryDataPoint[] = [];
  let currentValue = currentTotalValue;
  // Assume some volatility and growth backward
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random daily fluctuation between -1.5% and +1.6%
    const fluctuation = 1 + (Math.random() * 0.031 - 0.015); 
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: currentValue,
      invested: currentValue * 0.8 // Rough estimate invested amount
    });

    currentValue = currentValue / fluctuation; // Reverse calculate
  }

  return history.reverse();
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Manual Add Form State
  const [newAsset, setNewAsset] = useState({ ticker: '', name: '', quantity: '', price: '', category: 'Manual', subCategory: 'Geral' });

  // Simulate connecting to external institutions (Open Banking / CEI)
  const handleConnectIntegration = async () => {
    setLoading(true);
    setIsModalOpen(false);

    try {
      // 1. Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Prepare mock data
      const rawAssets = MOCK_BANK_ASSETS.map(ma => ({
        ticker: ma.ticker,
        name: ma.name,
      }));

      // 3. Call Gemini to classify
      const classifications = await classifyAssets(rawAssets);

      // 4. Merge Data
      let totalCurrentValue = 0;
      const processedAssets: Asset[] = MOCK_BANK_ASSETS.map(ma => {
        const cls = classifications.find(c => c.ticker === ma.ticker);
        totalCurrentValue += ma.quantity * ma.currentPrice;
        
        // Random performance data generation for demo purposes
        const rand = () => (Math.random() * 20) - 10; // -10% to +10%

        return {
          id: generateId(),
          ticker: ma.ticker,
          name: ma.name,
          quantity: ma.quantity,
          averagePrice: ma.averagePrice,
          currentPrice: ma.currentPrice,
          category: cls?.category || 'Outros',
          subCategory: cls?.subCategory || 'Diversos',
          isManual: false,
          change1D: rand() / 4, // smaller daily var
          change5D: rand() / 2,
          change1M: rand(),
          changeYTD: rand() * 3, // larger yearly var
        };
      });

      // 5. Generate History based on this snapshot
      const mockHistory = generateMockHistory(totalCurrentValue, 365 * 2);

      setAssets(processedAssets);
      setHistory(mockHistory);
      setIsFirstLoad(false);

    } catch (error) {
      console.error("Failed to sync", error);
      alert("Erro ao sincronizar contas. Verifique o console.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAsset = (updated: Asset) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleBatchUpdateAssets = (updatedAssets: Asset[]) => {
    setAssets(prev => {
      const newAssets = [...prev];
      updatedAssets.forEach(updated => {
        const index = newAssets.findIndex(a => a.id === updated.id);
        if (index !== -1) {
          newAssets[index] = updated;
        }
      });
      return newAssets;
    });
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.ticker || !newAsset.quantity) return;

    const quantity = Number(newAsset.quantity);
    const price = Number(newAsset.price);
    const totalValue = quantity * price;

    const asset: Asset = {
      id: generateId(),
      ticker: newAsset.ticker.toUpperCase(),
      name: newAsset.name || newAsset.ticker,
      quantity: quantity,
      averagePrice: price,
      currentPrice: price,
      category: newAsset.category,
      subCategory: newAsset.subCategory,
      isManual: true,
      change1D: 0,
      change5D: 0,
      change1M: 0,
      changeYTD: 0
    };

    setAssets(prev => [...prev, asset]);
    
    // Update history
    if (history.length > 0) {
        const lastPoint = history[history.length - 1];
        setHistory([...history, {
            date: new Date().toISOString().split('T')[0],
            value: lastPoint.value + totalValue,
            invested: lastPoint.invested + totalValue
        }]);
    } else {
        setHistory(generateMockHistory(totalValue, 30));
    }

    setNewAsset({ ticker: '', name: '', quantity: '', price: '', category: 'Manual', subCategory: 'Geral' });
    setIsModalOpen(false);
  };

  // Auth Flow
  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="border-b border-dark-border bg-dark-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
                AF
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                AssetFlow
              </span>
            </div>
            <div className="flex items-center space-x-4">
               <div className="hidden md:flex flex-col text-right mr-2">
                 <span className="text-xs text-slate-400">Olá, Investidor</span>
               </div>
               <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 overflow-hidden">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
               </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-brand-600/20 flex items-center"
              >
                <span className="mr-2">+</span> <span className="hidden sm:inline">Adicionar / Conectar</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-slate-300">Conectando ao Banco Central e Corretoras...</p>
            <p className="text-sm text-slate-500">A IA Gemini está analisando e categorizando seus ativos.</p>
          </div>
        ) : assets.length === 0 && isFirstLoad ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-fade-in-up">
            <div className="bg-dark-card p-8 rounded-2xl border border-dark-border max-w-lg shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-indigo-500"></div>
              <h2 className="text-3xl font-bold text-white mb-4">Comece sua Jornada</h2>
              <p className="text-slate-400 mb-8">
                Você ainda não possui ativos conectados. Conecte suas contas para que nossa IA organize seu portfólio em "Bolsa BR", "Cripto" e "Exterior".
              </p>
              <button 
                onClick={handleConnectIntegration}
                className="w-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl text-lg transition-all transform hover:scale-[1.02] shadow-xl flex justify-center items-center"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Conectar via Open Finance
              </button>
              <div className="mt-6 pt-6 border-t border-slate-700">
                 <button onClick={() => setIsModalOpen(true)} className="text-sm text-slate-400 hover:text-white underline">
                    Ou adicione um ativo manualmente
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Tabs 
              activeTab={activeTab} 
              onChange={setActiveTab}
              tabs={[
                { id: 'overview', label: 'Visão Geral / Real', icon: <span>📊</span> },
                { id: 'planning', label: 'Planejamento / Simulação', icon: <span>🎯</span> }
              ]}
            />
            
            {activeTab === 'overview' ? (
              <Dashboard assets={assets} history={history} onUpdateAsset={handleUpdateAsset} />
            ) : (
              <RebalancingDashboard assets={assets} onBatchUpdateAssets={handleBatchUpdateAssets} />
            )}
          </>
        )}

      </main>

      {/* Modal for Add/Connect */}
      {isModalOpen && !loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Adicionar Ativos</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Option A: Auto Sync */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer" onClick={handleConnectIntegration}>
                <div className="flex items-center mb-2">
                   <div className="p-2 bg-brand-500/20 rounded-full mr-3 text-brand-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </div>
                   <h4 className="font-semibold text-white">Sincronização Automática</h4>
                </div>
                <p className="text-sm text-slate-400 pl-12">Importe dados do Banco Central, B3 e Exchanges.</p>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs tracking-wider">OU MANUALMENTE</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              {/* Option B: Manual Form */}
              <form onSubmit={handleManualAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Ticker / Símbolo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: AAPL" 
                      className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                      value={newAsset.ticker}
                      onChange={e => setNewAsset({...newAsset, ticker: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Quantidade</label>
                    <input 
                      required
                      type="number" 
                      placeholder="0.00" 
                      step="any"
                      className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                      value={newAsset.quantity}
                      onChange={e => setNewAsset({...newAsset, quantity: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs text-slate-400 mb-1">Preço Médio (R$)</label>
                   <input 
                      required
                      type="number" 
                      placeholder="0.00" 
                      step="any"
                      className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                      value={newAsset.price}
                      onChange={e => setNewAsset({...newAsset, price: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Ações EUA" 
                      className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                      value={newAsset.category}
                      onChange={e => setNewAsset({...newAsset, category: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sub-Categoria</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Tech" 
                      className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                      value={newAsset.subCategory}
                      onChange={e => setNewAsset({...newAsset, subCategory: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-medium mt-2 transition-colors"
                >
                  Adicionar Manualmente
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
