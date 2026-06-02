import { LivePrice } from '../types';
import { SUPPORTED_ASSETS } from '../assetsList';

export function formatAssetPrice(price: number, type: string): number {
  if (type === 'stock') return Number(Math.round(price));
  if (price <= 0) return 0;
  if (price < 0.0001) return Number(price.toFixed(8));
  if (price < 0.01) return Number(price.toFixed(6));
  if (price < 1.05) return Number(price.toFixed(4));
  if (type === 'forex') return Number(price.toFixed(5));
  return Number(price.toFixed(2));
}

const FIXED_SEEDS: Record<string, { price: number; change24h: number }> = {
  XAUUSD: { price: 4483.00, change24h: 1.17 },
  XAGUSD: { price: 77.56, change24h: 2.76 },
  EURUSD: { price: 1.1636, change24h: 0.30 },
  GBPUSD: { price: 1.3475, change24h: 0.41 },
  AUDUSD: { price: 0.7250, change24h: 0.22 },
  USDJPY: { price: 158.87, change24h: -0.19 },
  USDCAD: { price: 1.3282, change24h: -0.10 },
  USDCHF: { price: 0.8885, change24h: -0.18 },
  
  // Standard Cryptos
  BTCUSDT: { price: 76999.00, change24h: 0.03 },
  ETHUSDT: { price: 2093.50, change24h: -0.18 },
  SOLUSDT: { price: 182.40, change24h: 5.60 },
  BNBUSDT: { price: 615.30, change24h: -0.30 },
  DOGEUSDT: { price: 0.1850, change24h: 12.40 },
  XRPUSDT: { price: 0.5840, change24h: -1.20 },
  ADAUSDT: { price: 0.4820, change24h: 3.12 },
  AVAXUSDT: { price: 34.50, change24h: -1.45 },
  LINKUSDT: { price: 16.25, change24h: 4.60 },

  // Low-Caps & Meme Rockets (with potential to run thousands of percent!)
  GNUUSDT: { price: 0.0452, change24h: 1245.80 }, // Explosive launch token up +1245%!
  PEPEUSDT: { price: 0.00001542, change24h: 24.50 },
  WIFUSDT: { price: 3.1250, change24h: -8.40 },
  BONKUSDT: { price: 0.00002854, change24h: 15.10 },
  FLOKIUSDT: { price: 0.0002154, change24h: 42.15 },
  BOMEUSDT: { price: 0.01124, change24h: -2.35 },
  BRETTUSDT: { price: 0.1452, change24h: 18.90 },
  POPCATUSDT: { price: 1.8420, change24h: 25.12 },
  TURBOUSDT: { price: 0.00624, change24h: 412.50 }, // Massive low-cap meme gainer!
  DEGENUSDT: { price: 0.01852, change24h: -12.45 },
  MEWUSDT: { price: 0.00885, change24h: 8.20 },
  ONDOUSDT: { price: 0.9540, change24h: 2.15 },
  TAOUSDT: { price: 485.60, change24h: -3.80 },
  RENDERUSDT: { price: 7.82, change24h: 9.25 },
  FETUSDT: { price: 1.6850, change24h: 11.40 },
  WLDUSDT: { price: 2.1520, change24h: -5.60 },
  SUIUSDT: { price: 2.1540, change24h: 15.42 },
  SEIUSDT: { price: 0.5420, change24h: 6.20 },
  FTMUSDT: { price: 0.8520, change24h: -1.20 },
  JUPUSDT: { price: 1.0850, change24h: 4.56 },
  PYTHUSDT: { price: 0.4520, change24h: 1.25 },
  ENAUSDT: { price: 0.5240, change24h: -3.10 },
  TIAUSDT: { price: 5.4200, change24h: -4.85 },

  // Bitunix & MEXC explosive assets seeds (High potential / thousand percent runners!)
  PNUTUSDT: { price: 0.8425, change24h: 312.45 },
  NEIROUSDT: { price: 0.001842, change24h: 84.20 },
  GOATUSDT: { price: 0.6450, change24h: 125.10 },
  ACTUSDT: { price: 0.3852, change24h: 215.40 },
  BANUSDT: { price: 0.2245, change24h: -14.20 },
  SPXUSDT: { price: 0.5482, change24h: 35.12 },
  MOGUSDT: { price: 0.00000185, change24h: 42.10 },
  MOODENGUSDT: { price: 0.1852, change24h: -8.15 },
  LUCEUSDT: { price: 0.1245, change24h: 185.20 },
  GRASSUSDT: { price: 1.9540, change24h: 12.80 },
  GIGAUSDT: { price: 0.0485, change24h: -5.40 },
  FIDAUSDT: { price: 0.2450, change24h: 8.50 },
  SLERFUSDT: { price: 0.2842, change24h: -22.10 },
  FWOGUSDT: { price: 0.1542, change24h: 112.50 },
  MYROUSDT: { price: 0.1152, change24h: 4.50 },
  COQUSDT: { price: 0.00000215, change24h: -3.80 },
  BOBUSDT: { price: 0.00002542, change24h: 15.60 },
  BABYDOGEUSDT: { price: 0.00000284, change24h: 9.20 },

  // Standard Crypto Futures Fallbacks
  BTCUSDT_PERP: { price: 77090.00, change24h: 0.03 },
  ETHUSDT_PERP: { price: 2094.10, change24h: -0.18 },
  SOLUSDT_PERP: { price: 182.65, change24h: 5.75 },
  BNBUSDT_PERP: { price: 615.80, change24h: -0.25 },
  DOGEUSDT_PERP: { price: 0.1855, change24h: 12.55 },
  XRPUSDT_PERP: { price: 0.5845, change24h: -1.15 },
  ADAUSDT_PERP: { price: 0.4825, change24h: 3.19 },
  AVAXUSDT_PERP: { price: 34.54, change24h: -1.39 },
  LINKUSDT_PERP: { price: 16.27, change24h: 4.67 },

  // Indonesian Stocks (IDX)
  BBCA: { price: 9850, change24h: 0.51 },
  BBRI: { price: 4720, change24h: -1.25 },
  TLKM: { price: 3050, change24h: 1.15 },
  ASII: { price: 4950, change24h: -0.80 },
  GOTO: { price: 62, change24h: 3.33 },
  BMRI: { price: 6150, change24h: -0.40 },
};

// Local storage state for tracking runtime simulated prices
let currentPrices: Record<string, LivePrice> = {};

// Initialize prices
SUPPORTED_ASSETS.forEach((asset) => {
  let seed = FIXED_SEEDS[asset.symbol];
  if (!seed) {
    const spotSymbol = asset.symbol.replace('_PERP', '');
    const spotSeed = FIXED_SEEDS[spotSymbol];
    if (spotSeed) {
      seed = {
        price: spotSeed.price * 1.0003,
        change24h: spotSeed.change24h + (Math.random() - 0.5) * 0.1,
      };
    } else {
      seed = { price: 100, change24h: 0 };
    }
  }

  currentPrices[asset.symbol] = {
    symbol: asset.symbol,
    price: formatAssetPrice(seed.price, asset.type),
    change24h: seed.change24h,
    high24h: formatAssetPrice(seed.price * (1 + Math.abs(seed.change24h) / 100 + 0.05), asset.type),
    low24h: formatAssetPrice(seed.price * (1 - Math.abs(seed.change24h) / 100 - 0.05), asset.type),
    lastUpdated: Date.now(),
  };
});

/**
 * Fetches real crypto, forex, commodities, and Indonesian stocks (IDX) from the unified 
 * proxy API server-side, with full client-side simulated fallback as guard. On top of real rates, 
 * this makes the pricing robust, accurate, and completely CORS-free!
 */
export async function getLivePrices(): Promise<Record<string, LivePrice>> {
  try {
    const response = await fetch('/api/market/prices');
    if (response.ok) {
      const data = await response.json();
      Object.keys(data).forEach((key) => {
        const asset = SUPPORTED_ASSETS.find(a => a.symbol === key);
        if (asset) {
          const raw = data[key];
          
          currentPrices[key] = {
            symbol: key,
            price: formatAssetPrice(raw.price, asset.type),
            change24h: Number(raw.change24h.toFixed(2)),
            high24h: formatAssetPrice(raw.high24h, asset.type),
            low24h: formatAssetPrice(raw.low24h, asset.type),
            lastUpdated: raw.lastUpdated || Date.now()
          };
        }
      });
      return { ...currentPrices };
    }
  } catch (err) {
    console.warn('Server-side price proxy not available. Initiating direct keyless public API fallbacks...', err);
  }

  // Backup premium browser-direct API fetcher for static deployments (Github Pages etc.)
  try {
    // 1. Fetch Spot Gold / Silver from Yahoo Finance Chart API (extremely reliable and open)
    const goldPromise = fetch('https://query1.finance.chart.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
    const silverPromise = fetch('https://query1.finance.chart.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=1d')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    // 2. Fetch Forex from ExchangeRate-API (keyless, client-CORS friendly)
    const forexPromise = fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    // 3. Fetch Crypto immediately from Binance (wildcard browser CORS friendly!)
    const cryptoPromise = fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    const [goldData, silverData, forexData, cryptoData] = await Promise.all([
      goldPromise,
      silverPromise,
      forexPromise,
      cryptoPromise
    ]);

    // Apply Gold
    let goldVal: number | null = null;
    if (goldData) {
      const result = goldData?.chart?.result?.[0];
      const price = result?.meta?.regularMarketPrice;
      if (price) goldVal = price;
    }
    if (!goldVal && forexData && forexData.rates && forexData.rates.XAU) {
      goldVal = 1 / forexData.rates.XAU;
    }

    if (goldVal) {
      const xau = currentPrices['XAUUSD'];
      currentPrices['XAUUSD'] = {
        symbol: 'XAUUSD',
        price: formatAssetPrice(goldVal, 'commodity'),
        change24h: xau ? xau.change24h : -0.15,
        high24h: formatAssetPrice(goldVal * 1.015, 'commodity'),
        low24h: formatAssetPrice(goldVal * 0.985, 'commodity'),
        lastUpdated: Date.now()
      };
    }

    // Apply Silver
    let silverVal: number | null = null;
    if (silverData) {
      const result = silverData?.chart?.result?.[0];
      const price = result?.meta?.regularMarketPrice;
      if (price) silverVal = price;
    }
    if (!silverVal && forexData && forexData.rates && forexData.rates.XAG) {
      silverVal = 1 / forexData.rates.XAG;
    }

    if (silverVal) {
      const xag = currentPrices['XAGUSD'];
      currentPrices['XAGUSD'] = {
        symbol: 'XAGUSD',
        price: formatAssetPrice(silverVal, 'commodity'),
        change24h: xag ? xag.change24h : 0.45,
        high24h: formatAssetPrice(silverVal * 1.025, 'commodity'),
        low24h: formatAssetPrice(silverVal * 0.975, 'commodity'),
        lastUpdated: Date.now()
      };
    }

    // Apply Forex
    if (forexData && forexData.rates) {
      const rates = forexData.rates;
      const forexMapping: Record<string, number> = {
        EURUSD: rates.EUR ? 1 / rates.EUR : 1.1636,
        GBPUSD: rates.GBP ? 1 / rates.GBP : 1.3475,
        AUDUSD: rates.AUD ? 1 / rates.AUD : 0.7250,
        USDJPY: rates.JPY || 158.87,
        USDCAD: rates.CAD || 1.3282,
        USDCHF: rates.CHF || 0.8885,
      };

      Object.entries(forexMapping).forEach(([sym, rate]) => {
        const existing = currentPrices[sym];
        currentPrices[sym] = {
          symbol: sym,
          price: formatAssetPrice(rate, 'forex'),
          change24h: existing ? existing.change24h : 0.1,
          high24h: formatAssetPrice(rate * 1.008, 'forex'),
          low24h: formatAssetPrice(rate * 0.992, 'forex'),
          lastUpdated: Date.now()
        };
      });
    }

    // Apply Crypto Spot / Perpetuals
    if (Array.isArray(cryptoData)) {
      cryptoData.forEach((item: any) => {
        const sym = item.symbol;
        const matchedAssets = SUPPORTED_ASSETS.filter(a => a.symbol === sym || a.symbol === `${sym}_PERP`);
        matchedAssets.forEach(asset => {
          const rawPrice = parseFloat(item.lastPrice || item.price);
          const change = parseFloat(item.priceChangePercent);
          if (!isNaN(rawPrice)) {
            const perpetualOffset = asset.type === 'crypto_futures' ? 1.0003 : 1.0;
            const finalPrice = rawPrice * perpetualOffset;
            currentPrices[asset.symbol] = {
              symbol: asset.symbol,
              price: formatAssetPrice(finalPrice, asset.type),
              change24h: isNaN(change) ? 0.0 : change,
              high24h: formatAssetPrice(parseFloat(item.highPrice || (finalPrice * 1.05)), asset.type),
              low24h: formatAssetPrice(parseFloat(item.lowPrice || (finalPrice * 0.95)), asset.type),
              lastUpdated: Date.now()
            };
          }
        });

        // Map PAXGUSDT directly to XAUUSD (Gold spot) for high frequency real-time updates on client side as well
        if (sym === 'PAXGUSDT') {
          const rawPrice = parseFloat(item.lastPrice || item.price);
          const change = parseFloat(item.priceChangePercent);
          if (!isNaN(rawPrice)) {
            currentPrices['XAUUSD'] = {
              symbol: 'XAUUSD',
              price: formatAssetPrice(rawPrice, 'commodity'),
              change24h: isNaN(change) ? 0.0 : change,
              high24h: formatAssetPrice(rawPrice * 1.015, 'commodity'),
              low24h: formatAssetPrice(rawPrice * 0.985, 'commodity'),
              lastUpdated: Date.now()
            };
          }
        }
      });
    }
  } catch (directApiErr) {
    console.warn('Fallback direct API fetchers also failed, generating client-side simulations:', directApiErr);
  }

  // Final tier: simulated live price drift simulation as a standard robust fallback for any missing asset rates
  SUPPORTED_ASSETS.forEach((asset) => {
    const current = currentPrices[asset.symbol];
    const changePercent = (Math.random() - 0.5) * 0.00015;
    const defaultSeed = FIXED_SEEDS[asset.symbol] || (() => {
      const spotSymbol = asset.symbol.replace('_PERP', '');
      return FIXED_SEEDS[spotSymbol] || { price: 100, change24h: 0 };
    })();
    
    const priceObject = current || {
      symbol: asset.symbol,
      price: defaultSeed.price,
      change24h: defaultSeed.change24h,
      high24h: defaultSeed.price * 1.05,
      low24h: defaultSeed.price * 0.95,
      lastUpdated: Date.now(),
    };
    
    // Smooth the update with natural ticks
    const nextPrice = priceObject.price * (1 + changePercent);
    currentPrices[asset.symbol] = {
      ...priceObject,
      price: formatAssetPrice(nextPrice, asset.type),
      lastUpdated: Date.now(),
    };
  });

  return { ...currentPrices };
}

/**
 * Perform a small single-step tick updates for active simulation
 */
export function tickLivePrices(): Record<string, LivePrice> {
  SUPPORTED_ASSETS.forEach((asset) => {
    const p = currentPrices[asset.symbol];
    if (p) {
      // Jitter price slightly
      const tickDir = Math.random() > 0.49 ? 1 : -1;
      const isHighVolatility = asset.type === 'crypto' || asset.type === 'crypto_futures';
      const tickPercent = Math.random() * (isHighVolatility ? 0.0004 : 0.00008);
      const nextPrice = p.price * (1 + tickDir * tickPercent);
      
      currentPrices[asset.symbol] = {
        ...p,
        price: formatAssetPrice(nextPrice, asset.type),
        lastUpdated: Date.now(),
      };
    }
  });
  return { ...currentPrices };
}

/**
 * Apply a massive real-time news shock sentiment directly into specific bursa rates
 */
export function applySentimentImpact(symbol: string, percentImpact: number): Record<string, LivePrice> {
  const p = currentPrices[symbol];
  if (p) {
    const nextPrice = p.price * (1 + percentImpact / 100);
    const asset = SUPPORTED_ASSETS.find(a => a.symbol === symbol);
    const type = asset ? asset.type : 'crypto';
    currentPrices[symbol] = {
      ...p,
      price: formatAssetPrice(nextPrice, type),
      change24h: Number((p.change24h + percentImpact).toFixed(2)),
      high24h: Math.max(p.high24h, nextPrice),
      low24h: Math.min(p.low24h, nextPrice),
      lastUpdated: Date.now(),
    };
  }
  return { ...currentPrices };
}
