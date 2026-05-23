import { Asset } from './types';

export const SUPPORTED_ASSETS: Asset[] = [
  // Commodities / Metals
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'commodity', baseAsset: 'XAU', quoteAsset: 'USD' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', type: 'commodity', baseAsset: 'XAG', quoteAsset: 'USD' },
  
  // Crypto
  { symbol: 'BTCUSDT', name: 'Bitcoin / Tether', type: 'crypto', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', name: 'Ethereum / Tether', type: 'crypto', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT', name: 'Solana / Tether', type: 'crypto', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT', name: 'BNB / Tether', type: 'crypto', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin / Tether', type: 'crypto', baseAsset: 'DOGE', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT', name: 'Ripple / Tether', type: 'crypto', baseAsset: 'XRP', quoteAsset: 'USDT' },

  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', baseAsset: 'EUR', quoteAsset: 'USD' },
  { symbol: 'GBPUSD', name: 'Great Britain Pound / US Dollar', type: 'forex', baseAsset: 'GBP', quoteAsset: 'USD' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', baseAsset: 'AUD', quoteAsset: 'USD' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', baseAsset: 'USD', quoteAsset: 'JPY' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', baseAsset: 'USD', quoteAsset: 'CAD' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'forex', baseAsset: 'USD', quoteAsset: 'CHF' },
];
