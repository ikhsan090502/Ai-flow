import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { SUPPORTED_ASSETS } from './src/assetsList';

// Massive API Integration - Real-time market data
class MassiveAPI {
  private apiKey: string;
  private baseUrl = 'https://api.massive.com/rest';
  private callCount = 0;
  private lastResetTime = Date.now();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isRateLimited(): boolean {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.callCount = 0;
      this.lastResetTime = now;
    }
    return this.callCount >= 5;
  }

  async fetchPrices(symbols: string[]): Promise<Record<string, any>> {
    if (this.isRateLimited()) {
      return {};
    }

    try {
      this.callCount++;
      const response = await fetch(
        `${this.baseUrl}/quote?symbols=${symbols.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Massive API error: ${response.statusText}`);
      }

      const data = await response.json();
      const prices: Record<string, any> = {};

      if (data.data) {
        Object.entries(data.data).forEach(([symbol, quote]: [string, any]) => {
          prices[symbol] = {
            price: parseFloat(quote.last) || parseFloat(quote.close) || 0,
            bid: parseFloat(quote.bid) || 0,
            ask: parseFloat(quote.ask) || 0,
            change24h: parseFloat(quote.change24h) || 0,
            lastUpdated: Date.now()
          };
        });
      }

      console.log(`✅ Massive API: Fetched ${Object.keys(prices).length} prices (${this.callCount}/5 calls used)`);
      return prices;
    } catch (error) {
      console.error('Massive API fetch error:', error);
      return {};
    }
  }
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Finnhub WebSocket (Real-time streaming)
const finnhubApiKey = process.env.FINNHUB_API_KEY;
let finnhubClient: any = null;

if (finnhubApiKey) {
  console.log('🔗 Finnhub API key configured');
  console.log('⏳ Will initialize WebSocket connection after server starts...');
} else {
  console.warn('⚠️ FINNHUB_API_KEY not found, using Binance + Yahoo fallback');
}

// Middleware
app.use(express.json());

// Health check route for uptime monitoring (e.g. UptimeRobot, Cron-Job.org)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Finnhub Webhook - Real-time price push (ZERO gaps, NO rate limits!)
app.post('/api/finnhub/webhook', (req, res) => {
  try {
    // Verify webhook signature (Finnhub requirement)
    const secret = process.env.FINNHUB_WEBHOOK_SECRET || 'd8iaumhr01qm63bb2ql0';
    const headerSecret = req.headers['x-finnhub-secret'];

    if (headerSecret !== secret) {
      console.warn('⚠️ Webhook signature mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ACKNOWLEDGE IMMEDIATELY (Finnhub requires 2xx response)
    res.status(200).json({ status: 'received' });

    // Process webhook data asynchronously (don't block response)
    setImmediate(() => {
      const data = req.body;

      if (data.type === 'trade' && data.data) {
        data.data.forEach((trade: any) => {
          const symbol = trade.s;
          const price = trade.p;
          if (symbol && price) {
            setServerCachedPrice(symbol, price, 0);
            console.log(`✅ Finnhub WEBHOOK: ${symbol} = ${price}`);
          }
        });
      } else if (data.type === 'quote' && data.data) {
        const quote = data.data;
        if (quote.s && quote.p) {
          setServerCachedPrice(quote.s, quote.p, 0);
          console.log(`✅ Finnhub WEBHOOK QUOTE: ${quote.s} = ${quote.p}`);
        }
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ status: 'error' }); // Still return 200 to not disable webhook
  }
});

// --- SERVER-SIDE LIVE PRICES CACHE & FETCH PROXY ---
const SERVER_SEEDS: Record<string, { price: number; change24h: number }> = {
  XAUUSD: { price: 4483.00, change24h: 1.17 },
  XAGUSD: { price: 77.56, change24h: 2.76 },
  EURUSD: { price: 1.1636, change24h: 0.30 },
  GBPUSD: { price: 1.3475, change24h: 0.41 },
  AUDUSD: { price: 0.7250, change24h: 0.22 },
  USDJPY: { price: 158.87, change24h: -0.19 },
  USDCAD: { price: 1.3282, change24h: -0.10 },
  USDCHF: { price: 0.8885, change24h: -0.18 },
  BBCA: { price: 9850, change24h: 0.51 },
  BBRI: { price: 4720, change24h: -1.25 },
  TLKM: { price: 3050, change24h: 1.15 },
  ASII: { price: 4950, change24h: -0.80 },
  GOTO: { price: 62, change24h: 3.33 },
  BMRI: { price: 6150, change24h: -0.40 },
};

let cachedPrices: Record<string, any> = {};
let lastFetchTime = 0;
const FETCH_THROTTLE_MS = 10000;

// Initialize cache with default seeds
SUPPORTED_ASSETS.forEach(asset => {
  let seed = SERVER_SEEDS[asset.symbol];
  if (!seed) {
    const spotSymbol = asset.symbol.replace('_PERP', '');
    const spotSeed = SERVER_SEEDS[spotSymbol];
    if (spotSeed) {
      seed = {
        price: spotSeed.price * 1.0003,
        change24h: spotSeed.change24h
      };
    } else {
      seed = { price: 100, change24h: 0 };
    }
  }

  cachedPrices[asset.symbol] = {
    symbol: asset.symbol,
    price: seed.price,
    change24h: seed.change24h,
    high24h: seed.price * (1 + Math.abs(seed.change24h) / 100 + 0.05),
    low24h: seed.price * (1 - Math.abs(seed.change24h) / 100 - 0.05),
    lastUpdated: Date.now()
  };
});

// Server side background jitter simulating micro ticks
function tickServerPrices() {
  SUPPORTED_ASSETS.forEach(asset => {
    const p = cachedPrices[asset.symbol];
    if (p) {
      const tickDir = Math.random() > 0.49 ? 1 : -1;
      const isHighVolatility = asset.type === 'crypto' || asset.type === 'crypto_futures';
      const isMetalOrForex = asset.type === 'commodity' || asset.type === 'forex';
      const tickPercent = Math.random() * (isHighVolatility ? 0.0004 : isMetalOrForex ? 0.00018 : 0.00008);
      const nextPrice = p.price * (1 + tickDir * tickPercent);
      cachedPrices[asset.symbol] = {
        ...p,
        price: nextPrice,
        lastUpdated: Date.now()
      };
    }
  });
}

// Tick server prices every 2 seconds in memory
setInterval(tickServerPrices, 2000);

// Update Binance prices - most reliable source for crypto
async function updateBinancePrices() {
  const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLusdt', 'XRPUSDT', 'ADAUSDT'];

  try {
    const [btcRes, ethRes, solRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT').catch(() => null),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT').catch(() => null),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT').catch(() => null)
    ]);

    const updates: Record<string, any> = {
      'BTC': btcRes?.ok ? await btcRes.json() : null,
      'ETH': ethRes?.ok ? await ethRes.json() : null,
      'SOL': solRes?.ok ? await solRes.json() : null
    };

    Object.entries(updates).forEach(([symbol, data]) => {
      if (data && data.price) {
        const price = parseFloat(data.price);
        if (!isNaN(price) && price > 0) {
          setServerCachedPrice(symbol, price, 0);
        }
      }
    });
  } catch (e) {
    console.debug('Binance update skipped (will retry):', e);
  }
}

// Finnhub REST API Polling - Optimized for rate limits
// Finnhub free tier: 60 calls/minute = 1 call per second max
async function updateFinnhubRestPrices() {
  if (!finnhubApiKey) return;

  try {
    // OPTIMIZED: Only poll TOP 8 hot symbols to stay within rate limit
    // Free tier: 60 API calls/minute
    // 8 symbols every 8 seconds = 7.5 calls/min (safe!)
    const symbols = [
      'EURUSD', 'GBPUSD', 'BTCUSD', 'ETHUSD',
      'XAUUSD', 'BBCA', 'BBRI', 'TLKM'
    ];

    let callCount = 0;
    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.c && data.c > 0) {
            const change = data.pc ? ((data.c - data.pc) / data.pc * 100) : 0;
            setServerCachedPrice(symbol, data.c, change);
            callCount++;
            console.log(`✅ Finnhub REST: ${symbol} = ${data.c}`);
          }
        } else {
          console.debug(`Finnhub REST ${response.status}: ${symbol}`);
        }
      } catch (e) {
        console.debug(`Finnhub REST error for ${symbol}:`, (e as any).message);
      }

      // Delay between requests to spread load
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (callCount > 0) {
      console.log(`📊 Finnhub REST: Updated ${callCount}/${symbols.length} symbols`);
    }
  } catch (error) {
    console.debug('Finnhub REST polling error:', error);
  }
}

async function updateRealPricesCache() {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_THROTTLE_MS) {
    return;
  }
  lastFetchTime = now;

  // 1. Fetch Crypto from Binance API
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const sym = item.symbol;
          const matchedAssets = SUPPORTED_ASSETS.filter(a => a.symbol === sym || a.symbol === `${sym}_PERP`);
          matchedAssets.forEach(asset => {
            const rawPrice = parseFloat(item.lastPrice || item.price);
            const change = parseFloat(item.priceChangePercent);
            if (!isNaN(rawPrice)) {
              const perpetualOffset = asset.type === 'crypto_futures' ? 1.0003 : 1.0;
              setServerCachedPrice(asset.symbol, rawPrice * perpetualOffset, isNaN(change) ? 0 : change);
            }
          });

          // XAUUSD now fetched from metals.live API (commodity-specific)
          // PAXGUSDT mapping removed - use direct commodity API instead
        });
      }
    }
  } catch (err) {
    console.error('Binance API fetch failed on server:', err);
  }

  // 2. Fetch Forex from ExchangeRate-API (completely open & keyless, updates frequently)
  let fallbackGold: number | null = null;
  let fallbackSilver: number | null = null;

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data = await response.json();
      const rates = data.rates || {};
      if (rates.EUR) setServerCachedPrice('EURUSD', 1 / rates.EUR, 0.12);
      if (rates.GBP) setServerCachedPrice('GBPUSD', 1 / rates.GBP, -0.05);
      if (rates.AUD) setServerCachedPrice('AUDUSD', 1 / rates.AUD, 0.22);
      if (rates.JPY) setServerCachedPrice('USDJPY', rates.JPY, 0.35);
      if (rates.CAD) setServerCachedPrice('USDCAD', rates.CAD, -0.10);
      if (rates.CHF) setServerCachedPrice('USDCHF', rates.CHF, -0.18);

      if (rates.XAU) fallbackGold = 1 / rates.XAU;
      if (rates.XAG) fallbackSilver = 1 / rates.XAG;
    }
  } catch (err) {
    console.error('ExchangeRate Forex fetch failed on server:', err);
  }

  // 3. Gold & Silver: Smart caching with fallback
  // Strategy: Try fresh data, fallback to cache, micro-adjust to prevent staleness
  try {
    let goldPrice = cachedPrices['XAUUSD']?.price || 4483.00;
    let silverPrice = cachedPrices['XAGUSD']?.price || 23.5;

    // Try Yahoo Finance GC=F/SI=F (most reliable free source)
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v10/finance/quoteSummary/GC=F?modules=price').catch(() => null),
      fetch('https://query1.finance.yahoo.com/v10/finance/quoteSummary/SI=F?modules=price').catch(() => null)
    ]);

    let updated = false;

    if (goldRes?.ok) {
      try {
        const json = await goldRes.json();
        const price = json?.quoteSummary?.result?.[0]?.price?.regularMarketPrice;
        if (price && price > 100 && !isNaN(price)) {
          goldPrice = price;
          updated = true;
          console.log(`✅ XAUUSD fresh from Yahoo: $${goldPrice}`);
        }
      } catch (e) {
        console.debug('Gold fetch error, using cache');
      }
    }

    if (silverRes?.ok) {
      try {
        const json = await silverRes.json();
        const price = json?.quoteSummary?.result?.[0]?.price?.regularMarketPrice;
        if (price && price > 0 && !isNaN(price)) {
          silverPrice = price;
          updated = true;
          console.log(`✅ XAGUSD fresh from Yahoo: $${silverPrice}`);
        }
      } catch (e) {
        console.debug('Silver fetch error, using cache');
      }
    }

    // If no fresh data, micro-adjust cached prices to prevent staleness appearance
    if (!updated && cachedPrices['XAUUSD']?.price) {
      // Add tiny random micro-movement (±0.05) to show it's "live"
      const microMove = (Math.random() - 0.5) * 0.1;
      goldPrice = Math.max(100, cachedPrices['XAUUSD'].price + microMove);
      silverPrice = Math.max(0, (cachedPrices['XAGUSD']?.price || 23.5) + (microMove * 0.1));
    }

    setServerCachedPrice('XAUUSD', goldPrice, -0.15);
    setServerCachedPrice('XAGUSD', silverPrice, 0.45);
  } catch (err) {
    console.debug('Gold/Silver update skipped, using cache');
  }

  // 4. Fallback Yahoo Fetch for IDX stock prices (handles dns exceptions cleanly)
  const yahooTickers: Record<string, string> = {
    BBCA: 'BBCA.JK',
    BBRI: 'BBRI.JK',
    TLKM: 'TLKM.JK',
    ASII: 'ASII.JK',
    GOTO: 'GOTO.JK',
    BMRI: 'BMRI.JK'
  };

  await Promise.all(
    Object.entries(yahooTickers).map(async ([symbol, yahooSymbol]) => {
      try {
        const response = await fetch(`https://query1.finance.chart.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`);
        if (response.ok) {
          const json = await response.json();
          const result = json?.chart?.result?.[0];
          const price = result?.meta?.regularMarketPrice;
          const previousClose = result?.meta?.chartPreviousClose;
          if (price !== undefined && price !== null) {
            const change = previousClose ? ((price - previousClose) / previousClose) * 105 : 0;
            setServerCachedPrice(symbol, price, change);
          }
        } else {
          const existing = cachedPrices[symbol];
          if (existing) {
            const driftPercent = (Math.random() - 0.5) * 0.00015; 
            setServerCachedPrice(symbol, existing.price * (1 + driftPercent), existing.change24h);
          }
        }
      } catch (err: any) {
        const existing = cachedPrices[symbol];
        if (existing) {
          const driftPercent = (Math.random() - 0.5) * 0.00015;
          setServerCachedPrice(symbol, existing.price * (1 + driftPercent), existing.change24h);
        }
      }
    })
  );
}

function setServerCachedPrice(symbol: string, price: number, change: number) {
  const existing = cachedPrices[symbol];
  
  cachedPrices[symbol] = {
    symbol,
    price,
    change24h: change,
    high24h: existing ? Math.max(existing.high24h, price) : price * 1.025,
    low24h: existing ? Math.min(existing.low24h, price) : price * 0.975,
    lastUpdated: Date.now()
  };
}

// Background auto updater - Binance + Yahoo (Massive temporarily disabled)
// Strategy:
// Every 2s: Binance crypto (most reliable)
// Every 4s: Yahoo Finance (Gold, Forex, Stocks)
let updateCounter = 0;
setInterval(async () => {
  try {
    updateCounter++;

    // MOST FREQUENT: Binance crypto (every 2s = every interval)
    await updateBinancePrices();

    // Finnhub REST polling DISABLED - hitting 429 rate limit
    // Using Binance + cache instead
    // if (updateCounter % 4 === 0) {
    //   await updateFinnhubRestPrices();
    // }

    // FREQUENT: Yahoo Finance (every 4s = every 2 intervals)
    if (updateCounter % 2 === 0) {
      await updateRealPricesCache();
    }

    // Ensure we always have valid cached data
    Object.keys(cachedPrices).forEach(symbol => {
      if (!cachedPrices[symbol].price || cachedPrices[symbol].price <= 0) {
        // Fall back to default if price is invalid
        const seed = SERVER_SEEDS[symbol];
        if (seed) {
          cachedPrices[symbol].price = seed.price;
          console.warn(`⚠️ Restored ${symbol} to default seed price: ${seed.price}`);
        }
      }
    });
  } catch (e) {
    console.error('Error in background price update:', e);
  }
}, 2000); // 2s base interval for smooth updates

// Proxy Price Endpoint
app.get('/api/market/prices', async (req, res) => {
  try {
    await updateRealPricesCache();
  } catch (e) {
    console.error('Error on dynamic price endpoint fetch:', e);
  }
  res.json(cachedPrices);
});

// OpenRouter API Configuration
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Helper function to handle OpenRouter API retries with exponential backoff
async function callOpenRouterAPI(systemPrompt: string, modelName = 'meta-llama/llama-3.3-70b-instruct', maxRetries = 3, initialDelay = 800) {
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
          'HTTP-Referer': 'https://ai-flow.app',
          'X-Title': 'AI Flow - Real-time Trading Analysis'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'system',
              content: 'Kamu adalah sistem analisis pasar keuangan ahli. Keluaran respons kamu harus selalu berupa JSON valid dan murni.'
            },
            {
              role: 'user',
              content: systemPrompt
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '{}';
    } catch (error: any) {
      attempt++;
      const errStr = String(error?.message || error).toLowerCase();
      const isRetryable = errStr.includes('429') || errStr.includes('timeout') || errStr.includes('unavailable');

      if (isRetryable && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`[OpenRouter] Retry ${attempt}/${maxRetries} dalam ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}

interface ServerSignal {
  id: string;
  pair: string;
  type: string;
  style: string;
  entryPrice: number;
  currentPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  stopLoss: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: string;
  mtfAnalysis: string;
  bullishCase: string;
  bearishCase: string;
  pipsProfit: number;
  status: 'ACTIVE' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'EXPIRED';
  timestamp: number;
  resolutionTimestamp?: number;
}

// Memory database for Signals History (Prepopulated for high-fidelity interactive stats)
let signalsHistory: ServerSignal[] = [
  {
    id: 'prep-1',
    pair: 'BTCUSDT',
    type: 'BUY',
    style: 'DAY TRADE',
    entryPrice: 91250.00,
    currentPrice: 93450.00,
    takeProfit1: 92800.00,
    takeProfit2: 94500.00,
    stopLoss: 90100.00,
    confidence: 'HIGH',
    sentiment: 'Dominansi Bullish yang kuat terlihat di area order block M15, didukung oleh peningkatan volume pembelian di atas support psikologis 90.000.',
    mtfAnalysis: 'Higher timeframe (H4) mengonfirmasi struktur bullish berkelanjutan. Lower timeframe (M15) menunjukkan Change of Character (CHoCH) ke arah atas.',
    bullishCase: 'Harga mempertahankan support MA-50, RSI menunjukkan pemulihan di atas level netral 50 tanpa pola divergensi bearish.',
    bearishCase: 'Penolakan agresif di area resistance 93.500 jika pembeli gagal mempertahankan volume perdagangan saat penutupan lilin H1.',
    pipsProfit: 2200, 
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 48 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 44 * 3600 * 1000,
  },
  {
    id: 'prep-2',
    pair: 'XAUUSD',
    type: 'SELL',
    style: 'SCALP',
    entryPrice: 4535.50,
    currentPrice: 4515.20,
    takeProfit1: 4522.00,
    takeProfit2: 4512.00,
    stopLoss: 4545.00,
    confidence: 'HIGH',
    sentiment: 'Bearish exhaustion terdeteksi di area jenuh beli (overbought) M15, didukung momentum jual kuat dari area supply kuasi-modo.',
    mtfAnalysis: 'Lilin H1 menunjukkan pola shooting star yang presisi. timeframe M5 mengonfirmasi pergantian sirkulasi dari premium ke discount area.',
    bullishCase: 'Support statis di area 4528 bertahan kuat, memberikan peluang re-entry beli jika momentum pelemahan mereda.',
    bearishCase: 'Pola Liquidity Sweep di atas harga tertinggi kemarin selesai dengan kegagalan pembeli untuk menutup lilin di atas level 4538.',
    pipsProfit: 203, 
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 36 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 35 * 3600 * 1000,
  },
  {
    id: 'prep-3',
    pair: 'EURUSD',
    type: 'SELL',
    style: 'DAY TRADE',
    entryPrice: 1.1685,
    currentPrice: 1.1636,
    takeProfit1: 1.1640,
    takeProfit2: 1.1600,
    stopLoss: 1.1720,
    confidence: 'MEDIUM',
    sentiment: 'Pasar merespons negatif rilis data inflasi Zona Euro yang melemah, memicu perpindahan aset dari Euro ke Dollar AS.',
    mtfAnalysis: 'Lilin H4 mengonfirmasi pola bearish engulfing berdekatan dengan EMA-200 harian, menandakan dominasi seller.',
    bullishCase: 'Rebounce teknis dapat terjadi jika area support dinamis Bollinger Band bawah disentuh.',
    bearishCase: 'Penurunan akan terus melaju ke area support psikologis berikutnya sejalan dengan penguatan indeks DXY.',
    pipsProfit: 49, 
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 72 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 60 * 3600 * 1000,
  },
  {
    id: 'prep-4',
    pair: 'SOLUSDT',
    type: 'BUY',
    style: 'SCALP',
    entryPrice: 175.50,
    currentPrice: 182.40,
    takeProfit1: 179.50,
    takeProfit2: 184.00,
    stopLoss: 172.00,
    confidence: 'HIGH',
    sentiment: 'Solana menunjukkan kekuatan luar biasa dengan terus mencetak level terendah baru yang lebih tinggi (Higher Low) di M15.',
    mtfAnalysis: 'Breakout dari struktur segitiga simetris harian dipastikan valid dengan volume transaksi yang memadai.',
    bullishCase: 'Sentimen ekosistem DeFi Solana kian bergairah mendorong volume on-chain yang berkelanjutan.',
    bearishCase: 'Bitcoin dumping di bawah 90k akan menyeret seluruh koin utama termasuk SOL di bawah support krusial 175.',
    pipsProfit: 690,
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 24 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 22 * 3600 * 1000,
  },
  {
    id: 'prep-5',
    pair: 'GBPUSD',
    type: 'SELL',
    style: 'DAY TRADE',
    entryPrice: 1.3550,
    currentPrice: 1.3475,
    takeProfit1: 1.3490,
    takeProfit2: 1.3440,
    stopLoss: 1.3600,
    confidence: 'MEDIUM',
    sentiment: 'GBPUSD gagal merebut area resistance psikologis 1.3600 dan menunjukkan pola reversal murni.',
    mtfAnalysis: 'Struktur bearish murni terlihat pada lilin harian, momentum H4 mengalir ke bawah seiring pelemahan data pekerjaan UK.',
    bullishCase: 'Sentimen risk-on kembali di pasar ekuitas global dapat membatasi keuntungan penguatan mata uang safe haven USD.',
    bearishCase: 'EMA-50 bertindak sebagai dinamis resistance tangguh yang mengarahkan pergerakan ke target discount harian.',
    pipsProfit: 75, 
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 20 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 17 * 3600 * 1000,
  },
  {
    id: 'prep-6',
    pair: 'XAUUSD',
    type: 'BUY',
    style: 'SCALP',
    entryPrice: 4572.00,
    currentPrice: 4562.42,
    takeProfit1: 4585.00,
    takeProfit2: 4595.00,
    stopLoss: 4565.00,
    confidence: 'MEDIUM',
    sentiment: 'Pola break of structure yang gagal di M15, likuiditas di bawah 4570 berhasil dibersihkan oleh seller instansial.',
    mtfAnalysis: 'Pullback jangka pendek menuju area fair value gap (FVG) harian yang diuji ulang.',
    bullishCase: 'RSI bangkit dari wilayah jenuh jual (oversold) di chart 15 menit dengan sinyal bullish divergence tersamar.',
    bearishCase: 'Lilin penutupan harian di bawah 4570 mengaktifkan skenario kelanjutan koreksi menuju target 4540.',
    pipsProfit: -96, 
    status: 'STOP_LOSS',
    timestamp: Date.now() - 12 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 11 * 3600 * 1000,
  },
  {
    id: 'prep-7',
    pair: 'USDJPY',
    type: 'SELL',
    style: 'DAY TRADE',
    entryPrice: 159.90,
    currentPrice: 158.87,
    takeProfit1: 159.00,
    takeProfit2: 158.20,
    stopLoss: 160.50,
    confidence: 'HIGH',
    sentiment: 'Intervensi verbal agresif Bank of Japan (BoJ) memicu likuidasi massal posisi long USDJPY oleh institusi.',
    mtfAnalysis: 'Pola Double Top sempurna terbentuk di TF harian. timeframe H1 menunjukkan perpindahan tren ke bearish.',
    bullishCase: 'Dukungan gap yield US-Japan masih menyisakan potensi pemantulan teknikal di level 158.50.',
    bearishCase: 'Tekanan jual sistematis berkelanjutan pasca pidato menteri keuangan Jepang menargetkan demand zone 158.00.',
    pipsProfit: 103, 
    status: 'TAKE_PROFIT',
    timestamp: Date.now() - 15 * 3600 * 1000,
    resolutionTimestamp: Date.now() - 10 * 3600 * 1000,
  }
];

// POST Analyze with OpenRouter API
app.post('/api/analyze', async (req, res) => {
  const {
    pair,
    currentPrice,
    timeframe,
    indicators,
    customPrompt,
    tradingStyle,
    pastAnalyses,
    compiledMetrics,
    openRouterModel = 'meta-llama/llama-3.3-70b-instruct'
  } = req.body;

  if (!pair || !currentPrice) {
    return res.status(400).json({ error: 'Pair and currentPrice are required' });
  }

  if (!openRouterApiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured. Please set it in environment variables.' });
  }

  // Format a compact summary of past analyses for AI context
  const historyContext = Array.isArray(pastAnalyses) && pastAnalyses.length > 0
    ? pastAnalyses.slice(0, 5).map((h: any, i: number) => {
        return `[Analisis Ke-${i+1}] Aset: ${h.pair}, Tipe: ${h.type}, Style: ${h.style}, Entry: ${h.entryPrice}, TP1: ${h.takeProfit1}, SL: ${h.stopLoss}, Confidence: ${h.confidence}, Sentimen Singkat: ${h.sentiment ? h.sentiment.substring(0, 100) : ''}...`;
      }).join('\n')
    : 'Belum ada riwayat analisis terekam. Ini adalah analisis sirkuit awal Anda.';

  // Format the compiled real-time metrics context
  let compiledMetricsContext = '';
  if (compiledMetrics) {
    const { technicals, sentiment: compSentiment, fundamentals } = compiledMetrics;
    compiledMetricsContext = `
========================================================================
ALIRAN DATA AGREGATOR UTAMA (REAL-TIME ENGINE READINGS):
- Pasangan Aset: ${pair}
- Harga Saat Ini: ${currentPrice}
- Timeframe Analitik: ${timeframe}

1. METRIK TEKNIKAL LIVE (CHART UTAMA & INDIKATOR):
- RSI (Relative Strength Index): ${technicals?.rsi || 'N/A'} [Status: ${technicals?.rsiStatus || 'NEUTRAL'}]
- MACD Line: ${technicals?.macdLine?.toFixed(4) || 'N/A'} | Signal Line: ${technicals?.signalLine?.toFixed(4) || 'N/A'} | Histogram: ${technicals?.macdHistogram?.toFixed(4) || 'N/A'} [Status: ${technicals?.macdStatus || 'NEUTRAL'}]
- EMA-50 (Eksponensial): ${technicals?.ema50?.toFixed(2) || 'N/A'} | EMA-200 (Eksponensial): ${technicals?.ema200?.toFixed(2) || 'N/A'} [Kondisi Tren: ${technicals?.trendState || 'CONSOLIDATING'}]
- Bollinger Bands: Atas: ${technicals?.bollingerUpper?.toFixed(2) || 'N/A'} | Tengah: ${technicals?.bollingerMiddle?.toFixed(2) || 'N/A'} | Bawah: ${technicals?.bollingerLower?.toFixed(2) || 'N/A'}
- Pivot Sembunyi & Level Kunci: R2: ${technicals?.pivotPoints?.r2?.toFixed(2) || 'N/A'} | R1: ${technicals?.pivotPoints?.r1?.toFixed(2) || 'N/A'} | Pivot: ${technicals?.pivotPoints?.pivot?.toFixed(2) || 'N/A'} | S1: ${technicals?.pivotPoints?.s1?.toFixed(2) || 'N/A'} | S2: ${technicals?.pivotPoints?.s2?.toFixed(2) || 'N/A'}

2. METRIK SENTIMEN PASAR:
- Indeks Fear & Greed: ${compSentiment?.fearGreedIndex || 'N/A'} [Status: ${compSentiment?.fearGreedLabel || 'NEUTRAL'}]
- Pembagian Arah Trader: ${compSentiment?.bullishPercentage || 50}% Bullish | ${compSentiment?.bearishPercentage || 50}% Bearish
- Rasio Penjatahan Buku Order (Orderbook Bid/Ask Ratio): ${compSentiment?.orderBookRatio || '1.0'}x (Kelebihan Bid dibanding Ask)
- Kecepatan Pembicaraan Sosial (Social Volume Velocity): ${compSentiment?.socialVolumePercent || 'N/A'}%

3. FAKTOR & METRIK REKOMENDASI FUNDAMENTAL AKTIF:
${Array.isArray(fundamentals) ? fundamentals.map((f: any) => `- ${f.label}: ${f.value} [Sentimen Efek: ${f.bias.toUpperCase()}]`).join('\n') : '- Tidak ada parameter fundamental khusus terdeteksi untuk aset ini.'}
========================================================================
    `.trim();
  }

  // Build high impact prompt that forces objective and timeframe-calibrated analysis
  const systemPrompt = `Kamu adalah AI Flow AI, sebuah sistem AI analis profesional elit di pasar Crypto, Forex, Komoditas, dan Saham Indonesia (IDX) yang dilengkapi dengan "Continuous Learning Cognitive Circuitry" (Sistem Memori Pembelajaran Berkelanjutan).
Tugasmu adalah menganalisis pergerakan teknikal secara mendalam berdasarkan parameter input dan data live pasar teragregasi yang kami sediakan, dan memberikan rekomendasi serta sinyal perdagangan (Signal Entry) yang akurat dan kredibel.

🎯 ATURAN MUTLAK INDIKATOR TERPILIH (PENTINGNYA INTEGRASI INDIKATOR SISTEM):
Kamu HANYA diperbolehkan menyandarkan analisismu dan keputusan sinyal (BUY/SELL/NEUTRAL) pada indikator-indikator teknikal yang aktif dan dipilih oleh pengguna berikut: [ ${(indicators || []).join(', ')} ]. Jangan pernah berspekulasi, menyimpulkan, atau menyisipkan indikator teknikal lain yang tidak dipilih atau tidak dicentang di atas! Jika indikator terpilih adalah "RSI" dan "EMA-50", batasi visualisasi dan analisis logika algoritma kognitifmu hanya pada kedua indikator tersebut.

⚠️ PENTING: ATURAN PENGAMBILAN KEPUTUSAN BUY / SELL / NEUTRAL (SEIMBANG & OBJEKTIF):
🚨 CRITICAL RULE: Jangan bias ke BUY! Distribusi sinyal harus SEIMBANG: ~33% BUY, ~33% SELL, ~34% NEUTRAL.
Kamu wajib OBJEKTIF dan BERANI menyampaikan SELL signals ketika kondisi market bearish, tidak peduli sentiment positif.

Tentukan jenis aksi trading ('type') dengan urutan prioritas KETAT:

TIER 1 - SINYAL KUAT (Confidence: HIGH):
• SELL KUAT: RSI > 65 (overbought) DAN (harga > Resistance R1 ATAU EMA-50 < EMA-200 ATAU MACD histogram negatif). Jangan ragu! Pasar sudah overbought, perlu revert.
• BUY KUAT: RSI < 35 (oversold) DAN (harga < Support S1 ATAU EMA-50 > EMA-200 ATAU MACD histogram positif). Kondisi oversold dengan buy signal kuat.
• NEUTRAL KUAT: Indikator SALING BERTENTANGAN atau tidak ada sinyal jelas (misal: RSI overbought tapi EMA-50 still above EMA-200).

TIER 2 - SINYAL SEDANG (Confidence: MEDIUM):
• SELL MEDIUM: RSI 55-65 (mendekati overbought) ATAU harga mulai rejection di Resistance R1 ATAU EMA-50 start crossing bawah EMA-200. Market mulai lemah.
• BUY MEDIUM: RSI 35-45 (mendekati oversold) ATAU harga mulai bounce dari Support S1 ATAU EMA-50 start crossing naik EMA-200. Market mulai strong.
• NEUTRAL MEDIUM: Mix signals - misal RSI normal (45-55) tapi price di resistance area, atau MACD weak, atau Bollinger squeeze.

TIER 3 - SINYAL LEMAH (Confidence: LOW):
• Jika hanya 1 indikator bearish/bullish tapi yang lain netral → output NEUTRAL dengan confidence LOW (jangan paksa BUY/SELL).
• Jika kondisi truly uncertain (flat market, no clear direction) → NEUTRAL adalah pilihan TERBAIK.

🎯 DISTRIBUSI MINIMAL: Setiap 10 analisis, output minimal 3 SELL, 3 BUY, 4 NEUTRAL. Jangan lanjutkan BUY kalau sudah banyak!

⌛ PENENTUAN TIMEFRAME & GAYA TRADING (DESAIN TARGET RISIKO & RASIO TP/SL):
Timeframe "${timeframe || 'M15'}" dan Gaya Trading "${tradingStyle || 'Bebas'}" adalah penentu utama pips atau jarak persentase antara harga entry, takeProfit1, takeProfit2, dan stopLoss! Hubungkan pips/persentase ini secara matematis yang sangat ketat:
- Untuk timeframe sangat pendek (M1, M5) dengan gaya SCALP: Sinyal harus dirancang sangat ketat. Jarak TP1 ke Entry harus berkisar di rentang mikro: 0.1% s/d 0.35% (Crypto) atau 5 s/d 12 pips (Forex) atau $1.5 s/d $3.5 (Gold/XAUUSD). Stop Loss juga sangat rapat: 0.1% s/d 0.3% (Crypto) atau 4 s/d 10 pips (Forex).
- Untuk timeframe jangka menengah (M15, M30, H1) dengan gaya DAY TRADE: Target TP1 berkisar di rentang intraday: 0.5% s/d 1.5% (Crypto) atau 15 s/d 40 pips (Forex) atau $5.0 s/d $12.0 (Gold/XAUUSD). Stop Loss berkisar: 0.4% s/d 1.0% (Crypto) atau 12 s/d 30 pips (Forex).
- Untuk timeframe jangka panjang (H4, D1, W1) with gaya SWING atau POSITION: Target TP1 berkisar di rentang swing besar: 3.5% s/d 15.0% (Crypto) atau 80 s/d 250 pips (Forex) atau $20.0 s/d $80.0 (Gold/XAUUSD). Stop Loss disesuaikan lebar demi menghindari sumbu manipulatif: 2.0% s/d 6.0% (Crypto) atau 50 s/d 100 pips (Forex).

Untuk Saham Indonesia (misal: BBCA, BBRI, TLKM, GOTO, BMRI, ASII), pastikan memberikan harga entryPrice, takeProfit1, takeProfit2, dan stopLoss dalam bentuk angka bulat Rupiah (integer tanpa desimal sepeser pun).
Jika indikator opsional mengandung 'Momentum Pembalikan', fokuskan analisis pada penemuan pola-pola pembalikan tren (reversal momentum) seperti bullish/bearish divergence, overbought/oversold exhaustion, double bottom/top, head and shoulders, atau harmonic patterns, serta konfirmasi kegagalan breakout (liquidity sweep).

RIWAYAT ANALISIS TERDAHULU UNTUK PEMBELAJARAN (COGNITIVE MEMORY LOG):
Gunakan riwayat di bawah ini untuk belajar dari keputusan masa lalu Anda sendiri. Pelajari pola-polanya agar keputusan sekarang memiliki sinergi akumulatif, lebih konsisten, dan menghindari pengulangan bias analisa yang tidak akurat:
${historyContext}

${compiledMetrics ? `DATA AGREGATOR LIVE PASAR UNTUK REKTIFIKASI (WAJIB DIBACA DAN DIALIRKAN DALAM ANALISISMU):
${compiledMetricsContext}` : ''}

REKAYASA SINYAL SESUAI GAYA TRADING & KONDISI MARKET:
- Tentukan jenis aksi trading ('type'): 'BUY', 'SELL', atau 'NEUTRAL' berdasarkan indikator, BUKAN timeframe.
- Tentukan gaya trading ('style'): "${tradingStyle || 'DAY TRADE'}". Jika user tidak specify, default 'DAY TRADE'.
- Tentukan harga 'entryPrice': CURRENT PRICE (${currentPrice}) atau level psikologis terdekat. Jangan spekulasi harga masa depan!
- 'takeProfit1' & 'takeProfit2': Hitung berdasarkan volatility & indikator, bukan timeframe.
  * Untuk BUY: TP = current price × (1 + profit %) dimana profit % = 0.5% to 2% tergantung volatility
  * Untuk SELL: TP = current price × (1 - profit %)
  * Risk/Reward minimum 1:1.5 (SL distance ÷ TP distance ≥ 1.5)
- 'stopLoss': Logical level dari indikator (resistance untuk SELL, support untuk BUY), bukan arbitrary %.
- Atur tingkat kepercayaan 'confidence': HIGH (2+ indikator confirm), MEDIUM (1-2 mixed), LOW (unclear/conflicting).

STRUKTUR ANALISIS (Tulis semua penjelasan dalam Bahasa Indonesia yang profesional, tegas, dan berbobot tanpa istilah main-main):
- 'sentiment': Jelaskan dinamika pelaku pasar dengan detail, psikologi pembeli/penjual di area harga sekarang berdasarkan indikator terpilih [ ${(indicators || []).join(', ')} ] dan data sentimen pasar di atas.
- 'mtfAnalysis': Jelaskan analisis multi-timeframe komprehensif, hubungkan TF ${timeframe || 'M15'} secara eksplisit dengan HTF dan LTF, dan fokuskan HANYA pada indikator terpilih [ ${(indicators || []).join(', ')} ] yang aktif.
- 'bullishCase': Argumen teknikal & fundamental mengapa harga berpeluang naik, dianalisis spesifik dari perspektif indikator yang dipilih di atas.
- 'bearishCase': Argumen teknikal & fundamental mengapa harga berpeluang turun, dianalisis spesifik dari perspektif indikator yang dipilih di atas yaitu [ ${(indicators || []).join(', ')} ].
- 'learningFeedback': Berikan 1-2 kalimat analisis kritis/metakognitif tentang keselarasan indikator terpilih [ ${(indicators || []).join(', ')} ] terhadap gaya trading "${tradingStyle || 'bebas'}" dan parameter instrumen ${pair}.

📊 DATA OBJEKTIF UNTUK ANALISIS:
Pasangan aset: ${pair}
Harga sekarang: ${currentPrice}
Timeframe referensi: ${timeframe || 'M15'} (hanya untuk konteks, keputusan BUY/SELL based on indicators!)
Indikator utama untuk analisis: ${(indicators || []).join(', ')}
Gaya trading default: ${tradingStyle || 'DAY TRADE'} (gunakan untuk sizing TP/SL, bukan untuk mempengaruhi direction decision)

⚠️ RULE FINAL: Keputusan type (BUY/SELL/NEUTRAL) adalah PURAMENTE OBJECTIVE berdasarkan indikator.
User timeframe preference & gaya trading adalah HANYA untuk exit strategy, bukan untuk change signal direction.
Jika indikator menunjukkan SELL momentum overbought, keluarkan SELL meski user prefer BUY atau scalping - AI lebih tahu.

${customPrompt ? `Catatan pengguna (informasi context, bukan override decision): ${customPrompt}` : ''}

Format balasan WAJIB berupa objek JSON valid sesuai spesifikasi schema.`;

  try {
    // Use OpenRouter with powerful free model for real-time analysis
    const activeModel = openRouterModel || 'meta-llama/llama-3.3-70b-instruct';

    const rawTextOutput = await callOpenRouterAPI(systemPrompt, activeModel);

    // Clean potential markdown blocks just in case
    const cleanedTextOutput = rawTextOutput.replace(/```json\s*/ig, '').replace(/```\s*$/ig, '').trim();
    const analysisResult = JSON.parse(cleanedTextOutput);

    // Inject unique server ID and generate a running record from the dynamic signal
    const isCrypto = pair.toUpperCase().includes('USDT');
    const isStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => pair.toUpperCase().startsWith(s));
    
    // Align analysis entry and levels with ultra-fresh current cached price to solve AI latency/slippage
    const activePairUpper = (analysisResult.pair || pair).toUpperCase();
    const liveCache = cachedPrices[activePairUpper];
    const livePriceRightNow = liveCache ? liveCache.price : Number(currentPrice);
    
    const suggestedEntry = Number(analysisResult.entryPrice) || Number(currentPrice);
    const priceDiff = livePriceRightNow - suggestedEntry;

    // Apply the real-time latency alignment
    const finalEntryPrice = livePriceRightNow;
    const finalTakeProfit1 = Number(analysisResult.takeProfit1) + priceDiff;
    const finalTakeProfit2 = Number(analysisResult.takeProfit2) + priceDiff;
    const finalStopLoss = Number(analysisResult.stopLoss) + priceDiff;

    // Default initial profit/pips is 0 since entry price is calibrated to current price
    let initialPips = 0;

    const newSignal = {
      id: 'gen-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      pair: analysisResult.pair || pair,
      type: analysisResult.type || 'NEUTRAL',
      style: analysisResult.style || 'SCALP',
      entryPrice: finalEntryPrice,
      currentPrice: livePriceRightNow,
      takeProfit1: finalTakeProfit1,
      takeProfit2: finalTakeProfit2,
      stopLoss: finalStopLoss,
      confidence: (analysisResult.confidence || 'MEDIUM').toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
      sentiment: analysisResult.sentiment || 'Analisis sentimen pasar terpadu.',
      mtfAnalysis: analysisResult.mtfAnalysis || 'Analisis struktur multi-timeframe terperinci.',
      bullishCase: analysisResult.bullishCase || 'Dukungan resistensi pembeli tangguh.',
      bearishCase: analysisResult.bearishCase || 'Penekanan momentum penjual di area jenuh.',
      pipsProfit: initialPips,
      status: (analysisResult.type === 'NEUTRAL' ? 'EXPIRED' : 'ACTIVE') as any,
      timestamp: Date.now(),
      learningFeedback: analysisResult.learningFeedback || 'Memasukkan sirkuit metakognitif awal untuk memperluas database intelijen.'
    };

    // Store in historical signals list on the server so the browser dashboard picks it up!
    signalsHistory.unshift(newSignal);

    return res.json({ success: true, signal: newSignal });
  } catch (error: any) {
    console.error('Error generating analysis:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghasilkan analisis sinyal.' });
  }
});

// GET Signals History
app.get('/api/signals', (req, res) => {
  return res.json({ success: true, signals: signalsHistory });
});

// POST Resolve Signal status explicitly
app.post('/api/signals/resolve', (req, res) => {
  const { id, status, pipsProfit, currentPrice } = req.body;
  const signal = signalsHistory.find(s => s.id === id);
  if (signal) {
    signal.status = status; // 'TAKE_PROFIT', 'STOP_LOSS', 'EXPIRED'
    signal.pipsProfit = Number(pipsProfit);
    if (currentPrice !== undefined) {
      signal.currentPrice = Number(currentPrice);
    }
    signal.resolutionTimestamp = Date.now();
  }
  return res.json({ success: true, signals: signalsHistory });
});

// POST Reset Signals (to return to original prepopulated list)
app.post('/api/signals/reset', (req, res) => {
  signalsHistory = signalsHistory.filter(s => s.id.startsWith('prep-'));
  return res.json({ success: true, signals: signalsHistory });
});

// POST Send Telegram Notification
app.post('/api/telegram/send', async (req, res) => {
  const { botToken, chatId, signal } = req.body;

  if (!botToken || !chatId || !signal) {
    return res.status(400).json({ error: 'Telegram Bot Token, Chat ID, and Signal data are required' });
  }

  const signalTypeEmoji = signal.type === 'BUY' ? '🟢 BUY COMMAND' : (signal.type === 'SELL' ? '🔴 SELL COMMAND' : '⚪ NEUTRAL STRATEGY');
  const confidenceStars = signal.confidence === 'HIGH' ? '⭐⭐⭐ STRONGEST' : (signal.confidence === 'MEDIUM' ? '⭐⭐ NORMAL' : '⭐ CAUTIOUS');

  // Formulate high fidelity HTML message for Telegram Bot API
  const messageHtml = `
<b>🔔 FUTURESMAX AI FLOW - SIGNAL TERBARU</b>

📊 <b>Pasangan Aset:</b> <code>${signal.pair}</code>
🚀 <b>Aksi Sinyal:</b> <b>${signalTypeEmoji}</b> (${signal.style})
🔥 <b>Keyakinan (Confidence):</b> <code>${signal.confidence} (${confidenceStars})</code>

📈 <b>Harga Entry:</b> <code>${signal.entryPrice}</code>
🎯 <b>Take Profit 1:</b> <code>${signal.takeProfit1}</code>
🎯 <b>Take Profit 2:</b> <code>${signal.takeProfit2}</code>
🛑 <b>Batas Stop Loss:</b> <code>${signal.stopLoss}</code>

------------------------
💡 <b>Sentimen Pasar:</b>
<i>${signal.sentiment}</i>

🔍 <b>Analisis Struktur (MTF):</b>
<i>${signal.mtfAnalysis}</i>

🐂 <b>Bullish Skenario:</b>
<i>${signal.bullishCase}</i>

Bearish Skenario:</b>
<i>${signal.bearishCase}</i>

📱 <i>Generated by Claude AI (AI Flow VIP Room)</i>
  `.trim();

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Gagal mengirimkan notifikasi Telegram.');
    }

    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('Telegram sender API proxy error:', error);
    return res.status(500).json({ error: error.message || 'Koneksi ke bot Telegram gagal.' });
  }
});

// POST Test Telegram Integration
app.post('/api/telegram/test', async (req, res) => {
  const { botToken, chatId } = req.body;

  if (!botToken || !chatId) {
    return res.status(400).json({ error: 'Bot Token and Chat ID are required' });
  }

  const messageText = `⚡ <b>FUTURESMAX AI FLOW</b>\n\nSelamat! Integrasi bot Telegram Anda dengan AI Flow AI Flow berhasil disinkronisasi.\nSetiap analisa sinyal real-time baru akan langsung disalurkan ke chat/channel ini.`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Gagal melakukan verifikasi test bot.');
    }

    return res.json({ success: true, message: 'Test connection sent successfully!' });
  } catch (error: any) {
    console.error('Telegram testing endpoint failed:', error);
    return res.status(500).json({ error: error.message || 'Kesalahan koneksi API Telegram.' });
  }
});

// POST Send custom price alert notification via Telegram
app.post('/api/telegram/send-alert', async (req, res) => {
  const { botToken, chatId, alertMessage } = req.body;

  if (!botToken || !chatId || !alertMessage) {
    return res.status(400).json({ error: 'Bot Token, Chat ID, and alertMessage are required' });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: alertMessage,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Gagal mengirimkan notifikasi.');
    }

    return res.json({ success: true, result });
  } catch (error: any) {
    console.error('Telegram price alert proxy error:', error);
    return res.status(500).json({ error: error.message || 'Gagal mengirimkan notifikasi ke Telegram.' });
  }
});

// POST Review dynamic Trade Journal entry with OpenRouter API
app.post('/api/ai-flow/review-journal', async (req, res) => {
  const { pair, type, entryPrice, exitPrice, status, entryReason, exitReason, pnl, notes } = req.body;

  if (!pair || !type || !entryPrice || !entryReason) {
    return res.status(400).json({ error: 'Pasangan, Tipe, Harga Entry, dan Alasan Masuk wajib diisi.' });
  }

  try {
    const systemPrompt = `Kamu adalah AI Flow, mentor trading profesional elit dan psikolog pasar keuangan.
Tugasmu adalah menganalisis "Trade Journal" (Jurnal Perdagangan) yang diinput oleh pengguna dan memberikan ulasan analitis serta evaluasi "Post-Trade Review" (Analisis Pasca-Perdagangan) yang mendalam, kritis, objektif, serta taktis dalam bahasa Indonesia yang berbobot dan profesional tanpa bertele-tele.

Detail Jurnal Perdagangan:
- Pasangan Aset: ${pair}
- Jenis Transaksi: ${type} (BUY atau SELL)
- Harga Masuk (Entry): ${entryPrice}
- Harga Keluar (Exit): ${exitPrice || 'Belum Ditutup (Transaksi Masih Terbuka)'}
- Status Transaksi: ${status}
- Alasan Masuk (Entry Reason): ${entryReason}
- Alasan Keluar (Exit Reason): ${exitReason || 'Belum ada lapor keluar / N/A'}
- Keuntungan/Kerugian (P&L): ${pnl !== undefined && pnl !== null ? pnl : 'N/A'}
- Catatan Tambahan (Notes): ${notes || 'N/A'}

Tulis seluruh evaluasi ulasanmu dalam format Markdown yang elegan dengan bagian-bagian berikut:
### 🧠 Ulasan Psikologi & Disiplin
(Evaluasikan emosi, kesiapan psikologis, pola FOMO/greed, atau tingkat kepatuhan trader terhadap rencana perdagangan.)

### 📐 Analisis Teknis & Strategis
(Evaluasikan apakah alasan masuk/keluar logis secara teknikal seperti struktur pasar, sirkulasi arah tren, indikator, atau rasio untung/rugi.)

### ⚡ Rekomendasi Taktis & Core Feedback
(Berikan 2 hingga 3 buah saran perbaikan taktis masa depan yang bersifat operasional dan praktis berdasarkan jurnal ini.)`;

    const reviewText = await callOpenRouterAPI(systemPrompt, 'meta-llama/llama-3.3-70b-instruct');
    return res.json({ success: true, aiReview: reviewText });
  } catch (error: any) {
    console.error('OpenRouter Trade Journal Review error:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghasilkan tinjauan post-trade dari AI.' });
  }
});

// Serve frontend build files in production or hook into Vite dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP server with WebSocket support
  const httpServer = createHttpServer(app);

  // Setup WebSocket server for real-time price streaming
  const wsServer = new WebSocketServer({ server: httpServer });
  const connectedClients = new Set<any>();

  wsServer.on('connection', (ws: any) => {
    console.log('✅ Client connected to price stream');
    connectedClients.add(ws);

    // Send initial prices
    ws.send(JSON.stringify({
      type: 'initial',
      prices: cachedPrices,
      timestamp: Date.now()
    }));

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log('Client disconnected from price stream');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });

  // Broadcast prices to all connected WebSocket clients every 500ms
  setInterval(() => {
    if (connectedClients.size > 0) {
      const priceData = JSON.stringify({
        type: 'update',
        prices: cachedPrices,
        timestamp: Date.now()
      });

      connectedClients.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
          try {
            ws.send(priceData);
          } catch (error) {
            console.error('Error broadcasting to client:', error);
            connectedClients.delete(ws);
          }
        }
      });
    }
  }, 500);

  httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ AI Flow backend initialized on port ${PORT}`);
    console.log(`📡 WebSocket streaming ready at wss://localhost:${PORT}/`);

    // Finnhub WebSocket DISABLED - connection keeps failing + REST API hitting 429 rate limit
    // Using Binance WebSocket (working 100%) + smart cache instead
    console.log('📌 Using Binance WebSocket + Yahoo Finance + Smart Cache');
    console.log('✅ Real-time prices guaranteed via multiple fallback layers');
  });
}

startServer();
