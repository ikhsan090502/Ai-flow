export type AssetType = 'crypto' | 'forex' | 'commodity';

export interface Asset {
  symbol: string;      // exchange symbol (e.g., BTCUSDT, EURUSD=X)
  name: string;        // readable name (e.g., Bitcoin, EUR/USD)
  type: AssetType;
  baseAsset: string;   // e.g., BTC, EUR
  quoteAsset: string;  // e.g., USDT, USD
}

export interface LivePrice {
  symbol: string;
  price: number;
  change24h: number;   // percentage change
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

export type SignalType = 'BUY' | 'SELL' | 'NEUTRAL';
export type SignalStatus = 'ACTIVE' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'EXPIRED';

export interface MarketSignal {
  id: string;
  pair: string;            // e.g., BTCUSDT, XAUUSD
  type: SignalType;        // BUY, SELL, NEUTRAL
  style: string;           // e.g., SCALP, DAY TRADE, SWING
  entryPrice: number;
  currentPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  stopLoss: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: string;       // human readable analysis of market sentiment
  mtfAnalysis: string;    // Multi-Timeframe analysis explanation
  bullishCase: string;     // Bullish checklist/justification
  bearishCase: string;     // Bearish checklist/justification
  pipsProfit: number;      // current pips or percentage profit/loss
  status: SignalStatus;
  timestamp: number;       // creation time
  resolutionTimestamp?: number; // time when hit TP/SL/Expired
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface SignalHistoryStats {
  totalSignals: number;
  winRate: number;        // win percentage
  totalPips: number;      // total pips/percent accumulated
  buyCount: number;
  sellCount: number;
}
