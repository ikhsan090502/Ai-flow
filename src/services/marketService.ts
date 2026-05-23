import { LivePrice } from '../types';
import { SUPPORTED_ASSETS } from '../assetsList';

const FIXED_SEEDS: Record<string, { price: number; change24h: number }> = {
  XAUUSD: { price: 4524.70, change24h: -0.15 },
  XAGUSD: { price: 31.25, change24h: 0.45 },
  EURUSD: { price: 1.0852, change24h: 0.12 },
  GBPUSD: { price: 1.2718, change24h: -0.05 },
  AUDUSD: { price: 0.6652, change24h: 0.22 },
  USDJPY: { price: 155.62, change24h: 0.35 },
  USDCAD: { price: 1.3682, change24h: -0.10 },
  USDCHF: { price: 0.9085, change24h: -0.18 },
  // Crypto Fallbacks
  BTCUSDT: { price: 92450.00, change24h: 1.45 },
  ETHUSDT: { price: 3120.50, change24h: 2.15 },
  SOLUSDT: { price: 182.40, change24h: 5.60 },
  BNBUSDT: { price: 615.30, change24h: -0.30 },
  DOGEUSDT: { price: 0.1850, change24h: 12.40 },
  XRPUSDT: { price: 1.2540, change24h: -1.20 },
};

// Local storage state for tracking runtime simulated prices
let currentPrices: Record<string, LivePrice> = {};

// Initialize prices
SUPPORTED_ASSETS.forEach((asset) => {
  const seed = FIXED_SEEDS[asset.symbol];
  currentPrices[asset.symbol] = {
    symbol: asset.symbol,
    price: seed.price,
    change24h: seed.change24h,
    high24h: seed.price * (1 + Math.abs(seed.change24h) / 100 + 0.01),
    low24h: seed.price * (1 - Math.abs(seed.change24h) / 100 - 0.01),
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
          if (currentPrices[sym] && SUPPORTED_ASSETS.find(a => a.symbol === sym && a.type === 'crypto')) {
            const price = parseFloat(item.lastPrice || item.price);
            const change = parseFloat(item.priceChangePercent);
            const high = parseFloat(item.highPrice);
            const low = parseFloat(item.lowPrice);
            if (!isNaN(price)) {
              currentPrices[sym] = {
                symbol: sym,
                price,
                change24h: isNaN(change) ? 0 : change,
                high24h: isNaN(high) ? price * 1.02 : high,
                low24h: isNaN(low) ? price * 0.98 : low,
                lastUpdated: Date.now(),
              };
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('Binance API fetch failed, relying on dynamic seeded model', err);
  }

  // Double check forex/commodity are up to date and simulate natural jitter
  SUPPORTED_ASSETS.forEach((asset) => {
    const current = currentPrices[asset.symbol];
    if (asset.type !== 'crypto' || !current) {
      // Simulate minor ticking for standard exchange items or if crypto failed
      const changePercent = (Math.random() - 0.5) * 0.00016; // tiny natural change
      const priceObject = current || {
        symbol: asset.symbol,
        price: FIXED_SEEDS[asset.symbol].price,
        change24h: FIXED_SEEDS[asset.symbol].change24h,
        high24h: FIXED_SEEDS[asset.symbol].price * 1.01,
        low24h: FIXED_SEEDS[asset.symbol].price * 0.99,
        lastUpdated: Date.now(),
      };
      
      const nextPrice = priceObject.price * (1 + changePercent);
      currentPrices[asset.symbol] = {
        ...priceObject,
        price: Number(nextPrice.toFixed(asset.type === 'forex' ? 5 : 2)),
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
      const tickPercent = Math.random() * (asset.type === 'crypto' ? 0.0004 : 0.00008);
      const nextPrice = p.price * (1 + tickDir * tickPercent);
      
      currentPrices[asset.symbol] = {
        ...p,
        price: Number(nextPrice.toFixed(asset.type === 'forex' ? 5 : 2)),
        lastUpdated: Date.now(),
      };
    }
  });
  return { ...currentPrices };
}
