import { useState, useEffect } from 'react';
import { Asset, MarketSignal, TelegramConfig } from './types';
import PriceFeed from './components/PriceFeed';
import TechnicalAnalyzer from './components/TechnicalAnalyzer';
import PerformanceDashboard from './components/PerformanceDashboard';
import TelegramPanel from './components/TelegramPanel';
import NewsSentimentHub from './components/NewsSentimentHub';
import BrokerRecommendations from './components/BrokerRecommendations';
import MarketSessionsCalendar from './components/MarketSessionsCalendar';
import { Cpu, BarChart3, Send, ShieldCheck, Zap, RefreshCw, Coins, Calendar } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'dashboard' | 'telegram' | 'broker' | 'calendar'>('analyzer');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [injectedNewsContext, setInjectedNewsContext] = useState<string | undefined>(undefined);

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

  // Trigger click auto-fill binding from the Live Feed grid
  const handleSelectAsset = (asset: Asset, currentPrice: number) => {
    setSelectedAsset(asset);
    setSelectedPrice(currentPrice);
    setActiveTab('analyzer'); // focus tab to let them analyze instantly
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
        </div>
        <div className="flex items-center space-x-4">
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
        </div>
      </header>

      {/* Main Dashboard Layout section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Live Feed and Shocks Hub (Grid 4 col) */}
        <section className="lg:col-span-4 space-y-6">
          <PriceFeed onSelectAsset={handleSelectAsset} />
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
    </div>
  );
}
