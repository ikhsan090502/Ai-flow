import React, { useState, useEffect } from 'react';
import { LivePrice, Asset, MarketSignal, TelegramConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, Send, CheckSquare, 
  HelpCircle, AlertTriangle, ShieldCheck, Cpu, ChevronRight, CheckCircle2,
  Gauge, Activity, Globe, Info
} from 'lucide-react';
import { compileMarketData } from '../utils/marketDataCompiler';

interface TechnicalAnalyzerProps {
  selectedAsset: Asset | null;
  selectedPrice: number | null;
  telegramConfig: TelegramConfig;
  onSignalGenerated: (newSignal: MarketSignal) => void;
  injectedNews?: string;
  prices: Record<string, LivePrice>;
}

export default function TechnicalAnalyzer({ selectedAsset, selectedPrice, telegramConfig, onSignalGenerated, injectedNews, prices }: TechnicalAnalyzerProps) {
  const [pair, setPair] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [isAutoTrack, setIsAutoTrack] = useState(true);
  const [timeframe, setTimeframe] = useState('M15');
  const [tradingStyle, setTradingStyle] = useState<'SCALP' | 'DAY TRADE' | 'SWING' | 'POSITION'>('SCALP');
  const [customPrompt, setCustomPrompt] = useState('');
  const [indicators, setIndicators] = useState<string[]>(['EMA-50', 'Orderblock / SMC', 'RSI']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSignal, setActiveSignal] = useState<MarketSignal | null>(null);
  
  const [autoTelegram, setAutoTelegram] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');

  // Local continuous learning history base
  const [historyLogs, setHistoryLogs] = useState<MarketSignal[]>([]);

  // Load history from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem('futuresmax_analysis_history');
    if (saved) {
      try {
        setHistoryLogs(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing analysis history:', e);
      }
    }
  }, []);

  // Futures perpetual specific states
  const [leverage, setLeverage] = useState(20);
  const [isLong, setIsLong] = useState(true);

  // Live aggregated compiled metrics for UI gauges & feeding Gemini API
  const [liveMetrics, setLiveMetrics] = useState<any>(null);

  useEffect(() => {
    const pVal = parseFloat(currentPrice);
    if (pair && !isNaN(pVal) && pVal > 0) {
      try {
        const compiled = compileMarketData(pair.toUpperCase(), pVal);
        setLiveMetrics(compiled);
      } catch (err) {
        console.error('Error compiling metrics:', err);
      }
    } else {
      setLiveMetrics(null);
    }
  }, [pair, currentPrice]);

  // Sync injectedNews changes
  useEffect(() => {
    if (injectedNews) {
      setCustomPrompt((prev) => {
        if (prev.includes(injectedNews)) return prev;
        return injectedNews + "\n\n" + prev;
      });
    }
  }, [injectedNews]);

  // Sync selected asset changes from PriceFeed
  useEffect(() => {
    if (selectedAsset) {
      setPair(selectedAsset.symbol);
      setIsAutoTrack(true);
    }
  }, [selectedAsset]);

  // Sync price clicks
  useEffect(() => {
    if (selectedPrice !== null) {
      setCurrentPrice(selectedPrice.toString());
    }
  }, [selectedPrice]);

  // Auto-sync price ticks when isAutoTrack is enabled
  useEffect(() => {
    if (isAutoTrack && pair) {
      const match = prices[pair.toUpperCase().trim()];
      if (match) {
        setCurrentPrice(match.price.toString());
      }
    }
  }, [prices, pair, isAutoTrack]);

  const toggleIndicator = (name: string) => {
    setIndicators(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair) {
      setError('Mohon tentukan Pair/Aset terlebih dahulu.');
      return;
    }
    if (!currentPrice || isNaN(parseFloat(currentPrice))) {
      setError('Mohon tentukan Harga sekarang yang valid.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveSignal(null);
    setTelegramStatus('idle');

    try {
      // Map historyLogs to compact data points for Gemini learning ingestion
      const pastAnalysesPayload = historyLogs.slice(0, 5).map(h => ({
        pair: h.pair,
        type: h.type,
        style: h.style,
        entryPrice: h.entryPrice,
        takeProfit1: h.takeProfit1,
        stopLoss: h.stopLoss,
        confidence: h.confidence,
        sentiment: h.sentiment
      }));

      const compiledMetricsVal = compileMarketData(pair.toUpperCase(), parseFloat(currentPrice));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: pair.toUpperCase(),
          currentPrice: parseFloat(currentPrice),
          timeframe,
          tradingStyle,
          indicators,
          customPrompt,
          pastAnalyses: pastAnalysesPayload,
          compiledMetrics: compiledMetricsVal
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server gagal memproses analisa teknik.');
      }

      const signal: MarketSignal = data.signal;
      setActiveSignal(signal);

      // Save to localStorage so that history is stored as cumulative AI context learning
      const updatedHistory = [signal, ...historyLogs];
      setHistoryLogs(updatedHistory);
      localStorage.setItem('futuresmax_analysis_history', JSON.stringify(updatedHistory));

      onSignalGenerated(signal);

      // Trigger Auto Telegram if requested and configured
      if (autoTelegram && telegramConfig.enabled && telegramConfig.botToken && telegramConfig.chatId) {
        sendToTelegram(signal);
      }
    } catch (err: any) {
      setError(err.message || 'Kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendToTelegram = async (signalToSend: MarketSignal) => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      setTelegramStatus('failed');
      return;
    }

    setTelegramStatus('sending');
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          signal: signalToSend
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTelegramStatus('success');
      } else {
        throw new Error(data.error || 'Gagal mengirim telegram');
      }
    } catch (err) {
      console.error(err);
      setTelegramStatus('failed');
    }
  };

  const availableIndicators = [
    'EMA-50', 'EMA-200', 'RSI', 'MACD', 'Orderblock / SMC', 
    'Support / Resistance', 'Bollinger Bands', 'Volume Profile',
    'Momentum Pembalikan'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center space-x-2.5 mb-5 select-none pb-3 border-b border-slate-800/60">
          <Cpu className="text-emerald-400" size={20} />
          <div>
            <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase">FUTURESMAX COGNITIVE ENGINE</h2>
            <p className="text-[10px] text-slate-500 font-mono">GEMINI REAL-TIME QUANT DECK</p>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-5">
          {/* Pair & Price row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Simbol / Pair</label>
              <input
                type="text"
                placeholder="misal: XAUUSD, BTCUSDT"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-600 transition font-mono font-bold uppercase"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-mono text-slate-400 uppercase">Harga Sekarang</label>
                <button
                  type="button"
                  onClick={() => setIsAutoTrack(prev => !prev)}
                  className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-mono whitespace-nowrap select-none transition ${
                    isAutoTrack 
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800' 
                      : 'bg-slate-950 text-slate-500 border border-slate-800 hover:text-slate-300'
                  }`}
                  title={isAutoTrack ? "Klik untuk mematikan sinkronisasi harga live" : "Klik untuk menyalakan sinkronisasi harga live"}
                >
                  {isAutoTrack && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  )}
                  <span>{isAutoTrack ? 'LIVE AUTOPILOT' : 'KONTROL MANUAL'}</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="Harga asset live"
                value={currentPrice}
                onChange={(e) => {
                  setCurrentPrice(e.target.value);
                  setIsAutoTrack(false);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-600 transition font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Rentang Waktu / TF</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-slate-600 transition font-mono"
              >
                {['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'].map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Gaya Trading / Strategy</label>
              <select
                value={tradingStyle}
                onChange={(e) => setTradingStyle(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-slate-600 transition font-mono font-bold"
              >
                <option value="SCALP">⚡ SCALPING (Detik/Menit cepat)</option>
                <option value="DAY TRADE">📅 DAY TRADING (Intraday harian)</option>
                <option value="SWING">📈 SWING (Sedang multi-hari)</option>
                <option value="POSITION">🚀 POSITION (Hold panjang minggu/bulan)</option>
              </select>
            </div>
          </div>

          {/* Indicators Choice List */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-3">
              Indikator Bantuan Terpasang ({indicators.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {availableIndicators.map((ind) => {
                const isSelected = indicators.includes(ind);
                return (
                  <button
                    type="button"
                    key={ind}
                    onClick={() => toggleIndicator(ind)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition ${
                      isSelected 
                        ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400' 
                        : 'bg-slate-950/35 border-slate-800/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Aggregator Market Readings Panel */}
          {liveMetrics && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-4">
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-900">
                <Gauge className="text-emerald-400 animate-pulse animate-duration-3000" size={16} />
                <div>
                  <h4 className="text-xs font-mono font-bold text-white tracking-widest uppercase flex items-center space-x-1.5">
                    <span>LIVE MARKET AGGREGATOR READINGS</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-900 animate-pulse font-normal">STREAMED</span>
                  </h4>
                  <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">Metrik ini diumpankan secara presisi ke sirkuit kognitif AI saat analisis dijalankan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Technical indicators */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-3 space-y-3.5">
                  <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400 font-bold uppercase">📉 METRIK TEKNIKAL</span>
                    <span className={`px-1.5 py-0.5 text-[8px] rounded font-black ${
                      liveMetrics.technicals.trendState.includes('UPTREND') 
                        ? 'bg-emerald-950 text-emerald-400' 
                        : (liveMetrics.technicals.trendState.includes('DOWNTREND') ? 'bg-rose-950/60 text-rose-400' : 'bg-slate-800 text-slate-400')
                    }`}>{liveMetrics.technicals.trendState.replace('_', ' ')}</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    {/* RSI */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">RSI ({liveMetrics.technicals.rsi})</span>
                        <span className={`font-bold ${
                          liveMetrics.technicals.rsiStatus === 'OVERBOUGHT' ? 'text-amber-500' :
                          liveMetrics.technicals.rsiStatus === 'BULLISH' ? 'text-emerald-400' :
                          liveMetrics.technicals.rsiStatus === 'OVERSOLD' ? 'text-amber-500' :
                          liveMetrics.technicals.rsiStatus === 'BEARISH' ? 'text-rose-400' : 'text-slate-400'
                        }`}>{liveMetrics.technicals.rsiStatus}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            liveMetrics.technicals.rsi >= 70 || liveMetrics.technicals.rsi <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${liveMetrics.technicals.rsi}%` }}
                        />
                      </div>
                    </div>

                    {/* MACD */}
                    <div className="flex justify-between text-[10px] pt-1">
                      <span className="text-slate-500">Histogram MACD:</span>
                      <span className={`font-bold ${liveMetrics.technicals.macdStatus === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {liveMetrics.technicals.macdHistogram > 0 ? '+' : ''}{liveMetrics.technicals.macdHistogram.toFixed(4)}
                      </span>
                    </div>

                    {/* EMA */}
                    <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400 bg-slate-950 p-1.5 rounded border border-slate-900">
                      <div>
                        <span className="text-slate-600 block">EMA-50:</span>
                        <span className="text-slate-200 font-bold">{liveMetrics.technicals.ema50.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 block">EMA-200:</span>
                        <span className="text-slate-200 font-bold">{liveMetrics.technicals.ema200.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Sentiment metrics */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-3 space-y-3.5">
                  <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400 font-bold uppercase">🧠 SENTIMEN SENTRA</span>
                    <span className={`px-1.5 py-0.5 text-[8px] rounded font-black ${
                      liveMetrics.sentiment.fearGreedLabel.includes('GREED') 
                        ? 'bg-emerald-950 text-emerald-400' 
                        : (liveMetrics.sentiment.fearGreedLabel.includes('FEAR') ? 'bg-amber-950 text-amber-500' : 'bg-slate-800 text-slate-400')
                    }`}>{liveMetrics.sentiment.fearGreedLabel.replace('_', ' ')}</span>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    {/* Fear & Greed Gauge */}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Index Fear & Greed:</span>
                      <span className="font-extrabold text-white">{liveMetrics.sentiment.fearGreedIndex}</span>
                    </div>

                    {/* Bears vs Bulls bar */}
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                        <span className="text-emerald-400">{liveMetrics.sentiment.bullishPercentage}% Longs</span>
                        <span className="text-rose-450 text-rose-400">{liveMetrics.sentiment.bearishPercentage}% Shorts</span>
                      </div>
                      <div className="w-full bg-rose-950 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 transition-all duration-500" style={{ width: `${liveMetrics.sentiment.bullishPercentage}%` }} />
                      </div>
                    </div>

                    {/* Orderbook Ratio */}
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Rasio Bid/Ask Order:</span>
                      <span className="font-bold text-slate-300">{liveMetrics.sentiment.orderBookRatio}x</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Fundamental indicators */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1.5 mb-1.5">
                    <span className="text-slate-400 font-bold uppercase">🏢 CORE FUNDAMENTALS</span>
                    <span className="text-slate-500 text-[8px] tracking-widest font-black uppercase">F-FACTOR</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[10px] leading-tight">
                    {liveMetrics.fundamentals.map((fund: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start space-x-1 border-b border-slate-950 pb-1">
                        <span className="text-slate-500 block truncate max-w-[125px]" title={fund.label}>{fund.label}</span>
                        <span className={`font-medium text-right ${
                          fund.bias === 'bullish' ? 'text-emerald-400' :
                          fund.bias === 'bearish' ? 'text-rose-400' : 'text-slate-300'
                        }`}>{fund.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Futures Calculator Desk */}
          {pair.toUpperCase().includes('_PERP') && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5" id="futures-simulator-panel">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center space-x-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                  <span>Kalkulator Kontrak Berjangka (Futures)</span>
                </span>
                <span className="text-slate-500 font-semibold">TIPE: PERPETUAL SWAP</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Long vs Short Toggle */}
                <div>
                  <p className="text-slate-400 mb-1.5 block">Arah Posisi</p>
                  <div className="flex bg-slate-900 p-1 border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsLong(true)}
                      className={`flex-1 text-center py-1.5 rounded-md font-bold transition uppercase ${
                        isLong ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Beli / Long (🟢)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLong(false)}
                      className={`flex-1 text-center py-1.5 rounded-md font-bold transition uppercase ${
                        !isLong ? 'bg-rose-955/70 border border-rose-800 text-rose-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Jual / Short (🔴)
                    </button>
                  </div>
                </div>

                {/* Leverage Slider */}
                <div>
                  <p className="text-slate-400 mb-1.5 flex justify-between">
                    <span>Leverage Kaliber</span>
                    <span className="font-bold text-amber-400">{leverage}x</span>
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="125"
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value) || 20)}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced info panel / liquidator preview */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] sm:text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Biaya Pendanaan (Est):</span>
                  <span className="text-slate-200 block font-bold mt-0.5">+0.0125% <span className="text-[9px] text-slate-500">/ 8j</span></span>
                </div>
                <div>
                  <span className="text-slate-500 block">Margin Minimum (Est):</span>
                  <span className="text-slate-200 block font-bold mt-0.5">
                    {parseFloat(currentPrice) > 0 
                      ? (parseFloat(currentPrice) / leverage).toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : '0.00'}{' '}
                    USDT
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3 flex flex-col justify-center">
                  <span className="text-rose-400 font-bold block">Harga Likuidasi (Est):</span>
                  <span className="text-sm text-rose-400 block font-extrabold mt-0.5">
                    {parseFloat(currentPrice) > 0 
                      ? (isLong 
                          ? parseFloat(currentPrice) * (1 - 0.9 / leverage) 
                          : parseFloat(currentPrice) * (1 + 0.9 / leverage)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0.00'}{' '}
                    USDT
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Custom Market Context */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Konteks Tambahan (Opsional)</label>
            <textarea
              placeholder="Masukkan analisis pribadi, break out key level, atau rilis berita makro..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-18 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-900/40">
            {telegramConfig.enabled ? (
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoTelegram}
                  onChange={(e) => setAutoTelegram(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-400 uppercase">auto-broadcast ke Telegram</span>
              </label>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 uppercase">Integrasi Telegram Non-aktif</span>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center space-x-2 shadow-emerald-900/10"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  <span>KOGNISI SEDANG MENGALIR...</span>
                </>
              ) : (
                <>
                  <Cpu size={14} />
                  <span>JALANKAN ANALISIS TEKNIKAL</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex items-start space-x-3 text-red-400 text-xs font-mono">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase block mb-1">PROFIL KOGNISI LOG ERROR</span>
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Simulated loading progression text */}
      {isLoading && (
        <div className="p-6 bg-slate-955 bg-slate-900/40 border border-slate-800/50 rounded-xl space-y-3 font-mono text-xs text-slate-500 animate-pulse">
          <div className="flex items-center space-x-2 text-emerald-400">
            <RefreshCw className="animate-spin" size={12} />
            <span className="font-bold">STATUS OPERASI DE-COMPILING:</span>
          </div>
          <div className="pl-4 space-y-1">
            <p>✔ Membaca feed harga live {pair} di bursa...</p>
            <p>✔ Menyerap indikator terbaca: {indicators.join(', ')}...</p>
            <p>✔ Memproses sirkuit model gemini-3.5-flash...</p>
            <p className="text-slate-600">⌛ Mengenal pola Quasimodo dan supply & demand harian...</p>
          </div>
        </div>
      )}

      {/* Signal Output section */}
      <AnimatePresence>
        {activeSignal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 shadow-2xl relative"
          >
            {/* High level visual direction ribbon */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${activeSignal.type === 'BUY' ? 'bg-emerald-500' : (activeSignal.type === 'SELL' ? 'bg-rose-500' : 'bg-amber-500')}`} />

            {/* Title Block */}
            <div className="flex justify-between items-start pt-2">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-xl font-mono font-black text-white tracking-widest uppercase">{activeSignal.pair} — {activeSignal.type}</h3>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-black ${
                    activeSignal.type === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : (activeSignal.type === 'SELL' ? 'bg-rose-955 bg-rose-950/60 text-rose-400 border border-rose-900' : 'bg-slate-800 text-slate-300')
                  }`}>
                    {activeSignal.type}
                  </span>
                  <span className="text-[10px] uppercase font-mono bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                    {activeSignal.style}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">GENERATED BY FUTURESMAX DECISION SUITE</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono uppercase block mb-1">CONFIDENCE LEVEL</span>
                <span className={`text-xs uppercase font-mono font-black px-2 py-1 rounded ${
                  activeSignal.confidence === 'HIGH' ? 'bg-emerald-500 text-slate-950 font-bold' : (activeSignal.confidence === 'MEDIUM' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-rose-500 text-slate-950 font-bold')
                }`}>
                  {activeSignal.confidence}
                </span>
              </div>
            </div>

            {/* Entry target boxes */}
            {(() => {
              const isIdxStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => activeSignal.pair.toUpperCase().startsWith(s));
              const formatPriceVal = (val: number) => {
                if (isIdxStock) {
                  return 'Rp' + val.toLocaleString('id-ID', { maximumFractionDigits: 0 });
                }
                return val;
              };

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">ENTRY PRICE</p>
                    <div className="text-lg font-mono font-bold text-white mt-1.5 tracking-tight">{formatPriceVal(activeSignal.entryPrice)}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider flex items-center justify-center">
                      <CheckSquare size={10} className="mr-1" /> TARGET PROFIT 1
                    </p>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1.5 tracking-tight">{formatPriceVal(activeSignal.takeProfit1)}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider flex items-center justify-center">
                      <CheckSquare size={10} className="mr-1" /> TARGET PROFIT 2
                    </p>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1.5 tracking-tight">{formatPriceVal(activeSignal.takeProfit2)}</div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-rose-455 text-rose-400 font-mono uppercase tracking-wider">STOP LOSS</p>
                    <div className="text-lg font-mono font-bold text-rose-455 text-rose-400 mt-1.5 tracking-tight">{formatPriceVal(activeSignal.stopLoss)}</div>
                  </div>
                </div>
              );
            })()}

            {/* AI Continuous Learning Feedback Banner */}
            {activeSignal.learningFeedback && (
              <div className="mt-6 bg-gradient-to-r from-emerald-950/40 via-emerald-920/10 to-slate-950/90 border border-emerald-500/25 p-4 rounded-xl flex items-start space-x-3 shadow-lg shadow-emerald-950/10">
                <div className="p-1.5 bg-emerald-900/40 border border-emerald-500/30 text-[10px] uppercase font-mono font-black text-emerald-400 rounded-md tracking-wider flex items-center space-x-1 flex-shrink-0 animate-pulse">
                  <Cpu size={12} />
                  <span>AI LEARN</span>
                </div>
                <div>
                  <h4 className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-widest flex items-center">
                    PEMBELAJARAN MODEL BERKELANJUTAN (CONTINUOUS REINFORCEMENT)
                  </h4>
                  <p className="text-xs text-slate-350 leading-relaxed font-sans mt-0.5">
                    {activeSignal.learningFeedback}
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Rows (Indonesian) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-950/40 p-5 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-mono font-bold text-white uppercase mb-3 text-slate-300">Market Sentiment</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeSignal.sentiment}</p>
              </div>

              <div className="bg-slate-950/40 p-5 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-mono font-bold text-white uppercase mb-3 text-slate-300">Multi Timeframe Analysis</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{activeSignal.mtfAnalysis}</p>
              </div>
            </div>

            {/* Bullish & Bearish Cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-950/50 p-5 border border-slate-800 rounded-xl border-l-[3px] border-l-emerald-500">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase mb-3">Bullish Case Arguments</h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">{activeSignal.bullishCase}</p>
              </div>

              <div className="bg-slate-950/50 p-5 border border-slate-800 rounded-xl border-l-[3px] border-l-rose-500">
                <h4 className="text-xs font-mono font-bold text-rose-455 text-rose-400 uppercase mb-3">Bearish Case Arguments</h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">{activeSignal.bearishCase}</p>
              </div>
            </div>

            {/* One-shot deliberate telegram dispatcher */}
            {telegramConfig.enabled && (
              <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="text-emerald-400" size={16} />
                  <span className="text-[11px] font-mono text-slate-400">
                    Sinyal disiarkan ke Telegram: <b>Chat ID: {telegramConfig.chatId.replace(/.(?=.{4})/g, '*')}</b>
                  </span>
                </div>

                <button
                  onClick={() => sendToTelegram(activeSignal)}
                  disabled={telegramStatus === 'sending'}
                  className="px-5 py-2.5 bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-900 font-mono font-bold text-[10px] uppercase rounded-lg transition flex items-center space-x-2 cursor-pointer hover:border-slate-600 border border-transparent"
                >
                  <Send size={11} />
                  <span>
                    {telegramStatus === 'idle' && 'SIARKAN MANUAL KE TELEGRAM'}
                    {telegramStatus === 'sending' && 'MENYIARKAN INTEGRASI...'}
                    {telegramStatus === 'success' && 'SUKSES DIKIRIM!'}
                    {telegramStatus === 'failed' && 'GAGAL DISIARKAN'}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🧠 RIWAYAT & SIRKUIT PEMBELAJARAN COGNITIVE AI */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/60 mb-5">
          <div className="flex items-center space-x-2.5">
            <Cpu className="text-emerald-400" size={20} />
            <div>
              <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase">HISTORI & JURNAL BELAJAR AI (MEMORI COGNITIVE)</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Database pola kognitif lokal untuk pembelajaran AI berkelanjutan</p>
            </div>
          </div>
          {historyLogs.length > 0 && (
            <button
              onClick={() => {
                if(window.confirm("Hapus semua riwayat analisis & memori kognitif lokal?")) {
                  localStorage.removeItem('futuresmax_analysis_history');
                  setHistoryLogs([]);
                }
              }}
              className="text-[10px] text-red-400 hover:text-red-300 border border-red-900/40 bg-red-950/20 px-2.5 py-1 rounded-md font-mono font-bold transition uppercase cursor-pointer"
            >
              Reset Memori AI
            </button>
          )}
        </div>

        {historyLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            <AlertTriangle className="mx-auto mb-2 text-slate-600" size={20} />
            <p className="uppercase">Belum ada riwayat aktivitas kognitif.</p>
            <p className="text-[10px] text-slate-600 mt-1">Jalankan "Analisis Teknikal" di atas untuk menyimpan pemikiran pertama model.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Context Learning Dashboard Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/45 p-4 rounded-xl border border-slate-800/60 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-500 block uppercase text-[10px]">Ukuran Memori LTM</span>
                <span className="text-emerald-400 font-black text-sm">{historyLogs.length} Pola Analisis</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 block uppercase text-[10px]">Model Utama</span>
                <span className="text-slate-200 font-bold block">Gemini 3.5 Flash</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 block uppercase text-[10px]/tight text-slate-500">Feedback Loop</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>AKTIF & SINKRON</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 block uppercase text-[10px]">Gaya Dominan</span>
                <span className="text-slate-200 font-bold block">
                  {(() => {
                    const styles = historyLogs.map(h => h.style);
                    const mode = styles.reduce((a, b, i, arr) => 
                      (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), 
                      styles[0]
                    );
                    return mode || 'SCALP';
                  })()}
                </span>
              </div>
            </div>

            {/* List of past analyses */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {historyLogs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                return (
                  <div key={log.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col space-y-3 hover:border-slate-700 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-extrabold">{log.pair}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          log.type === 'BUY' ? 'bg-emerald-950 text-emerald-400' : (log.type === 'SELL' ? 'bg-rose-955 text-rose-400' : 'bg-slate-800 text-slate-300')
                        }`}>
                          {log.type}
                        </span>
                        <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                          {log.style}
                        </span>
                        <span className="bg-slate-900 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">
                          {log.timeframe || 'M15'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{dateStr}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-900/60 p-2.5 rounded border border-slate-900">
                      <div>
                        <span className="text-slate-500 block text-[9px]">ENTRY PRICE</span>
                        <span className="text-white font-bold">{log.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">TARGET PROFIT 1</span>
                        <span className="text-emerald-400 font-bold">{log.takeProfit1}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">STOP LOSS</span>
                        <span className="text-rose-400 font-bold">{log.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">KEPERCAYAAN</span>
                        <span className={`font-bold ${
                          log.confidence === 'HIGH' ? 'text-emerald-400' : (log.confidence === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400')
                        }`}>{log.confidence}</span>
                      </div>
                    </div>

                    {log.learningFeedback && (
                      <div className="text-xs bg-emerald-950/15 border border-emerald-950/40 rounded p-2.5 text-slate-400 font-sans leading-relaxed">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 block uppercase tracking-wider mb-0.5">🧠 Hasil Pembelajaran AI:</span>
                        {log.learningFeedback}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
