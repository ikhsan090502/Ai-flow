import { Asset } from './types';

export const SUPPORTED_ASSETS: Asset[] = [
  // Commodities / Metals
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', type: 'commodity', baseAsset: 'XAU', quoteAsset: 'USD', exchange: 'OANDA' },
  { symbol: 'XAGUSD', name: 'Silver / US Dollar', type: 'commodity', baseAsset: 'XAG', quoteAsset: 'USD', exchange: 'OANDA' },
  
  // --- BINANCE PRESETS (Spot & Futures Core Blue Chips) ---
  { symbol: 'BTCUSDT', name: 'Bitcoin (Binance Spot)', type: 'crypto', baseAsset: 'BTC', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'ETHUSDT', name: 'Ethereum (Binance Spot)', type: 'crypto', baseAsset: 'ETH', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'SOLUSDT', name: 'Solana (Binance Spot)', type: 'crypto', baseAsset: 'SOL', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'BNBUSDT', name: 'BNB / Tether', type: 'crypto', baseAsset: 'BNB', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin (Binance Spot)', type: 'crypto', baseAsset: 'DOGE', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'XRPUSDT', name: 'Ripple / Tether', type: 'crypto', baseAsset: 'XRP', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'ADAUSDT', name: 'Cardano / Tether', type: 'crypto', baseAsset: 'ADA', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'AVAXUSDT', name: 'Avalanche / Tether', type: 'crypto', baseAsset: 'AVAX', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'LINKUSDT', name: 'Chainlink / Tether', type: 'crypto', baseAsset: 'LINK', quoteAsset: 'USDT', exchange: 'Binance' },

  // --- BITUNIX SPOT & FUTURES ROCKETS (Low-Caps with potential to run thousands of percent, NO KYC required) ---
  { symbol: 'GNUUSDT', name: 'GNU Network (Bitunix Gem)', type: 'crypto', baseAsset: 'GNU', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'PNUTUSDT', name: 'Peanut the Squirrel (Bitunix Meme)', type: 'crypto', baseAsset: 'PNUT', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'NEIROUSDT', name: 'Neiro (Bitunix Explosive)', type: 'crypto', baseAsset: 'NEIRO', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'GOATUSDT', name: 'Goatseus Maximus (AI Meme)', type: 'crypto', baseAsset: 'GOAT', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'ACTUSDT', name: 'Act I : AI Prophecy', type: 'crypto', baseAsset: 'ACT', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'BANUSDT', name: 'Comedian Banana Meme', type: 'crypto', baseAsset: 'BAN', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'SPXUSDT', name: 'SPX6900 (Bitunix Bull run)', type: 'crypto', baseAsset: 'SPX', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'MOGUSDT', name: 'Mog Coin / Tether', type: 'crypto', baseAsset: 'MOG', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'MOODENGUSDT', name: 'Moo Deng Viral Hippo', type: 'crypto', baseAsset: 'MOODENG', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'LUCEUSDT', name: 'Luce Vatican Mascot', type: 'crypto', baseAsset: 'LUCE', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'GRASSUSDT', name: 'Grass AI Network', type: 'crypto', baseAsset: 'GRASS', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'GIGAUSDT', name: 'Gigachad Meme Token', type: 'crypto', baseAsset: 'GIGA', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'FIDAUSDT', name: 'Bonfida Name Service', type: 'crypto', baseAsset: 'FIDA', quoteAsset: 'USDT', exchange: 'Bitunix' },

  // --- MEXC GLOBAL HIGH-YIELD MOONSHOTS (The playground of multi-bagger 1000x altcoins) ---
  { symbol: 'PEPEUSDT', name: 'Pepe Frog (MEXC Moonshot)', type: 'crypto', baseAsset: 'PEPE', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'WIFUSDT', name: 'dogwifhat (MEXC Wildfire)', type: 'crypto', baseAsset: 'WIF', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BONKUSDT', name: 'Bonk Dog (MEXC Rocket)', type: 'crypto', baseAsset: 'BONK', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'FLOKIUSDT', name: 'Floki Viking (MEXC Spot)', type: 'crypto', baseAsset: 'FLOKI', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BOMEUSDT', name: 'BOOK OF MEME (MEXC)', type: 'crypto', baseAsset: 'BOME', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BRETTUSDT', name: 'Brett Base Boy (MEXC)', type: 'crypto', baseAsset: 'BRETT', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'POPCATUSDT', name: 'Popcat (MEXC Cat Coin)', type: 'crypto', baseAsset: 'POPCAT', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'TURBOUSDT', name: 'Turbo AI Meme (MEXC Gem)', type: 'crypto', baseAsset: 'TURBO', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'DEGENUSDT', name: 'Degen Base Network', type: 'crypto', baseAsset: 'DEGEN', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'MEWUSDT', name: 'cat in a dogs world', type: 'crypto', baseAsset: 'MEW', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'SLERFUSDT', name: 'Slerf Sloth Meme', type: 'crypto', baseAsset: 'SLERF', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'FWOGUSDT', name: 'Fwog Solana Meme', type: 'crypto', baseAsset: 'FWOG', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'MYROUSDT', name: 'Myro Dog Solana', type: 'crypto', baseAsset: 'MYRO', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'COQUSDT', name: 'Coq Inu Avalanche', type: 'crypto', baseAsset: 'COQ', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BOBUSDT', name: 'Bob AI Explainer', type: 'crypto', baseAsset: 'BOB', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BABYDOGEUSDT', name: 'Baby Dogecoin (MEXC)', type: 'crypto', baseAsset: 'BABYDOGE', quoteAsset: 'USDT', exchange: 'MEXC' },

  // --- BYBIT DERIVATIVES & NEW ALT GEMS ---
  { symbol: 'ONDOUSDT', name: 'Ondo Finance RWA (Bybit)', type: 'crypto', baseAsset: 'ONDO', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'TAOUSDT', name: 'Bittensor Decentralized AI', type: 'crypto', baseAsset: 'TAO', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'RENDERUSDT', name: 'Render Network GPU', type: 'crypto', baseAsset: 'RENDER', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'FETUSDT', name: 'Artificial Super Alliance AI', type: 'crypto', baseAsset: 'FET', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'WLDUSDT', name: 'Worldcoin Orb Auth', type: 'crypto', baseAsset: 'WLD', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'SUIUSDT', name: 'Sui Network Fast L1', type: 'crypto', baseAsset: 'SUI', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'SEIUSDT', name: 'Sei Network Layer 1', type: 'crypto', baseAsset: 'SEI', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'FTMUSDT', name: 'Fantom DAG (Bybit Spot)', type: 'crypto', baseAsset: 'FTM', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'JUPUSDT', name: 'Jupiter Solana DX (Bybit)', type: 'crypto', baseAsset: 'JUP', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'PYTHUSDT', name: 'Pyth Oracle Feed (Bybit)', type: 'crypto', baseAsset: 'PYTH', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'ENAUSDT', name: 'Ethena Synthetic Dollar', type: 'crypto', baseAsset: 'ENA', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'TIAUSDT', name: 'Celestia Modular DA', type: 'crypto', baseAsset: 'TIA', quoteAsset: 'USDT', exchange: 'Bybit' },

  // ==================== CRYPTO FUTURES (PERPETUAL CONTRACTS LISTED BY BROKER) ====================
  // Note: These perpetuals allow up to 125x leverage simulation on their target platform!
  
  // Binance Perpetuals (Major)
  { symbol: 'BTCUSDT_PERP', name: 'BTC Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'BTC', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'ETHUSDT_PERP', name: 'ETH Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'ETH', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'SOLUSDT_PERP', name: 'SOL Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'SOL', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'BNBUSDT_PERP', name: 'BNB Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'BNB', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'DOGEUSDT_PERP', name: 'DOGE Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'DOGE', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'XRPUSDT_PERP', name: 'XRP Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'XRP', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'ADAUSDT_PERP', name: 'ADA Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'ADA', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'AVAXUSDT_PERP', name: 'AVAX Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'AVAX', quoteAsset: 'USDT', exchange: 'Binance' },
  { symbol: 'LINKUSDT_PERP', name: 'LINK Perpetual Futures (Binance)', type: 'crypto_futures', baseAsset: 'LINK', quoteAsset: 'USDT', exchange: 'Binance' },

  // Bitunix Perpetuals (Epic High-Leverage Meme Gems & Micro-caps)
  { symbol: 'GNUUSDT_PERP', name: 'GNU Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'GNU', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'PNUTUSDT_PERP', name: 'PNUT Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'PNUT', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'NEIROUSDT_PERP', name: 'NEIRO Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'NEIRO', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'GOATUSDT_PERP', name: 'GOAT Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'GOAT', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'ACTUSDT_PERP', name: 'ACT Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'ACT', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'BANUSDT_PERP', name: 'BAN Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'BAN', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'SPXUSDT_PERP', name: 'SPX Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'SPX', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'MOGUSDT_PERP', name: 'MOG Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'MOG', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'MOODENGUSDT_PERP', name: 'MOODENG Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'MOODENG', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'LUCEUSDT_PERP', name: 'LUCE Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'LUCE', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'GRASSUSDT_PERP', name: 'GRASS Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'GRASS', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'GIGAUSDT_PERP', name: 'GIGA Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'GIGA', quoteAsset: 'USDT', exchange: 'Bitunix' },
  { symbol: 'FIDAUSDT_PERP', name: 'FIDA Perpetual Futures (Bitunix)', type: 'crypto_futures', baseAsset: 'FIDA', quoteAsset: 'USDT', exchange: 'Bitunix' },

  // MEXC Perpetuals (Low-cap Gems & Rockets)
  { symbol: 'PEPEUSDT_PERP', name: 'PEPE Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'PEPE', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'WIFUSDT_PERP', name: 'WIF Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'WIF', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BONKUSDT_PERP', name: 'BONK Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'BONK', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'FLOKIUSDT_PERP', name: 'FLOKI Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'FLOKI', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BOMEUSDT_PERP', name: 'BOME Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'BOME', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'BRETTUSDT_PERP', name: 'BRETT Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'BRETT', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'POPCATUSDT_PERP', name: 'POPCAT Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'POPCAT', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'TURBOUSDT_PERP', name: 'TURBO Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'TURBO', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'DEGENUSDT_PERP', name: 'DEGEN Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'DEGEN', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'MEWUSDT_PERP', name: 'MEW Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'MEW', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'SLERFUSDT_PERP', name: 'SLERF Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'SLERF', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'FWOGUSDT_PERP', name: 'FWOG Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'FWOG', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'MYROUSDT_PERP', name: 'MYRO Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'MYRO', quoteAsset: 'USDT', exchange: 'MEXC' },
  { symbol: 'COQUSDT_PERP', name: 'COQ Perpetual Futures (MEXC)', type: 'crypto_futures', baseAsset: 'COQ', quoteAsset: 'USDT', exchange: 'MEXC' },

  // Bybit Perpetuals (Advanced Tech & Mid-caps)
  { symbol: 'ONDOUSDT_PERP', name: 'ONDO Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'ONDO', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'TAOUSDT_PERP', name: 'TAO Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'TAO', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'RENDERUSDT_PERP', name: 'RENDER Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'RENDER', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'FETUSDT_PERP', name: 'FET Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'FET', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'WLDUSDT_PERP', name: 'WLD Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'WLD', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'SUIUSDT_PERP', name: 'SUI Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'SUI', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'SEIUSDT_PERP', name: 'SEI Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'SEI', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'FTMUSDT_PERP', name: 'FTM Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'FTM', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'JUPUSDT_PERP', name: 'JUP Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'JUP', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'PYTHUSDT_PERP', name: 'PYTH Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'PYTH', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'ENAUSDT_PERP', name: 'ENA Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'ENA', quoteAsset: 'USDT', exchange: 'Bybit' },
  { symbol: 'TIAUSDT_PERP', name: 'TIA Perpetual Futures (Bybit)', type: 'crypto_futures', baseAsset: 'TIA', quoteAsset: 'USDT', exchange: 'Bybit' },

  // --- FOREX ---
  { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', baseAsset: 'EUR', quoteAsset: 'USD', exchange: 'OANDA' },
  { symbol: 'GBPUSD', name: 'Great Britain Pound', type: 'forex', baseAsset: 'GBP', quoteAsset: 'USD', exchange: 'OANDA' },
  { symbol: 'AUDUSD', name: 'Australian Dollar', type: 'forex', baseAsset: 'AUD', quoteAsset: 'USD', exchange: 'OANDA' },
  { symbol: 'USDJPY', name: 'US Dollar / Yen', type: 'forex', baseAsset: 'USD', quoteAsset: 'JPY', exchange: 'OANDA' },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian $', type: 'forex', baseAsset: 'USD', quoteAsset: 'CAD', exchange: 'OANDA' },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'forex', baseAsset: 'USD', quoteAsset: 'CHF', exchange: 'OANDA' },

  // --- INDONESIAN STOCKS (IDX) ---
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', type: 'stock', baseAsset: 'BBCA', quoteAsset: 'IDR', exchange: 'IDX' },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', type: 'stock', baseAsset: 'BBRI', quoteAsset: 'IDR', exchange: 'IDX' },
  { symbol: 'TLKM', name: 'Telkom Indonesia Tbk', type: 'stock', baseAsset: 'TLKM', quoteAsset: 'IDR', exchange: 'IDX' },
  { symbol: 'ASII', name: 'Astra International Tbk', type: 'stock', baseAsset: 'ASII', quoteAsset: 'IDR', exchange: 'IDX' },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', type: 'stock', baseAsset: 'GOTO', quoteAsset: 'IDR', exchange: 'IDX' },
  { symbol: 'BMRI', name: 'Bank Mandiri Tbk', type: 'stock', baseAsset: 'BMRI', quoteAsset: 'IDR', exchange: 'IDX' },
];
