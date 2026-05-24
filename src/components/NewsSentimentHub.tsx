import React, { useState } from 'react';
import { Newspaper, Zap, Sparkles, TrendingUp, TrendingDown, Info, PlusCircle, AlertCircle } from 'lucide-react';
import { applySentimentImpact } from '../services/marketService';
import { SUPPORTED_ASSETS } from '../assetsList';
import { Asset } from '../types';

interface NewsItem {
  id: string;
  headline: string;
  sentiment: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
  impactPercent: number;
  targetAsset: string;
  category: 'Macro' | 'Regulatory' | 'Whale Trade' | 'Meme Volatility' | 'On-Chain';
  timeAgo: string;
  description: string;
}

interface NewsSentimentHubProps {
  onInjectNewsContext: (context: string) => void;
  onPriceImpactApplied: () => void;
}

export default function NewsSentimentHub({ onInjectNewsContext, onPriceImpactApplied }: NewsSentimentHubProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'simulate'>('feed');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Custom simulator form state
  const [customHeadline, setCustomHeadline] = useState('');
  const [customAsset, setCustomAsset] = useState('BTCUSDT_PERP');
  const [customSentiment, setCustomSentiment] = useState<'strong_bullish' | 'bullish' | 'bearish' | 'strong_bearish'>('bullish');
  const [customImpact, setCustomImpact] = useState(2.5);
  const [customCategory, setCustomCategory] = useState<'Macro' | 'Whale Trade' | 'Regulatory' | 'On-Chain'>('Macro');

  // Pre-configured realistic impact news
  const [newsList, setNewsList] = useState<NewsItem[]>([
    {
      id: 'news_1',
      headline: 'Akumulasi Whale Terbesar Tahun Ini Terdeteksi, $400M SOL Ditarik dari Bursa',
      sentiment: 'strong_bullish',
      impactPercent: 4.85,
      targetAsset: 'SOLUSDT_PERP',
      category: 'Whale Trade',
      timeAgo: '5m yang lalu',
      description: 'Metrik on-chain menunjukkan salah satu dompet institusional terbesar memindahkan lebih dari 2.2 juta SOL ke cold wallet untuk hodl jangka panjang.'
    },
    {
      id: 'news_2',
      headline: 'SEC Membuka Pembahasan Opsi ETF Spot ethereum Pertama di Nasdaq',
      sentiment: 'bullish',
      impactPercent: 3.10,
      targetAsset: 'ETHUSDT_PERP',
      category: 'Regulatory',
      timeAgo: '15m yang lalu',
      description: 'Langkah ini dipandang sangat positif bagi likuiditas ETH futures dan mempercepat gelombang adopsi institusional terhadap kontrak derivatif.'
    },
    {
      id: 'news_3',
      headline: 'Likuidasi Berantai Kontrak Long Menyapu $150 Juta Open Interest Bitcoin Futures',
      sentiment: 'strong_bearish',
      impactPercent: -3.80,
      targetAsset: 'BTCUSDT_PERP',
      category: 'On-Chain',
      timeAgo: '32m yang lalu',
      description: 'Volatilitas tiba-tiba memicu eksekusi forced liquidation sistematis pada akun leverage tinggi (50x-100x), menyisakan diskon pasar yang drastis.'
    },
    {
      id: 'news_4',
      headline: 'Elon Musk Tweet Gambar Maskot Doge Mengenakan Helm Astronot & Logo Bull',
      sentiment: 'strong_bullish',
      impactPercent: 9.20,
      targetAsset: 'DOGEUSDT_PERP',
      category: 'Meme Volatility',
      timeAgo: '45m yang lalu',
      description: 'Tweet singkat ini langsung menaikkan volume perdagangan ritel secara global, memicu short-squeeze pada kontrak berjangka Dogecoin.'
    },
    {
      id: 'news_5',
      headline: 'Data Makro CPI AS Rilis Lebih Tinggi di 3.1%, Ekspektasi Pemangkasan Suku Bunga Tertunda',
      sentiment: 'bearish',
      impactPercent: -1.75,
      targetAsset: 'XAUUSD',
      category: 'Macro',
      timeAgo: '1j yang lalu',
      description: 'Dolar AS menguat tajam merespons ekspektasi suku bunga tinggi tetap bertahan lama, menyebabkan aksi jual jangka pendek pada Emas dan Ekuitas.'
    }
  ]);

  const handleApplyShock = (item: NewsItem) => {
    applySentimentImpact(item.targetAsset, item.impactPercent);
    onPriceImpactApplied(); // Notify parent to refresh price displays

    setAlertMessage(`⚡ Berhasil Menerapkan Dampak Sentimen Ke ${item.targetAsset} Sebesar ${item.impactPercent > 0 ? '+' : ''}${item.impactPercent}%`);
    setTimeout(() => setAlertMessage(null), 3500);
  };

  const handleInjectPrompt = (item: NewsItem) => {
    const formattedContext = `[ANALISIS SENTIMEN REAL-TIME]
Berita Utama: ${item.headline}
Kategori Berita: ${item.category}
Sentimen Analis: ${item.sentiment.replace('_', ' ').toUpperCase()} (${item.impactPercent > 0 ? '+' : ''}${item.impactPercent}%)
Rincian Dampak: ${item.description}`;
    
    onInjectNewsContext(formattedContext);
    
    setAlertMessage(`✨ Analisis Berita Dimuat ke Prompt Kustom AI Analyzer Anda!`);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleCreateCustomNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHeadline.trim()) return;

    const actualImpact = (customSentiment === 'bearish' || customSentiment === 'strong_bearish') 
      ? -Math.abs(customImpact) 
      : Math.abs(customImpact);

    const newItem: NewsItem = {
      id: `custom_${Date.now()}`,
      headline: customHeadline,
      sentiment: customSentiment,
      impactPercent: actualImpact,
      targetAsset: customAsset,
      category: customCategory,
      timeAgo: 'Baru saja',
      description: `Skenario simulasi buatan agen pengguna untuk mengevaluasi volatilitas target ${customAsset} dalam model shock cognitive AI.`
    };

    setNewsList(prev => [newItem, ...prev]);
    setCustomHeadline('');
    setActiveTab('feed');

    setAlertMessage(`📰 Berita berhasil diformulasikan! Silakan terapkan pasar atau analisis.`);
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case 'strong_bullish':
        return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400';
      case 'bullish':
        return 'bg-teal-950/60 border-teal-500/40 text-teal-300';
      case 'bearish':
        return 'bg-rose-950/60 border-rose-500/40 text-rose-300';
      case 'strong_bearish':
        return 'bg-red-950/80 border-red-500/50 text-rose-400';
      default:
        return 'bg-slate-900 border-slate-700 text-slate-400';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    return sentiment.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col" id="news-sentiment-panel">
      {/* Header Block */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Newspaper className="text-emerald-400" size={18} />
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase">SENTIMENT & SHOCKS HUB</h2>
        </div>

        <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition ${
              activeTab === 'feed' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Feed Berita
          </button>
          <button
            onClick={() => setActiveTab('simulate')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition ${
              activeTab === 'simulate' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Formulasi Shock
          </button>
        </div>
      </div>

      {/* Floating System Alert message inside container */}
      {alertMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 rounded-lg p-2.5 mb-4 text-[11px] font-mono text-emerald-400 flex items-center space-x-2 animate-pulse">
          <Sparkles size={14} className="flex-shrink-0 animate-bounce" />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Main Tab View contents */}
      {activeTab === 'feed' ? (
        <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center bg-slate-950/40 p-2 rounded-lg border border-slate-900">
            <Info size={12} className="mr-1.5 flex-shrink-0 text-amber-500" />
            <span>Klik <strong>Dampak Harga</strong> untuk memicu shock volatilitas seketika, atau <strong>AI Konteks</strong> untuk memuat data analisis ke robot Gemini.</span>
          </div>

          {newsList.map((news) => {
            const isPositive = news.impactPercent > 0;
            return (
              <div
                key={news.id}
                className="bg-slate-950/80 border border-slate-850/60 p-3 rounded-xl hover:border-slate-750 transition flex flex-col space-y-2 relative"
              >
                {/* Meta details */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-slate-400">
                      {news.category}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{news.timeAgo}</span>
                  </div>
                  
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold ${getSentimentStyle(news.sentiment)}`}>
                    {getSentimentLabel(news.sentiment)} ({isPositive ? '+' : ''}{news.impactPercent.toFixed(2)}%)
                  </span>
                </div>

                {/* Headline and details */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition leading-relaxed">
                    {news.headline}
                  </h3>
                  <p className="text-[10px] text-slate-450 text-slate-400 mt-1 leading-normal font-sans">
                    {news.description}
                  </p>
                </div>

                {/* Targeting and triggers */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    TARGET: <span className="text-amber-400">{news.targetAsset}</span>
                  </span>

                  <div className="flex space-x-1.5">
                    <button
                      onClick={() => handleApplyShock(news)}
                      className="flex items-center text-[9px] px-2 py-1 bg-slate-900 hover:bg-emerald-950 border border-slate-850 hover:border-emerald-700/50 text-slate-350 hover:text-emerald-400 transition rounded-lg font-mono font-bold"
                      title="Guncang harga live feed"
                    >
                      <Zap size={10} className="mr-1" />
                      Dampak Harga
                    </button>

                    <button
                      onClick={() => handleInjectPrompt(news)}
                      className="flex items-center text-[9px] px-2 py-1 bg-slate-900 hover:bg-blue-950 border border-slate-850 hover:border-blue-700/50 text-slate-350 hover:text-blue-400 transition rounded-lg font-mono font-bold"
                      title="Bawa konteks berita ini ke model robot prompt kustom"
                    >
                      <Sparkles size={10} className="mr-1" />
                      AI Konteks
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleCreateCustomNews} className="space-y-4 text-xs font-mono">
          <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-lg text-slate-450 text-slate-400 flex items-start space-x-2">
            <AlertCircle size={14} className="text-amber-500 m-0.5 flex-shrink-0" />
            <p className="leading-normal text-[10px]">
              Tulis berita buatan Anda untuk menguji hipotesis sentimen AI. Anda dapat membuat pair bergoyang tajam untuk simulasi trading.
            </p>
          </div>

          <div>
            <label className="block text-slate-400 mb-1.5">Headline Berita utama *</label>
            <input
              type="text"
              required
              placeholder="Contoh: IMF Memuji Regulasi Pembayaran digital Indonesia..."
              value={customHeadline}
              onChange={(e) => setCustomHeadline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-slate-600 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1.5">Target Asset</label>
              <select
                value={customAsset}
                onChange={(e) => setCustomAsset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-slate-600 transition"
              >
                {SUPPORTED_ASSETS.map(asset => (
                  <option key={asset.symbol} value={asset.symbol}>
                    {asset.symbol} ({asset.name.split(' / ')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">Kategori</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-slate-600 transition"
              >
                <option value="Macro">Macroeconomics</option>
                <option value="Whale Trade">Whale Trader</option>
                <option value="Regulatory">Regulatory</option>
                <option value="On-Chain">Metric On-Chain</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1.5">Arah Sentimen</label>
              <select
                value={customSentiment}
                onChange={(e) => setCustomSentiment(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-slate-600 transition"
              >
                <option value="strong_bullish">Strong Bullish (🟢)</option>
                <option value="bullish">Bullish (teal)</option>
                <option value="bearish">Bearish (orange)</option>
                <option value="strong_bearish">Strong Bearish (🔴)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">Persentase Shock (%)</label>
              <input
                type="number"
                min="0.1"
                max="25"
                step="0.05"
                value={customImpact}
                onChange={(e) => setCustomImpact(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-slate-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded-lg font-bold transition shadow-sm"
          >
            <PlusCircle size={16} />
            <span>Formulasikan Berita</span>
          </button>
        </form>
      )}

      {/* Footer indicator */}
      <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>SUMBER INFORMASI: SENTINEL AI REUTERS</span>
        <span>INTEGRITAS: 96.4%</span>
      </div>
    </div>
  );
}
