import React, { useState, useEffect } from 'react';
import { Asset, MarketSignal, TelegramConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, Send, CheckSquare, 
  HelpCircle, AlertTriangle, ShieldCheck, Cpu, ChevronRight, CheckCircle2 
} from 'lucide-react';

interface TechnicalAnalyzerProps {
  selectedAsset: Asset | null;
  selectedPrice: number | null;
  telegramConfig: TelegramConfig;
  onSignalGenerated: (newSignal: MarketSignal) => void;
}

export default function TechnicalAnalyzer({ selectedAsset, selectedPrice, telegramConfig, onSignalGenerated }: TechnicalAnalyzerProps) {
  const [pair, setPair] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [timeframe, setTimeframe] = useState('M15');
  const [customPrompt, setCustomPrompt] = useState('');
  const [indicators, setIndicators] = useState<string[]>(['EMA-50', 'Orderblock / SMC', 'RSI']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSignal, setActiveSignal] = useState<MarketSignal | null>(null);
  
  const [autoTelegram, setAutoTelegram] = useState(true);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');

  // Sync selected asset changes from PriceFeed
  useEffect(() => {
    if (selectedAsset) {
      setPair(selectedAsset.symbol);
    }
  }, [selectedAsset]);

  // Sync price clicks
  useEffect(() => {
    if (selectedPrice !== null) {
      setCurrentPrice(selectedPrice.toString());
    }
  }, [selectedPrice]);

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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: pair.toUpperCase(),
          currentPrice: parseFloat(currentPrice),
          timeframe,
          indicators,
          customPrompt
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server gagal memproses analisa teknik.');
      }

      const signal: MarketSignal = data.signal;
      setActiveSignal(signal);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Harga Sekarang</label>
              <input
                type="text"
                placeholder="Harga asset live"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
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
    </div>
  );
}
