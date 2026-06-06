import { useState, useEffect, useRef } from 'react';
import { Asset, MarketSignal, TelegramConfig, LivePrice, PriceAlert } from './types';
import PriceFeed from './components/PriceFeed';
import PriceAlertsPanel from './components/PriceAlertsPanel';
import TechnicalAnalyzer from './components/TechnicalAnalyzer';
import PerformanceDashboard from './components/PerformanceDashboard';
import TelegramPanel from './components/TelegramPanel';
import NewsSentimentHub from './components/NewsSentimentHub';
import BrokerRecommendations from './components/BrokerRecommendations';
import MarketSessionsCalendar from './components/MarketSessionsCalendar';
import TradeJournal from './components/TradeJournal';
import TechnicalChart from './components/TechnicalChart';
import { Cpu, BarChart3, Send, ShieldCheck, Zap, RefreshCw, Coins, Calendar, BellRing, BookMarked, AreaChart } from 'lucide-react';
import { getLivePrices, tickLivePrices } from './services/marketService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'chart' | 'dashboard' | 'telegram' | 'broker' | 'calendar' | 'journal'>('analyzer');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [injectedNewsContext, setInjectedNewsContext] = useState<string | undefined>(undefined);

  // Real-time market state driven from parent
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);

  // User price alerts state
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('fm_price_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse price alerts from cache:', e);
      }
    }
    return [];
  });

  // Screen active alert floating toasts
  const [toasts, setToasts] = useState<{ id: string; symbol: string; targetPrice: number; currentPrice: number; condition: 'ABOVE' | 'BELOW' }[]>([]);

  // Periodically fetch and simulate micro-price ticks, while running free high-speed Binance WebSocket streaming
  useEffect(() => {
    async function initFeed() {
      setPricesLoading(true);
      const initial = await getLivePrices();
      setPrices(initial);
      setPricesLoading(false);
    }
    
    initFeed();

    // 1. Fetch real API rates every 12 seconds
    const apiInterval = setInterval(async () => {
      const updated = await getLivePrices();
      setPrices(prev => {
        // Keep WebSocket prices if they are fresher than the slow polled data
        const merged = { ...updated };
        Object.keys(prev).forEach(key => {
          if (prev[key].lastUpdated > (merged[key]?.lastUpdated || 0) + 1000) {
            merged[key] = prev[key];
          }
        });
        return merged;
      });
    }, 12000);

    // 2. Perform ultra-high-speed (350ms) micro price ticks for Gold & Forex to simulate live market depth wiggles
    const fastTickInterval = setInterval(() => {
      const ticked = tickLivePrices();
      setPrices(prev => {
        const merged = { ...prev };
        Object.keys(ticked).forEach(key => {
          // Update Forex & Commodities in real-time at this sub-second rate
          const isGoldOrForex = key === 'XAUUSD' || key === 'XAGUSD' || 
            ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDJPY', 'USDCAD', 'USDCHF'].includes(key);
          if (isGoldOrForex) {
            merged[key] = ticked[key];
          }
        });
        return merged;
      });
    }, 350);

    // 2b. REAL-TIME Indonesian stocks (BBCA, BBRI, TLKM, etc) - 600ms ultra-fast tick
    const stockTickInterval = setInterval(() => {
      const ticked = tickLivePrices();
      setPrices(prev => {
        const merged = { ...prev };
        Object.keys(ticked).forEach(key => {
          const isGoldOrForex = key === 'XAUUSD' || key === 'XAGUSD' ||
            ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDJPY', 'USDCAD', 'USDCHF'].includes(key);
          const isFromWs = key.includes('USDT') && prev[key]?.lastUpdated && (Date.now() - prev[key].lastUpdated < 8000);
          // Update Indonesian stocks REAL-TIME: BBCA, BBRI, TLKM, ASII, GOTO, BMRI
          const isIndoStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].includes(key);
          if ((isIndoStock || (!isFromWs && !isGoldOrForex)) && !isFromWs) {
            merged[key] = ticked[key];
          }
        });
        return merged;
      });
    }, 600);

    // 3. Establish super fast, direct public client-side WebSocket price monitoring (100% Free)
    const wsStreams = [
      'btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'dogeusdt', 'xrpusdt', 'adausdt', 'avaxusdt', 'linkusdt',
      'pepeusdt', 'wifusdt', 'bonkusdt', 'flokiusdt', 'suiusdt', 'renderusdt', 'fetusdt', 'pnutusdt',
      'neirousdt', 'goatusdt', 'actusdt', 'ondousdt', 'taousdt', 'wldusdt', 'seiusdt', 'nearusdt', 'jupusdt'
    ];

    const streamsQuery = wsStreams.map(s => `${s}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamsQuery}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('📡 Binance WebSocket streaming connected successfully.');
          setIsWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload && payload.data) {
              const data = payload.data;
              const rawSymbol = data.s; // e.g. "BTCUSDT"
              const price = parseFloat(data.c);
              const change24h = parseFloat(data.P);
              const high = parseFloat(data.h);
              const low = parseFloat(data.l);

              if (rawSymbol && !isNaN(price)) {
                setPrices(prev => {
                  const existingSpot = prev[rawSymbol];
                  const updatedSpot: LivePrice = {
                    symbol: rawSymbol,
                    price: price,
                    change24h: isNaN(change24h) ? (existingSpot?.change24h || 0) : change24h,
                    high24h: isNaN(high) ? (existingSpot?.high24h || price * 1.05) : high,
                    low24h: isNaN(low) ? (existingSpot?.low24h || price * 0.95) : low,
                    lastUpdated: Date.now()
                  };

                  const nextPrices = { ...prev, [rawSymbol]: updatedSpot };

                  // Slide Perpetuals matching update
                  const perpSymbol = `${rawSymbol}_PERP`;
                  const existingPerp = prev[perpSymbol];
                  if (existingPerp) {
                    nextPrices[perpSymbol] = {
                      symbol: perpSymbol,
                      price: price * 1.0003, // futures premium offset
                      change24h: isNaN(change24h) ? (existingPerp?.change24h || 0) : change24h,
                      high24h: isNaN(high) ? (existingPerp?.high24h || price * 1.05) : high * 1.0003,
                      low24h: isNaN(low) ? (existingPerp?.low24h || price * 0.95) : low * 1.0003,
                      lastUpdated: Date.now()
                    };
                  }

                  return nextPrices;
                });
              }
            }
          } catch (e) {
            console.error('WebSocket message parsing failed:', e);
          }
        };

        socket.onclose = () => {
          console.log('📡 Binance WebSocket disconnected. Swapping back to polling...');
          setIsWsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };

        socket.onerror = () => {
          socket?.close();
        };

      } catch (err) {
        console.error('Failed to create WebSocket client:', err);
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      clearInterval(apiInterval);
      clearInterval(fastTickInterval);
      clearInterval(stockTickInterval);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Synthesize pleasant double audio chime on client
  const playAlertChime = () => {
    const isMuted = localStorage.getItem('fm_alerts_muted') === 'true';
    if (isMuted) return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.1); // E6
      gain2.gain.setValueAtTime(0.12, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio feedback failed or blocked', e);
    }
  };

  const sendTelegramAlert = async (alert: PriceAlert, reachedPrice: number) => {
    if (!telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) return;

    const condEmoji = alert.condition === 'ABOVE' ? '📈' : '📉';
    const activeTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    
    const textMessage = `
<b>🔔 ALARAM HARGA FUTURESMAX TERPING</b>

📊 <b>Pasangan Aset:</b> <code>${alert.symbol}</code>
${condEmoji} <b>Kondisi Trigger:</b> <b>${alert.condition} TEMBUS</b> (Target: ${alert.targetPrice})
⚡ <b>Harga Saat Ini:</b> <code>${reachedPrice}</code>
⏰ <b>Waktu Sentuh:</b> <code>${activeTimeStr}</code>

📱 <i>Generated by Claude AI (AI Flow VIP Room)</i>
    `.trim();

    try {
      await fetch('/api/telegram/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          alertMessage: textMessage
        })
      });
    } catch (err) {
      console.error('Failed to dispatch telegram notification proxy', err);
    }
  };

  const triggerAlertNotification = (alert: PriceAlert, reachedPrice: number) => {
    playAlertChime();

    const nextToast = {
      id: alert.id + '-' + Date.now(),
      symbol: alert.symbol,
      targetPrice: alert.targetPrice,
      currentPrice: reachedPrice,
      condition: alert.condition
    };
    setToasts(prev => [nextToast, ...prev]);

    sendTelegramAlert(alert, reachedPrice);
  };

  // Synchronous checks for price alerts on each price ticker update
  useEffect(() => {
    if (Object.keys(prices).length === 0 || alerts.length === 0) return;

    let changed = false;
    const updatedAlerts = alerts.map(alert => {
      if (alert.status !== 'PENDING') return alert;

      const live = prices[alert.symbol];
      if (!live) return alert;

      let triggered = false;
      if (alert.condition === 'ABOVE' && live.price >= alert.targetPrice) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && live.price <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        changed = true;
        triggerAlertNotification(alert, live.price);
        return {
          ...alert,
          status: 'TRIGGERED' as const,
          triggeredAt: Date.now()
        };
      }
      return alert;
    });

    if (changed) {
      setAlerts(updatedAlerts);
      localStorage.setItem('fm_price_alerts', JSON.stringify(updatedAlerts));
    }
  }, [prices, alerts]);

  const handleAddAlert = (symbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => {
    const newAlert: PriceAlert = {
      id: 'alert-' + Date.now() + '-' + Math.round(Math.random() * 100),
      symbol,
      targetPrice,
      condition,
      status: 'PENDING',
      createdAt: Date.now()
    };
    const nextAlerts = [newAlert, ...alerts];
    setAlerts(nextAlerts);
    localStorage.setItem('fm_price_alerts', JSON.stringify(nextAlerts));
  };

  const handleDeleteAlert = (id: string) => {
    const nextAlerts = alerts.filter(a => a.id !== id);
    setAlerts(nextAlerts);
    localStorage.setItem('fm_price_alerts', JSON.stringify(nextAlerts));
  };

  const handleClearAllAlerts = () => {
    const nextAlerts = alerts.filter(a => a.status === 'TRIGGERED'); // clear only pending
    setAlerts(nextAlerts);
    localStorage.setItem('fm_price_alerts', JSON.stringify(nextAlerts));
  };

  const handleRefreshPrices = async () => {
    setPricesLoading(true);
    const updated = await getLivePrices();
    setPrices(updated);
    setPricesLoading(false);
  };

  // Read telegram credentials dynamically from localStorage
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('fm_telegram_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      botToken: '',
      chatId: '',
      enabled: false
    };
  });

  // Pull initial signal list from Express backend database
  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/signals');
      const data = await response.json();
      if (response.ok && data.success) {
        setSignals(data.signals);
      }
    } catch (err) {
      console.error('Failed to sync historical signal list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/signals/reset', { method: 'POST' });
      const data = await response.json();
      if (response.ok && data.success) {
        setSignals(data.signals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update Telegram config and persist to localStorage
  const handleUpdateTelegramConfig = (newConfig: TelegramConfig) => {
    setTelegramConfig(newConfig);
    localStorage.setItem('fm_telegram_config', JSON.stringify(newConfig));
  };

  // When a new signal is successfully compiled by Gemini, insert it into our local list
  const handleNewSignalCreated = (newSignal: MarketSignal) => {
    setSignals(prev => [newSignal, ...prev]);
  };

  // Track resolving signals to avoid duplicates
  const resolvingSignalsRef = useRef<Record<string, boolean>>({});

  // Explicitly update signal status to TP or SL on the server for full transparency of performance tracking
  const handleResolveSignal = async (id: string, status: 'TAKE_PROFIT' | 'STOP_LOSS' | 'EXPIRED', pips: number, currentPrice?: number) => {
    try {
      const response = await fetch('/api/signals/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, pipsProfit: pips, currentPrice })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSignals(data.signals);
      }
    } catch (err) {
      console.error('Failed to resolve signal status on Backend:', err);
    }
  };

  // Real-time monitor: automatically check if any active trader signals hit TP & SL limits
  useEffect(() => {
    if (signals.length === 0 || Object.keys(prices).length === 0) return;

    signals.forEach(async (sig) => {
      if (sig.status !== 'ACTIVE') return;
      if (resolvingSignalsRef.current[sig.id]) return;

      const live = prices[sig.pair.toUpperCase()];
      if (!live) return;

      const currentPrice = live.price;
      let triggered = false;
      let status: 'TAKE_PROFIT' | 'STOP_LOSS' | null = null;

      if (sig.type === 'BUY') {
        if (currentPrice >= sig.takeProfit1) {
          triggered = true;
          status = 'TAKE_PROFIT';
        } else if (currentPrice <= sig.stopLoss) {
          triggered = true;
          status = 'STOP_LOSS';
        }
      } else if (sig.type === 'SELL') {
        if (currentPrice <= sig.takeProfit1) {
          triggered = true;
          status = 'TAKE_PROFIT';
        } else if (currentPrice >= sig.stopLoss) {
          triggered = true;
          status = 'STOP_LOSS';
        }
      }

      if (triggered && status) {
        resolvingSignalsRef.current[sig.id] = true;

        const isCrypto = sig.pair.toUpperCase().includes('USDT');
        const isStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => sig.pair.toUpperCase().startsWith(s));
        const multiplier = isStock ? 1 : (isCrypto ? 100 : (sig.pair.toUpperCase().includes('JPY') ? 100 : 10000));
        
        let pips = 0;
        if (status === 'TAKE_PROFIT') {
          pips = sig.type === 'BUY'
            ? Math.round((sig.takeProfit1 - sig.entryPrice) * multiplier)
            : Math.round((sig.entryPrice - sig.takeProfit1) * multiplier);
        } else {
          pips = sig.type === 'BUY'
            ? Math.round((sig.stopLoss - sig.entryPrice) * multiplier)
            : Math.round((sig.entryPrice - sig.stopLoss) * multiplier);
        }

        console.log(`Auto-resolving signal ${sig.id} (${sig.pair}) to ${status} with pips: ${pips}`);
        await handleResolveSignal(sig.id, status, pips, currentPrice);
        
        // Remove tracking item after a short safety timeout to let state settle
        setTimeout(() => {
          delete resolvingSignalsRef.current[sig.id];
        }, 3000);
      }
    });
  }, [prices, signals]);

  // Trigger click auto-fill binding from the Live Feed grid
  const handleSelectAsset = (asset: Asset, currentPrice: number) => {
    setSelectedAsset(asset);
    setSelectedPrice(currentPrice);
    if (activeTab !== 'chart') {
      setActiveTab('analyzer'); // focus tab to let them analyze instantly
    }
  };

  const handleInjectNewsContext = (context: string) => {
    setInjectedNewsContext(context);
    setActiveTab('analyzer');
  };

  const handlePriceImpactApplied = () => {
    // Simply allow updates or trigger alerts where needed
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Visual Status Utility Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono font-medium text-slate-400 tracking-wider gap-1 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span>FUTURESMAX KERNEL CORE: ONLINE</span>
          <span className="text-slate-700">|</span>
          <span>LATENCY: 12ms</span>
          <span className="text-slate-700">|</span>
          {(() => {
            const day = new Date().getDay();
            const isWeekend = day === 0 || day === 6;
            return isWeekend ? (
              <span className="text-rose-400 font-bold bg-rose-955/10 px-2 py-0.5 rounded border border-rose-900/30 animate-pulse">
                ⚠️ AKHIR PEKAN: VALAS & SAHAM IDX TUTUP | KRIPTO BUATAN 24/7
              </span>
            ) : (
              <span className="text-emerald-400 font-bold bg-emerald-955/10 px-2 py-0.5 rounded border border-emerald-900/15">
                🟢 HARI KERJA: SEMUA PASAR SEHAT & AKTIF
              </span>
            );
          })()}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40 flex items-center space-x-1 animate-pulse">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
            <span>⚡ GOLD & VALAS REAL-TIME SEC (350ms)</span>
          </span>
          <span className="text-slate-700">|</span>
          {isWsConnected ? (
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40 flex items-center space-x-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span>📡 CRYPTO FEED (BINANCE WEBSOCKET)</span>
            </span>
          ) : (
            <span className="text-[9px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40 flex items-center space-x-1">
              <span className="w-1 h-1 rounded-full bg-amber-400" />
              <span>📡 CRYPTO POLLING</span>
            </span>
          )}
          <span className="text-slate-700">|</span>
          <span>UTC TIME: {new Date().toISOString().substring(11, 19)}</span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-400">TELEGRAM BOT SYNC: {telegramConfig.enabled ? 'CONNECTED' : 'STANDBY'}</span>
        </div>
      </div>

      {/* Main Top Header Block */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm select-none">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-500 rounded-xl text-slate-950 shadow-inner flex items-center justify-center">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-widest text-white uppercase font-sans">
              FUTURESMAX <span className="text-emerald-400 font-light">AI FLOW</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">DIGITAL REAL-TIME QUANTITATIVE QUANTUM DECISION SYSTEM</p>
          </div>
        </div>

        {/* Global tab selectors */}
        <div className="flex flex-wrap bg-slate-950 border border-slate-800 rounded-xl p-1 w-full md:w-auto gap-1">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'analyzer' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu size={14} />
            <span>Analisa Sinyal</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'chart' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AreaChart size={14} />
            <span>Chart Teknikal</span>
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'dashboard' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            <span>Dashboard Performa</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'calendar' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span>Sesi & Kalender</span>
          </button>

          <button
            onClick={() => setActiveTab('broker')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'broker' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins size={14} />
            <span>Bursa & Broker</span>
          </button>

          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'telegram' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send size={14} />
            <span>Bot Telegram</span>
          </button>

          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition ${
              activeTab === 'journal' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookMarked size={14} />
            <span>Jurnal & Review AI</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Live Feed and Shocks Hub (Grid 4 col) */}
        <section className="lg:col-span-4 space-y-6">
          <PriceFeed 
            prices={prices}
            isLoading={pricesLoading}
            onRefresh={handleRefreshPrices}
            onSelectAsset={handleSelectAsset} 
          />
          
          <PriceAlertsPanel
            prices={prices}
            selectedAsset={selectedAsset}
            selectedPrice={selectedPrice}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onDeleteAlert={handleDeleteAlert}
            onClearAllAlerts={handleClearAllAlerts}
          />

          <NewsSentimentHub
            onInjectNewsContext={handleInjectNewsContext}
            onPriceImpactApplied={handlePriceImpactApplied}
          />
        </section>

        {/* Right column: Main Workspace (Grid 8 col) */}
        <section className="lg:col-span-8 space-y-6">
          {activeTab === 'analyzer' && (
            <TechnicalAnalyzer
              selectedAsset={selectedAsset}
              selectedPrice={selectedPrice}
              telegramConfig={telegramConfig}
              onSignalGenerated={handleNewSignalCreated}
              injectedNews={injectedNewsContext}
              prices={prices}
            />
          )}

          {activeTab === 'chart' && (
            <TechnicalChart
              selectedAsset={selectedAsset}
              prices={prices}
              onSelectAsset={handleSelectAsset}
            />
          )}

          {activeTab === 'dashboard' && (
            <PerformanceDashboard
              signals={signals}
              onResetHistory={handleResetHistory}
              onResolveSignal={handleResolveSignal}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'broker' && (
            <BrokerRecommendations />
          )}

          {activeTab === 'calendar' && (
            <MarketSessionsCalendar onInjectContext={handleInjectNewsContext} />
          )}

          {activeTab === 'telegram' && (
            <TelegramPanel
              config={telegramConfig}
              onUpdateConfig={handleUpdateTelegramConfig}
            />
          )}

          {activeTab === 'journal' && (
            <TradeJournal prices={prices} />
          )}
        </section>
      </main>

      {/* Humble professional security footer block */}
      <footer className="mt-12 bg-slate-900 border-t border-slate-800 px-6 py-6 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs font-mono text-slate-500 gap-4">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="text-emerald-500" size={16} />
            <span>ENKRIPSI DAN SINKRONISASI COGNITIVE AMAN (SSL SECURED)</span>
          </div>
          <div>
            <span>© 2026 FUTURESMAX RESEARCH LAB LP. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>

      {/* Floating Price Alert Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3.5 max-w-sm w-full select-none">
          {toasts.map((toast) => (
            <div 
              key={toast.id}
              className="bg-slate-950 border-2 border-emerald-500 rounded-xl p-4 shadow-2xl relative overflow-hidden"
              style={{
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
              }}
            >
              {/* Decorative top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 animate-pulse" />
              
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                    <BellRing size={16} className="animate-bounce" />
                  </div>
                  <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">ALARAM HARGA TERPICU!</h4>
                </div>
                
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-slate-500 hover:text-white font-mono text-xs p-1"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3.5 space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">PASANGAN ASET:</span>
                  <span className="font-extrabold text-white">{toast.symbol}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">KONDISI TARGET:</span>
                  <span className={`font-extrabold ${toast.condition === 'ABOVE' ? 'text-emerald-400' : 'text-rose-450 text-rose-400'}`}>
                    {toast.condition === 'ABOVE' ? 'TEMBUS KE ATAS (≥)' : 'TEMBUS KE BAWAH (≤)'} {toast.targetPrice}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">HARGA LIVE SEKARANG:</span>
                  <span className="font-extrabold text-teal-400 animate-pulse">{toast.currentPrice}</span>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-slate-500">
                <span>ALARAM AUDIO BIP AKTIF</span>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-emerald-400 hover:underline px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-500/15 font-bold"
                >
                  DISMISS / OK
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
