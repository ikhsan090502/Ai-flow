import { Asset } from './types';

export const SUPPORTED_ASSETS: Asset[] = [
  // Commodities / Metals
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'commodity', baseAsset: 'XAU', quoteAsset: 'USD' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', type: 'commodity', baseAsset: 'XAG', quoteAsset: 'USD' },
  
  // Crypto Spot
  { symbol: 'BTCUSDT', name: 'Bitcoin / Tether', type: 'crypto', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', name: 'Ethereum / Tether', type: 'crypto', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT', name: 'Solana / Tether', type: 'crypto', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT', name: 'BNB / Tether', type: 'crypto', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin / Tether', type: 'crypto', baseAsset: 'DOGE', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT', name: 'Ripple / Tether', type: 'crypto', baseAsset: 'XRP', quoteAsset: 'USDT' },
  { symbol: 'ADAUSDT', name: 'Cardano / Tether', type: 'crypto', baseAsset: 'ADA', quoteAsset: 'USDT' },
  { symbol: 'AVAXUSDT', name: 'Avalanche / Tether', type: 'crypto', baseAsset: 'AVAX', quoteAsset: 'USDT' },
  { symbol: 'LINKUSDT', name: 'Chainlink / Tether', type: 'crypto', baseAsset: 'LINK', quoteAsset: 'USDT' },
  
  // High Yield / Low Cap / Meme-Tokens
  { symbol: 'GNUUSDT', name: 'GNU Network / Tether', type: 'crypto', baseAsset: 'GNU', quoteAsset: 'USDT' },
  { symbol: 'PEPEUSDT', name: 'Pepe / Tether', type: 'crypto', baseAsset: 'PEPE', quoteAsset: 'USDT' },
  { symbol: 'WIFUSDT', name: 'dogwifhat / Tether', type: 'crypto', baseAsset: 'WIF', quoteAsset: 'USDT' },
  { symbol: 'BONKUSDT', name: 'Bonk / Tether', type: 'crypto', baseAsset: 'BONK', quoteAsset: 'USDT' },
  { symbol: 'FLOKIUSDT', name: 'Floki / Tether', type: 'crypto', baseAsset: 'FLOKI', quoteAsset: 'USDT' },
  { symbol: 'BOMEUSDT', name: 'BOOK OF MEME / Tether', type: 'crypto', baseAsset: 'BOME', quoteAsset: 'USDT' },
  { symbol: 'BRETTUSDT', name: 'Brett / Tether', type: 'crypto', baseAsset: 'BRETT', quoteAsset: 'USDT' },
  { symbol: 'POPCATUSDT', name: 'Popcat / Tether', type: 'crypto', baseAsset: 'POPCAT', quoteAsset: 'USDT' },
  { symbol: 'TURBOUSDT', name: 'Turbo / Tether', type: 'crypto', baseAsset: 'TURBO', quoteAsset: 'USDT' },
  { symbol: 'DEGENUSDT', name: 'Degen / Tether', type: 'crypto', baseAsset: 'DEGEN', quoteAsset: 'USDT' },
  { symbol: 'MEWUSDT', name: 'cat in a dogs world', type: 'crypto', baseAsset: 'MEW', quoteAsset: 'USDT' },
  { symbol: 'ONDOUSDT', name: 'Ondo Finance / Tether', type: 'crypto', baseAsset: 'ONDO', quoteAsset: 'USDT' },
  { symbol: 'TAOUSDT', name: 'Bittensor / Tether', type: 'crypto', baseAsset: 'TAO', quoteAsset: 'USDT' },
  { symbol: 'RENDERUSDT', name: 'Render Network / Tether', type: 'crypto', baseAsset: 'RENDER', quoteAsset: 'USDT' },
  { symbol: 'FETUSDT', name: 'Artificial Super Alliance', type: 'crypto', baseAsset: 'FET', quoteAsset: 'USDT' },
  { symbol: 'WLDUSDT', name: 'Worldcoin / Tether', type: 'crypto', baseAsset: 'WLD', quoteAsset: 'USDT' },
  { symbol: 'SUIUSDT', name: 'Sui Network / Tether', type: 'crypto', baseAsset: 'SUI', quoteAsset: 'USDT' },
  { symbol: 'SEIUSDT', name: 'Sei / Tether', type: 'crypto', baseAsset: 'SEI', quoteAsset: 'USDT' },
  { symbol: 'FTMUSDT', name: 'Fantom / Tether', type: 'crypto', baseAsset: 'FTM', quoteAsset: 'USDT' },
  { symbol: 'JUPUSDT', name: 'Jupiter / Tether', type: 'crypto', baseAsset: 'JUP', quoteAsset: 'USDT' },
  { symbol: 'PYTHUSDT', name: 'Pyth Network / Tether', type: 'crypto', baseAsset: 'PYTH', quoteAsset: 'USDT' },
  { symbol: 'ENAUSDT', name: 'Ethena / Tether', type: 'crypto', baseAsset: 'ENA', quoteAsset: 'USDT' },
  { symbol: 'TIAUSDT', name: 'Celestia / Tether', type: 'crypto', baseAsset: 'TIA', quoteAsset: 'USDT' },
  
  // Crypto Futures (Perpetual Contracts)
  { symbol: 'BTCUSDT_PERP', name: 'Bitcoin Perpetual Futures', type: 'crypto_futures', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT_PERP', name: 'Ethereum Perpetual Futures', type: 'crypto_futures', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT_PERP', name: 'Solana Perpetual Futures', type: 'crypto_futures', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT_PERP', name: 'BNB Perpetual Futures', type: 'crypto_futures', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'DOGEUSDT_PERP', name: 'Dogecoin Perpetual Futures', type: 'crypto_futures', baseAsset: 'DOGE', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT_PERP', name: 'Ripple Perpetual Futures', type: 'crypto_futures', baseAsset: 'XRP', quoteAsset: 'USDT' },
  { symbol: 'ADAUSDT_PERP', name: 'Cardano Perpetual Futures', type: 'crypto_futures', baseAsset: 'ADA', quoteAsset: 'USDT' },
  { symbol: 'AVAXUSDT_PERP', name: 'Avalanche Perpetual Futures', type: 'crypto_futures', baseAsset: 'AVAX', quoteAsset: 'USDT' },
  { symbol: 'LINKUSDT_PERP', name: 'Chainlink Perpetual Futures', type: 'crypto_futures', baseAsset: 'LINK', quoteAsset: 'USDT' },
  
  // Exotic High-Leverage Futures
  { symbol: 'GNUUSDT_PERP', name: 'GNU Perpetual Futures', type: 'crypto_futures', baseAsset: 'GNU', quoteAsset: 'USDT' },
  { symbol: 'PEPEUSDT_PERP', name: 'Pepe Perpetual Futures', type: 'crypto_futures', baseAsset: 'PEPE', quoteAsset: 'USDT' },
  { symbol: 'WIFUSDT_PERP', name: 'dogwifhat Perpetual Futures', type: 'crypto_futures', baseAsset: 'WIF', quoteAsset: 'USDT' },
  { symbol: 'BONKUSDT_PERP', name: 'Bonk Perpetual Futures', type: 'crypto_futures', baseAsset: 'BONK', quoteAsset: 'USDT' },
  { symbol: 'FLOKIUSDT_PERP', name: 'Floki Perpetual Futures', type: 'crypto_futures', baseAsset: 'FLOKI', quoteAsset: 'USDT' },
  { symbol: 'BOMEUSDT_PERP', name: 'BOME Perpetual Futures', type: 'crypto_futures', baseAsset: 'BOME', quoteAsset: 'USDT' },
  { symbol: 'BRETTUSDT_PERP', name: 'Brett Perpetual Futures', type: 'crypto_futures', baseAsset: 'BRETT', quoteAsset: 'USDT' },
  { symbol: 'POPCATUSDT_PERP', name: 'Popcat Perpetual Futures', type: 'crypto_futures', baseAsset: 'POPCAT', quoteAsset: 'USDT' },
  { symbol: 'SUIUSDT_PERP', name: 'Sui Perpetual Futures', type: 'crypto_futures', baseAsset: 'SUI', quoteAsset: 'USDT' },
  { symbol: 'TAOUSDT_PERP', name: 'Bittensor Perpetual Futures', type: 'crypto_futures', baseAsset: 'TAO', quoteAsset: 'USDT' },
  { symbol: 'ONDOUSDT_PERP', name: 'Ondo Perpetual Futures', type: 'crypto_futures', baseAsset: 'ONDO', quoteAsset: 'USDT' },
  { symbol: 'RENDERUSDT_PERP', name: 'Render Perpetual Futures', type: 'crypto_futures', baseAsset: 'RENDER', quoteAsset: 'USDT' },
  { symbol: 'FETUSDT_PERP', name: 'Artificial Super Alliance Futures', type: 'crypto_futures', baseAsset: 'FET', quoteAsset: 'USDT' },
  { symbol: 'WLDUSDT_PERP', name: 'Worldcoin Perpetual Futures', type: 'crypto_futures', baseAsset: 'WLD', quoteAsset: 'USDT' },
  { symbol: 'FTMUSDT_PERP', name: 'Fantom Perpetual Futures', type: 'crypto_futures', baseAsset: 'FTM', quoteAsset: 'USDT' },
  { symbol: 'JUPUSDT_PERP', name: 'Jupiter Perpetual Futures', type: 'crypto_futures', baseAsset: 'JUP', quoteAsset: 'USDT' },

  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', baseAsset: 'EUR', quoteAsset: 'USD' },
  { symbol: 'GBPUSD', name: 'Great Britain Pound / US Dollar', type: 'forex', baseAsset: 'GBP', quoteAsset: 'USD' },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', baseAsset: 'AUD', quoteAsset: 'USD' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', baseAsset: 'USD', quoteAsset: 'JPY' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', baseAsset: 'USD', quoteAsset: 'CAD' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'forex', baseAsset: 'USD', quoteAsset: 'CHF' },

  // Saham Indonesia (IDX)
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', type: 'stock', baseAsset: 'BBCA', quoteAsset: 'IDR' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', type: 'stock', baseAsset: 'BBRI', quoteAsset: 'IDR' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', type: 'stock', baseAsset: 'TLKM', quoteAsset: 'IDR' },
  { symbol: 'ASII', name: 'Astra International Tbk', type: 'stock', baseAsset: 'ASII', quoteAsset: 'IDR' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', type: 'stock', baseAsset: 'GOTO', quoteAsset: 'IDR' },
  { symbol: 'BMRI', name: 'Bank Mandiri Tbk', type: 'stock', baseAsset: 'BMRI', quoteAsset: 'IDR' },
];
