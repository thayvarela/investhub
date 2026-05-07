import React, { useState, useEffect } from 'react';
import { Asset, HistoryDataPoint, PortfolioReturns } from './types';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { Tabs } from './components/ui/Tabs';
import { RebalancingDashboard } from './components/RebalancingDashboard';
import * as authService from './services/authService';
import * as assetService from './services/assetService';
import api from './services/api';
import { PluggyWidget } from './components/PluggyWidget';
import * as rebalanceService from './services/rebalanceService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<HistoryDataPoint[]>([]); // To be implemented in backend completely
  const [returns, setReturns] = useState<PortfolioReturns | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPluggyWidget, setShowPluggyWidget] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [targets, setTargets] = useState<rebalanceService.BackendTarget[]>([]);

  // Manual Add Form State
  const [newAsset, setNewAsset] = useState({ ticker: '', name: '', quantity: '', price: '', averagePrice: '', category: 'Manual', subCategory: 'Geral', currency: 'BRL' });
  const [quotes, setQuotes] = useState<{ [key: string]: number }>({ USDBRL: 1 });

  // Search State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch Data on Auth
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsData, historyResponse, quotesData, targetsData, returnsData] = await Promise.all([
        assetService.getAssets(),
        api.get('/history').then(res => res.data.map((h: any) => ({
             date: h.date, 
             value: h.totalValue, 
             invested: h.totalInvested 
        }))).catch(() => []), // Graceful fail if history invalid
        assetService.getQuotes().catch(() => ({ USDBRL: 5.0 })), // Fallback if API fails
        rebalanceService.getTargets().catch(() => []),
        api.get('/history/returns').then(res => res.data).catch(() => null)
      ]);
      setAssets(assetsData);
      setHistory(historyResponse);
      setQuotes(quotesData);
      setTargets(targetsData);
      setReturns(returnsData);
    } catch (error) {
      console.error("Failed to load data", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
      setIsFirstLoad(false);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const data = await authService.login(email, pass);
    localStorage.setItem('token', data.token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setAssets([]);
  };

  const handleConnectIntegration = () => {
    setShowPluggyWidget(true);
  };

  const handlePluggySuccess = async () => {
    await loadData();
    setShowPluggyWidget(false);
    setIsModalOpen(false);
    alert("Sincronização concluída com sucesso!");
  };

  const handleUpdateAsset = async (updated: Asset) => {
    try {
      const result = await assetService.updateAsset(updated.id, {
        quantity: updated.quantity,
        averagePrice: updated.averagePrice,
        currentPrice: updated.currentPrice,
        category: updated.category,
        subCategory: updated.subCategory
      });
      setAssets(prev => prev.map(a => a.id === result.id ? result : a));
    } catch (error) {
      console.error("Failed to update asset", error);
      alert("Erro ao atualizar ativo.");
    }
  };

  const handleBatchUpdateAssets = async (updatedAssets: Asset[]) => {
    try {
      await assetService.batchUpdateAssets(updatedAssets);
      // Optimistic update or reload
      await loadData();
    } catch (error) {
      console.error("Failed to batch update", error);
      alert("Erro ao atualizar ativos em massa.");
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await assetService.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      // alert("Ativo removido.");
    } catch (error) {
      console.error("Failed to delete asset", error);
      alert("Erro ao remover ativo.");
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.ticker || !newAsset.quantity) return;

    try {
      await assetService.createAsset({
        ticker: newAsset.ticker.toUpperCase(),
        name: newAsset.name || newAsset.ticker,
        quantity: Number(newAsset.quantity),
        averagePrice: Number(newAsset.averagePrice || newAsset.price),
        currentPrice: Number(newAsset.price),
        currency: newAsset.currency,
        category: newAsset.category,
        subCategory: newAsset.subCategory,
        isManual: true
      });

      await loadData(); // Reload to get IDs and calculations from backend
      setNewAsset({ ticker: '', name: '', quantity: '', price: '', averagePrice: '', category: 'Manual', subCategory: 'Geral', currency: 'BRL' });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create asset", error);
      alert("Erro ao criar ativo.");
    }
  };

  // Auth Flow
  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
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
                <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">Sair</button>
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

        {loading && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-slate-300">Carregando carteira...</p>
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
              <Dashboard assets={assets} history={history} quotes={quotes} returns={returns} onUpdateAsset={handleUpdateAsset} onDeleteAsset={handleDeleteAsset} />
            ) : (
              <RebalancingDashboard
                assets={assets}
                quotes={quotes}
                targets={targets}
                onBatchUpdateAssets={handleBatchUpdateAssets}
              />
            )}
          </>
        )}

      </main>

      {/* Modal for Add/Connect */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-dark-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Adicionar Ativos</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {showPluggyWidget ? (
                <PluggyWidget
                  onSuccess={handlePluggySuccess}
                  onClose={() => setShowPluggyWidget(false)}
                />
              ) : (
                <>
                  {/* Option A: Auto Sync */}
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer" onClick={handleConnectIntegration}>
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-brand-500/20 rounded-full mr-3 text-brand-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </div>
                      <h4 className="font-semibold text-white">Conectar Conta (Open Finance)</h4>
                    </div>
                    <p className="text-sm text-slate-400 pl-12">Conecte seus bancos e corretoras reais via Pluggy.</p>
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
                        <label className="block text-xs text-slate-400 mb-1">Ticker / Nome (Busca)</label>
                        <div className="relative group">
                          <input
                            required
                            type="text"
                            placeholder="Ex: Itaú ou ITUB4"
                            className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500 uppercase"
                            value={newAsset.ticker}
                            onChange={async (e) => {
                              const val = e.target.value.toUpperCase();
                              setNewAsset({ ...newAsset, ticker: val });
                              if (val.length > 0) {
                                setIsSearching(true);
                                try {
                                  const results = await assetService.searchAssets(val);
                                  setSearchResults(results);
                                } catch (err) { console.log(err) }
                                setIsSearching(false);
                              } else {
                                setSearchResults([]);
                              }
                            }}
                            onBlur={async () => {
                              // Delay to allow click on suggestion
                              setTimeout(async () => {
                                setSearchResults([]); // Close suggestions

                                // Trigger price fetch if valid ticker
                                if (newAsset.ticker.length >= 1) {
                                  try {
                                    const priceData = await assetService.fetchPrice(newAsset.ticker);
                                    if (priceData && priceData.currentPrice) {
                                      setNewAsset(prev => ({
                                        ...prev,
                                        price: priceData.currentPrice.toString(),
                                        currency: priceData.currency || prev.currency,
                                        category: priceData.suggestedCategory || prev.category,
                                        subCategory: priceData.suggestedSubCategory || prev.subCategory
                                      }));
                                    }
                                  } catch (err) { }
                                }
                              }, 200);
                            }}
                          />
                          {/* Search Results Dropdown */}
                          {searchResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                              {searchResults.map((res: any) => (
                                <div
                                  key={res.ticker}
                                  className="p-2 hover:bg-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                                  onClick={async () => {
                                    const ticker = res.ticker;
                                    setNewAsset(prev => ({ ...prev, ticker }));
                                    setSearchResults([]);
                                    try {
                                      const priceData = await assetService.fetchPrice(ticker);
                                      if (priceData && priceData.currentPrice) {
                                        setNewAsset(prev => ({
                                          ...prev,
                                          ticker,
                                          price: priceData.currentPrice.toString(),
                                          currency: priceData.currency || prev.currency,
                                          category: priceData.suggestedCategory || prev.category,
                                          subCategory: priceData.suggestedSubCategory || prev.subCategory
                                        }));
                                      }
                                    } catch (err) { }
                                  }}
                                >
                                  <div className="flex flex-col text-left">
                                    <span className="font-bold text-white text-sm">{res.ticker}</span>
                                    <span className="text-xs text-slate-400">{res.name}</span>
                                  </div>
                                  {res.logo && <img src={res.logo} className="w-6 h-6 rounded-full" alt="" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
                          onChange={e => setNewAsset({ ...newAsset, quantity: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Preço Atual ({newAsset.currency})</label>
                        <input
                          required
                          type="number"
                          placeholder="0.00"
                          step="any"
                          className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                          value={newAsset.price}
                          onChange={e => setNewAsset({ ...newAsset, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Preço Médio ({newAsset.currency})</label>
                        <input
                          required
                          type="number"
                          placeholder="0.00"
                          step="any"
                          className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                          value={newAsset.averagePrice}
                          onChange={e => setNewAsset({ ...newAsset, averagePrice: e.target.value })}
                        />
                      </div>
                    </div>

                    {newAsset.quantity && newAsset.price && (
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-500">
                          Total Pago: {new Intl.NumberFormat(newAsset.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: newAsset.currency }).format(Number(newAsset.quantity) * Number(newAsset.averagePrice || newAsset.price))}
                        </p>
                        <p className="text-xs text-emerald-400">
                          Total Atual: {new Intl.NumberFormat(newAsset.currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency: newAsset.currency }).format(Number(newAsset.quantity) * Number(newAsset.price))}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Moeda</label>
                        <select
                          className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                          value={newAsset.currency}
                          onChange={e => setNewAsset({ ...newAsset, currency: e.target.value })}
                        >
                          <option value="BRL">BRL (R$)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                        <input
                          type="text"
                          placeholder="Ex: Bolsa BR"
                          className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                          value={newAsset.category}
                          onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Sub-Categoria</label>
                        <input
                          type="text"
                          placeholder="Ex: Ações"
                          className="w-full bg-dark-bg border border-slate-600 rounded p-2 text-white focus:border-brand-500 outline-none focus:ring-1 focus:ring-brand-500"
                          value={newAsset.subCategory}
                          onChange={e => setNewAsset({ ...newAsset, subCategory: e.target.value })}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
