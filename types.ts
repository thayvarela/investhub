export interface Asset {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number; // Preço médio de compra
  currentPrice: number; // Preço atual de mercado
  category: string; // Ex: Bolsa BR, Cripto, Exterior
  subCategory: string; // Ex: Bancos, Tech, Commodities
  isManual: boolean;
  // Performance variations (percentages)
  change1D: number;
  change5D: number;
  change1M: number;
  changeYTD: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPL: number; // Profit/Loss value
  totalPLPercentage: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface HistoryDataPoint {
  date: string; // ISO String YYYY-MM-DD
  value: number;
  invested: number;
}

export type TimeRange = '1M' | '6M' | '1Y' | 'YTD' | 'ALL';

export type PerformancePeriod = '1D' | '5D' | '1M' | 'YTD';

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  LIST = 'LIST',
  ADD = 'ADD'
}

// Gemini Response Types
export interface AssetClassification {
  ticker: string;
  category: string;
  subCategory: string;
}

// Rebalancing Types
export interface TargetAllocation {
  [key: string]: number; // Key can be 'Category:Name', 'Sub:Name', 'Asset:Ticker'
}

export interface SimulationResult {
  ticker: string;
  currentValue: number;
  currentPercent: number;
  targetValue: number;
  targetPercent: number;
  actionAmount: number; // Positive = Buy, Negative = Sell (usually 0 if contribution covers it)
}
