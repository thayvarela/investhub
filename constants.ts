// Cores para os gráficos
export const CHART_COLORS = [
  '#0ea5e9', // Sky 500
  '#22c55e', // Green 500
  '#eab308', // Yellow 500
  '#f97316', // Orange 500
  '#ec4899', // Pink 500
  '#8b5cf6', // Violet 500
  '#64748b', // Slate 500
  '#14b8a6', // Teal 500
];

// Dados mockados para simular a "conexão bancária"
export const MOCK_BANK_ASSETS = [
  { ticker: 'PETR4', name: 'Petrobras PN', quantity: 200, averagePrice: 32.50, currentPrice: 38.90 },
  { ticker: 'BBAS3', name: 'Banco do Brasil ON', quantity: 150, averagePrice: 45.00, currentPrice: 58.20 },
  { ticker: 'VALE3', name: 'Vale ON', quantity: 100, averagePrice: 68.00, currentPrice: 62.10 },
  { ticker: 'QQQM', name: 'Invesco NASDAQ 100', quantity: 15, averagePrice: 160.00, currentPrice: 185.40 }, // USD prices assumed converted or raw
  { ticker: 'IAU', name: 'iShares Gold Trust', quantity: 50, averagePrice: 38.00, currentPrice: 42.50 },
  { ticker: 'NFLX', name: 'Netflix Inc', quantity: 5, averagePrice: 400.00, currentPrice: 620.00 },
  { ticker: 'BTC', name: 'Bitcoin', quantity: 0.05, averagePrice: 150000, currentPrice: 350000 }, // BRL values
  { ticker: 'SOL', name: 'Solana', quantity: 20, averagePrice: 150, currentPrice: 800 },
  { ticker: 'MXRF11', name: 'Maxi Renda FII', quantity: 500, averagePrice: 10.10, currentPrice: 10.50 },
  { ticker: 'Tesouro Selic 2027', name: 'Tesouro Direto Selic', quantity: 2, averagePrice: 12000, currentPrice: 13500 },
];
