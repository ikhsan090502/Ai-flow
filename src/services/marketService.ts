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
  XAUUSD: { price: 2424.70, change24h: -0.15 },
  XAGUSD: { price: 31.25, change24h: 0.45 },
  EURUSD: { price: 1.0852, change24h: 0.12 },
  GBPUSD: { price: 1.2718, change24h: -0.05 },
  AUDUSD: { price: 0.6652, change24h: 0.22 },
  USDJPY: { price: 155.62, change24h: 0.35 },
  USDCAD: { price: 1.3682, change24h: -0.10 },
  USDCHF: { price: 0.9085, change24h: -0.18 },
  
  // Standard Cryptos
  BTCUSDT: { price: 68450.00, change24h: 1.45 },
  ETHUSDT: { price: 3420.50, change24h: 2.15 },
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
  BTCUSDT_PERP: { price: 68485.00, change24h: 1.52 },
  ETHUSDT_PERP: { price: 3422.10, change24h: 2.22 },
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
 * Fetches real crypto rates from public Binance API, while maintaining Simulated rates 
 * for other assets, making it robust and highly responsive.
 */
export async function getLivePrices(): Promise<Record<string, LivePrice>> {
  try {
    // Attempt crypto fetch from Binance
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const sym = item.symbol;
          
          // Match standard crypto assets of symbol or symbol_PERP
          const matchedAssets = SUPPORTED_ASSETS.filter(a => a.symbol === sym || a.symbol === `${sym}_PERP`);
          
          matchedAssets.forEach(asset => {
            const symKey = asset.symbol;
            const rawPrice = parseFloat(item.lastPrice || item.price);
            const change = parseFloat(item.priceChangePercent);
            const high = parseFloat(item.highPrice);
            const low = parseFloat(item.lowPrice);
            
            if (!isNaN(rawPrice)) {
              // For perp, add a tiny mock perpetual funding premium/discount offset
              const perpetualOffset = asset.type === 'crypto_futures' ? 1.0003 : 1.0;
              const price = rawPrice * perpetualOffset;
              
              currentPrices[symKey] = {
                symbol: symKey,
                price: formatAssetPrice(price, asset.type),
                change24h: isNaN(change) ? 0 : change,
                high24h: formatAssetPrice(isNaN(high) ? price * 1.02 : high * perpetualOffset, asset.type),
                low24h: formatAssetPrice(isNaN(low) ? price * 0.98 : low * perpetualOffset, asset.type),
                lastUpdated: Date.now(),
              };
            }
          });
        });
      }
    }
  } catch (err) {
    console.warn('Binance API fetch failed, relying on dynamic seeded model', err);
  }

  // Double check forex/commodity/futures are up to date and simulate natural jitter
  SUPPORTED_ASSETS.forEach((asset) => {
    const current = currentPrices[asset.symbol];
    if ((asset.type !== 'crypto' && asset.type !== 'crypto_futures') || !current) {
      // Simulate minor ticking for standard exchange items or if crypto failed
      const changePercent = (Math.random() - 0.5) * 0.00016; // tiny natural change
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
      
      const nextPrice = priceObject.price * (1 + changePercent);
      currentPrices[asset.symbol] = {
        ...priceObject,
        price: formatAssetPrice(nextPrice, asset.type),
        lastUpdated: Date.now(),
      };
    }
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
