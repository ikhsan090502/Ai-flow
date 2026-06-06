import React, { useState, useEffect } from 'react';
import { TradeJournalEntry } from '../types';
import { SUPPORTED_ASSETS } from '../assetsList';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Edit, 
  Save, 
  HelpCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ListOrdered,
  BookMarked,
  Sparkles,
  ClipboardCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function TradeJournal({ prices }: { prices?: Record<string, { price: number; change24h: number }> }) {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Synchronize component-level livePrices with real-time websocket prices from App.tsx
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      setLivePrices(prices);
    }
  }, [prices]);
  
  // Form State
  const [pair, setPair] = useState('BTCUSDT');
  const [customPair, setCustomPair] = useState('');
  const [useCustomPair, setUseCustomPair] = useState(false);
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('CLOSED');
  const [entryReason, setEntryReason] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [pnl, setPnl] = useState('');
  const [notes, setNotes] = useState('');

  // Live Price Confirmation States
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  const fetchLivePriceConfirmation = async () => {
    setIsLoadingPrice(true);
    try {
      const res = await fetch('/api/market/prices');
      if (res.ok) {
        const data = await res.json();
        setLivePrices(data);
      }
    } catch (err) {
      console.error('Error fetching live confirmation prices:', err);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    if (showAddForm) {
      fetchLivePriceConfirmation();
      const interval = setInterval(fetchLivePriceConfirmation, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [showAddForm, pair, useCustomPair, customPair]);

  const handleFillPrice = (target: 'entry' | 'exit') => {
    const activePair = useCustomPair ? customPair.toUpperCase().trim() : pair;
    const match = livePrices[activePair];
    if (match && match.price !== undefined) {
      if (target === 'entry') {
        setEntryPrice(match.price.toString());
      } else {
        setExitPrice(match.price.toString());
      }
    } else {
      // try to fetch on demand
      fetch('/api/market/prices')
        .then(res => res.json())
        .then(data => {
          setLivePrices(data);
          const freshMatch = data[activePair];
          if (freshMatch && freshMatch.price !== undefined) {
            if (target === 'entry') {
              setEntryPrice(freshMatch.price.toString());
            } else {
              setExitPrice(freshMatch.price.toString());
            }
          } else {
            alert(`Harga live untuk ${activePair} belum tersedia di cache server. Pastikan penulisan simbol benar dan silakan isi secara manual.`);
          }
        })
        .catch(err => {
          alert('Gagal mengambil data live price dari server proxy.');
        });
    }
  };

  // Active AI review focus state
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  // Load entries from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('fm_trade_journal');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved trade journal:', e);
      }
    }
  }, []);

  // Save entries back to localStorage on change
  const saveToStorage = (updatedList: TradeJournalEntry[]) => {
    setEntries(updatedList);
    localStorage.setItem('fm_trade_journal', JSON.stringify(updatedList));
  };

  // Reset Form fields
  const resetForm = () => {
    setPair('BTCUSDT');
    setCustomPair('');
    setUseCustomPair(false);
    setType('BUY');
    setEntryPrice('');
    setExitPrice('');
    setStatus('CLOSED');
    setEntryReason('');
    setExitReason('');
    setPnl('');
    setNotes('');
    setEditingId(null);
  };

  // Create or Update Entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPair = useCustomPair ? customPair.toUpperCase().trim() : pair;
    if (!finalPair) {
      alert('Tolong masukkan simbol pasangan aset (misalnya: BTCUSDT).');
      return;
    }

    if (!entryPrice || isNaN(Number(entryPrice))) {
      alert('Tolong masukkan harga masuk (entry price) yang valid.');
      return;
    }

    if (!entryReason.trim()) {
      alert('Tolong berikan alasan masuk (entry reason) trading ini.');
      return;
    }

    if (editingId) {
      // Update Mode
      const updated = entries.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            pair: finalPair,
            type,
            entryPrice: Number(entryPrice),
            exitPrice: exitPrice ? Number(exitPrice) : undefined,
            status,
            entryReason,
            exitReason: exitReason || undefined,
            pnl: pnl ? Number(pnl) : undefined,
            notes: notes || undefined
          };
        }
        return item;
      });
      saveToStorage(updated);
      setEditingId(null);
      setShowAddForm(false);
      resetForm();
    } else {
      // Create Mode
      const newEntry: TradeJournalEntry = {
        id: 'journal-' + Date.now(),
        pair: finalPair,
        type,
        entryPrice: Number(entryPrice),
        exitPrice: exitPrice ? Number(exitPrice) : undefined,
        status,
        entryReason,
        exitReason: exitReason || undefined,
        pnl: pnl ? Number(pnl) : undefined,
        notes: notes || undefined,
        createdAt: Date.now()
      };
      
      saveToStorage([newEntry, ...entries]);
      setShowAddForm(false);
      resetForm();
    }
  };

  // Populate form for editing
  const handleEdit = (entry: TradeJournalEntry) => {
    setEditingId(entry.id);
    
    // Check if pair matches supported assets or is custom
    const isSupported = SUPPORTED_ASSETS.some(a => a.symbol === entry.pair);
    if (isSupported) {
      setPair(entry.pair);
      setUseCustomPair(false);
    } else {
      setCustomPair(entry.pair);
      setUseCustomPair(true);
    }

    setType(entry.type);
    setEntryPrice(entry.entryPrice.toString());
    setExitPrice(entry.exitPrice ? entry.exitPrice.toString() : '');
    setStatus(entry.status);
    setEntryReason(entry.entryReason);
    setExitReason(entry.exitReason || '');
    setPnl(entry.pnl !== undefined ? entry.pnl.toString() : '');
    setNotes(entry.notes || '');
    
    setShowAddForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Delete Entry
  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus catatan jurnal ini?')) {
      const filtered = entries.filter(item => item.id !== id);
      saveToStorage(filtered);
      if (activeReviewId === id) {
        setActiveReviewId(null);
      }
    }
  };

  // Call server-side Gemini Review endpoint
  const requestAiReview = async (entry: TradeJournalEntry) => {
    setAiLoadingId(entry.id);
    setAiError(null);
    
    try {
      const response = await fetch('/api/ai-flow/review-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pair: entry.pair,
          type: entry.type,
          entryPrice: entry.entryPrice,
          exitPrice: entry.exitPrice,
          status: entry.status,
          entryReason: entry.entryReason,
          exitReason: entry.exitReason,
          pnl: entry.pnl,
          notes: entry.notes
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem saat meminta ulasan AI.');
      }

      // Inject AI review into this entry and save
      const updated = entries.map(item => {
        if (item.id === entry.id) {
          return {
            ...item,
            aiReview: data.aiReview
          };
        }
        return item;
      });

      saveToStorage(updated);
      setActiveReviewId(entry.id);
    } catch (err: any) {
      console.error('AI Review Error:', err);
      setAiError(err.message || 'Gagal berkomunikasi dengan server AI.');
    } finally {
      setAiLoadingId(null);
    }
  };

  // Stats Counters
  const totalTrades = entries.length;
  const wins = entries.filter(e => e.pnl !== undefined && e.pnl > 0).length;
  const losses = entries.filter(e => e.pnl !== undefined && e.pnl < 0).length;
  const winRate = totalTrades > 0 && (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  
  const totalPnl = entries.reduce((acc, curr) => {
    return curr.pnl !== undefined ? acc + curr.pnl : acc;
  }, 0);

  const buyCount = entries.filter(e => e.type === 'BUY').length;
  const sellCount = entries.filter(e => e.type === 'SELL').length;

  // Custom inline Markdown Renderer
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-mono font-black text-white uppercase tracking-wider mt-5 mb-2.5 flex items-center border-b border-slate-800/80 pb-1.5">
            <Sparkles size={11} className="text-emerald-400 mr-1.5 shrink-0 animate-pulse" />
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-mono font-extrabold text-emerald-450 text-emerald-400 mt-6 mb-3">
            {line.slice(3)}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-base font-mono font-black text-teal-400 mt-6 mb-4">
            {line.slice(2)}
          </h2>
        );
      }
      
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        return (
          <div key={idx} className="flex items-start space-x-2 my-2 text-slate-350 text-xs leading-relaxed pl-1">
            <span className="text-teal-400 mt-1.5 shrink-0 text-[10px]">■</span>
            <span>{parseBoldMarkdown(content)}</span>
          </div>
        );
      }

      if (trimmed === '') {
        return <div key={idx} className="h-2.5" />;
      }

      return (
        <p key={idx} className="text-slate-300 text-xs font-sans leading-relaxed my-2">
          {parseBoldMarkdown(line)}
        </p>
      );
    });
  };

  const parseBoldMarkdown = (text: string) => {
    const parts = text.split('**');
    if (parts.length <= 1) return text;
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-emerald-300 font-extrabold font-mono">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
      {/* Tab Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <BookMarked size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase font-mono tracking-wider">Jurnal Perdagangan Manusia</h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">Catat strategi, evaluasi ulasan, & asah kedisplinan dibimbing AI Gemini</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (showAddForm) {
              resetForm();
            }
            setShowAddForm(!showAddForm);
          }}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold uppercase transition border ${
            showAddForm 
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40' 
              : 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
          }`}
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'Tutup Formulir' : 'Catat Transaksi'}</span>
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-850 bg-slate-950/40 divide-x divide-y lg:divide-y-0 divide-slate-800/60 font-mono">
        <div className="p-4 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 font-bold uppercase">TOTAL JURNAL TERESET</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl font-extrabold text-white">{totalTrades}</span>
            <span className="text-[10px] text-slate-550 text-slate-500">TRANSAKSI</span>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 font-bold uppercase">WIN RATE PERSENTASE</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-xl font-extrabold ${winRate >= 50 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {winRate}%
            </span>
            <span className="text-[10px] text-slate-500">
              ({wins}W - {losses}L)
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 font-bold uppercase">AKUMULASI ESTIMASI PNL</span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className={`text-xl font-extrabold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl}
            </span>
            <span className="text-[10px] text-slate-500">POIN/USD</span>
          </div>
        </div>

        <div className="p-4 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 font-bold uppercase">PROPORSI AKSI BUY / SELL</span>
          <div className="flex items-center space-x-3 mt-1.5 text-xs">
            <span className="text-emerald-400 flex items-center space-x-1">
              <TrendingUp size={12} />
              <b>BUY: {buyCount}</b>
            </span>
            <span className="text-rose-400 flex items-center space-x-1">
              <TrendingDown size={12} />
              <b>SELL: {sellCount}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-950/70 border-b border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 pb-1 border-b border-slate-900 select-none">
            <BookOpen size={14} className="text-emerald-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              {editingId ? 'EDIT CATATAN JURNAL INVESTASI' : 'REKAM CATATAN TRANSAKSI BARU'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Pair Asset Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <label className="text-slate-400 font-bold">ASSET PAIR / SIMBOL</label>
                <button
                  type="button"
                  onClick={() => setUseCustomPair(!useCustomPair)}
                  className="text-emerald-400 hover:underline font-extrabold text-[9px]"
                >
                  {useCustomPair ? ' pilih dari daftar' : ' tulis custom'}
                </button>
              </div>

              {useCustomPair ? (
                <input
                  type="text"
                  placeholder="Contoh: BTCUSDT atau EURUSD"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <select
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                >
                  {SUPPORTED_ASSETS.map(asset => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* BUY or SELL */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 font-bold block">TIPE TRANSAKSI</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  className={`py-2 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center space-x-1 border ${
                    type === 'BUY'
                      ? 'bg-emerald-950/40 border-emerald-555 border-emerald-500 text-emerald-450 font-black'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>BUY</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  className={`py-2 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center space-x-1 border ${
                    type === 'SELL'
                      ? 'bg-rose-950/40 border-rose-555 border-rose-500 text-rose-455 font-black'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingDown size={13} />
                  <span>SELL</span>
                </button>
              </div>
            </div>

            {/* STATUS Trade */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 font-bold block">STATUS AKTIFNYA TRADE</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('OPEN')}
                  className={`py-2 rounded-lg font-mono text-xs font-bold border ${
                    status === 'OPEN'
                      ? 'bg-sky-950/40 border-sky-500 text-sky-400 font-black'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  🔒 TERBUKA (OPEN)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('CLOSED')}
                  className={`py-2 rounded-lg font-mono text-xs font-bold border ${
                    status === 'CLOSED'
                      ? 'bg-slate-800 border-slate-700 text-slate-200 font-black'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  ✔ SELESAI (CLOSED)
                </button>
              </div>
            </div>

            {/* ENTRY PRICE */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <label className="text-slate-400 font-bold block">HARGA ENTRY</label>
                <button
                  type="button"
                  onClick={() => handleFillPrice('entry')}
                  className="text-emerald-400 hover:text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-0.5"
                  title="Ambil harga langsung dari real-market feed saat ini"
                >
                  ⚡ Ambil
                </button>
              </div>
              <input
                type="text"
                placeholder="Entry Price"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Real-Market Price Info Indicator */}
          {(() => {
            const activePair = useCustomPair ? customPair.toUpperCase().trim() : pair;
            const assetInfo = SUPPORTED_ASSETS.find(a => a.symbol === activePair);
            const liveData = livePrices[activePair];
            return (
              <div className="bg-slate-900/50 border border-slate-850/70 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-400">Konfirmasi Real-Market ({activePair}):</span>
                  <span className="text-white font-extrabold bg-slate-950 px-2 py-0.5 rounded text-[10px]">
                    {assetInfo ? (assetInfo.type === 'crypto' || assetInfo.type === 'crypto_futures' ? 'Binance API Feed' : assetInfo.type === 'stock' ? 'Yahoo IDX Feed' : 'Alpha Vantage / FX Feed') : 'Custom Input'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-slate-400">Harga Terkini:</span>
                  <span className="text-emerald-400 font-black text-sm tracking-tight">
                    {liveData ? `${liveData.price.toLocaleString('en-US', { maximumFractionDigits: 4 })}` : 'Memuat harga...'}
                  </span>
                  {liveData && liveData.change24h !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${liveData.change24h >= 0 ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'}`}>
                      {liveData.change24h >= 0 ? '+' : ''}{liveData.change24h}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={fetchLivePriceConfirmation}
                    className="p-1 px-1.5 text-[10px] text-slate-300 hover:text-emerald-400 bg-slate-950 border border-slate-800 rounded flex items-center gap-1 hover:border-emerald-500/20"
                    title="Segarkan harga live dari server"
                  >
                    🔄 Segarkan
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* EXIT PRICE */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <label className="text-slate-400 font-bold block">HARGA EXIT (OPSIONAL)</label>
                {status !== 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => handleFillPrice('exit')}
                    className="text-emerald-400 hover:text-emerald-300 font-extrabold text-[9px] uppercase tracking-wider flex items-center gap-0.5"
                    title="Ambil harga langsung dari real-market feed saat ini"
                  >
                    ⚡ Ambil
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Exit Price (Kosongkan jika OPEN)"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                disabled={status === 'OPEN'}
                className="w-full bg-slate-900 border border-slate-850 disabled:opacity-40 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* PNL ESTIMASI */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 font-bold block">UNTUNG/RUGI NOMINAL/POIN (OPSIONAL)</label>
              <input
                type="text"
                placeholder="Contoh: 150 atau -45 (Minus jika rugi)"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                disabled={status === 'OPEN'}
                className="w-full bg-slate-900 border border-slate-850 disabled:opacity-40 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* NOTES */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 font-bold block">CATATAN TAMBAHAN (OPSIONAL)</label>
              <input
                type="text"
                placeholder="E.g., slippage deviasi, target psikologis tercapai"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reasons Texts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 font-bold block">ALASAN MASUK (ENTRY REASON) *Wajib</label>
              <textarea
                rows={3}
                placeholder="E.g., Bullish Order Block di timeframe M15 terkonfirmasi dengan Candle Harami. RSI berbalik arah ke atas dari level jenuh jual (oversold)."
                value={entryReason}
                onChange={(e) => setEntryReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 font-bold block">ALASAN KELUAR (EXIT REASON) (OPSIONAL)</label>
              <textarea
                rows={3}
                placeholder="E.g., Menyentuh Take Profit 1 secara otomatis di level resistensi statis. Atau melakukan pemotongan manual (cut-loss) karena tren berbelok tajam."
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                disabled={status === 'OPEN'}
                className="w-full bg-slate-900 border border-slate-850 disabled:opacity-40 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="px-4 py-2 rounded-lg font-mono text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black uppercase px-5 py-2 rounded-lg shadow-md flex items-center space-x-1.5"
            >
              <Save size={14} />
              <span>{editingId ? 'Simpan Perubahan' : 'Rekam Jurnal Sekarang'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Journal Dashboard Grid Splitter */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Journal Entry List (Grid 7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 select-none">
            <span className="text-xs font-mono font-bold text-slate-400 flex items-center space-x-1.5">
              <ListOrdered size={14} className="text-emerald-500" />
              <span>DAFTAR HARIAN JURNAL</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono uppercase">LOKAL DATABASE AKTIF</span>
          </div>

          {entries.length === 0 ? (
            <div className="bg-slate-950/20 rounded-xl border border-slate-800/60 p-10 text-center space-y-3">
              <BookOpen size={36} className="text-slate-700 mx-auto" />
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-350 uppercase">BELUM ADA JURNAL TERCATAT</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Tuliskan rencana trading, alasan masuk pasar, dan pemicu psikologis Anda untuk dianalisis oleh AI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-950 hover:text-emerald-350 transition px-4 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase inline-block"
              >
                + Mulai Mencatat Jurnal Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {entries.map((entry) => {
                const isSelectedForReview = activeReviewId === entry.id;
                const isLoss = entry.pnl !== undefined && entry.pnl < 0;
                const dateStr = new Date(entry.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) + ' WIB';

                return (
                  <div 
                    key={entry.id}
                    className={`bg-slate-950 border rounded-xl overflow-hidden transition-all duration-300 ${
                      isSelectedForReview 
                        ? 'border-emerald-500 ring-1 ring-emerald-505/20 bg-slate-950/90' 
                        : 'border-slate-800 hover:border-slate-700/80 bg-slate-950/50'
                    }`}
                  >
                    {/* Header bar of entry */}
                    <div className="bg-slate-900/60 border-b border-slate-850 px-4 py-3 flex items-center justify-between flex-wrap gap-2 select-none">
                      <div className="flex items-center space-x-2.5">
                        <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded leading-none ${
                          entry.type === 'BUY'
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-450 text-rose-400'
                        }`}>
                          {entry.type}
                        </span>
                        
                        <span className="text-xs font-mono font-black text-white">{entry.pair}</span>
                        
                        <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                          <Clock size={11} />
                          <span>{dateStr}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {entry.status === 'OPEN' ? (
                          <span className="text-[10.5px] font-semibold text-sky-400 bg-sky-950/10 px-1.5 py-0.5 rounded border border-sky-900/30 font-mono">
                            🖹 TERBUKA
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 font-mono">
                            ✔ SELESAI
                          </span>
                        )}

                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-slate-500 hover:text-white p-1 transition"
                          title="Ubah Jurnal"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition"
                          title="Hapus Jurnal"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3">
                      {/* Grid Prices */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">HARGA ENTRY:</span>
                          <span className="text-slate-200 font-bold">{entry.entryPrice}</span>
                        </div>
                        {entry.status === 'CLOSED' && (
                          <>
                            <div>
                              <span className="text-slate-500 block text-[9.5px]">HARGA EXIT:</span>
                              <span className="text-slate-200 font-bold">{entry.exitPrice || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9.5px]">RESULT PNL:</span>
                              {entry.pnl !== undefined ? (
                                <span className={`font-black ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {entry.pnl >= 0 ? '+' : ''}{entry.pnl} Pips/USD
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Entry reasons */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-emerald-450 text-emerald-400 font-bold block uppercase tracking-wider">
                          ■ Alasan Entry (Rencana Sinyal)
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/10 border border-slate-850/40 p-2.5 rounded-lg whitespace-pre-wrap">
                          {entry.entryReason}
                        </p>
                      </div>

                      {entry.exitReason && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-450 block uppercase tracking-wider font-bold">
                            ■ Alasan Exit (Laporan Keluar)
                          </span>
                          <p className="text-xs text-slate-350 leading-relaxed bg-slate-900/10 border border-slate-850/40 p-2.5 rounded-lg whitespace-pre-wrap">
                            {entry.exitReason}
                          </p>
                        </div>
                      )}

                      {entry.notes && (
                        <div className="text-[10.5px] text-slate-400 italic bg-slate-900/5 px-2 py-1 rounded border border-slate-850/30">
                          💡 Catatan: {entry.notes}
                        </div>
                      )}

                      {/* AI Review trigger and display triggers */}
                      <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
                        {entry.aiReview ? (
                          <button
                            onClick={() => {
                              if (activeReviewId === entry.id) {
                                setActiveReviewId(null);
                              } else {
                                setActiveReviewId(entry.id);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }
                            }}
                            className={`w-full sm:w-auto px-4 py-1.5 rounded-lg font-mono text-[10.5px] font-black uppercase text-center border transition flex items-center justify-center space-x-1.5 ${
                              isSelectedForReview
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-850'
                            }`}
                          >
                            <BrainCircuit size={13} className="animate-pulse" />
                            <span>{isSelectedForReview ? 'Sedang Ditampilkan 🡒' : 'Tampilkan Analisis Mentor AI'}</span>
                          </button>
                        ) : (
                          <div className="w-full sm:w-auto text-[10px] text-slate-500 italic flex items-center space-x-1.5 select-none">
                            <Sparkles size={11} className="text-slate-600" />
                            <span>AI Post-Trade Review tersedia untuk ulasan mentor</span>
                          </div>
                        )}

                        <button
                          onClick={() => requestAiReview(entry)}
                          disabled={aiLoadingId !== null}
                          className="w-full sm:w-auto bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 hover:from-emerald-900/50 hover:via-slate-950 hover:to-emerald-900/50 text-emerald-400 border border-emerald-500/20 rounded-lg py-1.5 px-4 font-mono text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 transition disabled:opacity-45"
                        >
                          {aiLoadingId === entry.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                              <span className="animate-pulse">Menghubungkan AI Gemini...</span>
                            </>
                          ) : (
                            <>
                              <BrainCircuit size={13} />
                              <span>{entry.aiReview ? 'Re-Evaluasi Mentor AI 🧠' : 'Minta Post-Trade Review AI 🧠'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: AI Post-Trade Review Panel (Grid 5 cols) */}
        <div className="xl:col-span-5 bg-slate-950 rounded-xl p-5 border border-slate-850 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-850 pb-3 select-none">
            <div className="py-1 px-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
              <BrainCircuit size={15} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-black text-white uppercase tracking-wider">AI POST-TRADE REVIEW MENTOR</h3>
              <p className="text-[9.5px] text-slate-550 text-slate-500 font-mono mt-0.5 uppercase">Ulasan Mentor Trading Kognitif Berbasis Gemini 3.5</p>
            </div>
          </div>

          {/* AI Request and Error Status messages */}
          {aiError && (
            <div className="p-3.5 bg-rose-950/30 border border-rose-500/25 rounded-lg text-rose-350 text-xs font-mono flex items-start space-x-2">
              <AlertTriangle className="shrink-0 text-rose-400 mt-0.5" size={14} />
              <div>
                <b>KESALAHAN OPERASIONAL AI:</b>
                <p className="text-[11px] text-rose-250 mt-1">{aiError}</p>
              </div>
            </div>
          )}

          {/* Core display */}
          {aiLoadingId !== null ? (
            <div className="py-12 px-4 text-center space-y-4 font-mono select-none">
              <BrainCircuit className="text-emerald-400 animate-spin mx-auto text-emerald-505" size={32} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider animate-pulse">MEMPROSES DATA JURNAL...</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Gemini sedang menyerap strategi masuk, performa PnL, analisa teknis, dan catatan psikologismu untuk formulasi mentor trading...
                </p>
              </div>
              
              {/* Shimmer layout */}
              <div className="space-y-2 mt-6 pt-4 border-t border-slate-900">
                <div className="h-5 bg-slate-900 rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-slate-900 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-900 rounded w-5/6 animate-pulse" />
                <div className="h-3 bg-slate-900 rounded w-4/5 animate-pulse" />
                <div className="h-5 bg-slate-900 rounded w-1/2 animate-pulse pt-4" />
                <div className="h-3 bg-slate-900 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-900 rounded w-11/12 animate-pulse" />
              </div>
            </div>
          ) : activeReviewId ? (
            (() => {
              const selectedEntry = entries.find(e => e.id === activeReviewId);
              if (!selectedEntry || !selectedEntry.aiReview) {
                return (
                  <div className="py-10 text-center text-xs text-slate-500 italic">
                    Ulasan tidak ditemukan untuk entri ini. Silakan klik "Minta Post-Trade Review AI" di sisi kiri.
                  </div>
                );
              }

              return (
                <div className="animate-fade-in space-y-4">
                  {/* Summary of what is being reviewed */}
                  <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-center justify-between font-mono text-[10.5px]">
                    <div>
                      <span className="text-slate-500 uppercase">MENINJAU ASET:</span>
                      <strong className="text-white block mt-0.5">{selectedEntry.type} {selectedEntry.pair}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 uppercase">AKUMULASI PNL:</span>
                      <strong className={`block mt-0.5 ${selectedEntry.pnl !== undefined && selectedEntry.pnl < 0 ? 'text-rose-400' : 'text-emerald-450 text-emerald-400'}`}>
                        {selectedEntry.pnl !== undefined ? `${selectedEntry.pnl >= 0 ? '+' : ''}${selectedEntry.pnl} Poin` : 'TERBUKA'}
                      </strong>
                    </div>
                  </div>

                  {/* Render the actual Markdown review */}
                  <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-2 bg-gradient-to-b from-slate-950 via-slate-900/20 to-slate-950">
                    {renderMarkdownText(selectedEntry.aiReview)}
                  </div>

                  {/* Copy Button */}
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-550 text-slate-500 pt-1 select-none">
                    <span>SISTEM INTEL INTELLIGENCE CLAUDE API</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEntry.aiReview || '');
                        alert('Post-trade review AI berhasil disalin ke clipboard!');
                      }}
                      className="bg-emerald-950/20 border border-emerald-500/15 hover:border-emerald-500/30 px-2.5 py-1 text-emerald-400 font-bold rounded"
                    >
                      Salin Ulasan ⎘
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-16 px-4 text-center space-y-4 select-none">
              <HelpCircle className="text-slate-700 animate-pulse mx-auto" size={32} />
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">TIDAK ADA TINJAUAN AKTIF</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Silakan buat atau pilih catatan jurnal transaksi di sisi kiri dan klik tombol <b>"Tampil"</b> atau <b>"Minta Post-Trade Review AI"</b> untuk memuat ulasan mentor profesional.
                </p>
              </div>
            </div>
          )}

          {/* Quick Guide / Pro Tip footer */}
          <div className="mt-4 p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-lg text-[10.5px] leading-relaxed text-slate-400 font-sans">
            <span className="font-mono font-extrabold block text-emerald-400 uppercase tracking-widest text-[9.5px] mb-1">
              💡 PRO TRADING TIP:
            </span>
            Trading yang konsisten mengandalkan catatan yang disiplin, bukan emosi sesaat. Jurnal harian membantu Anda melacak performa secara objektif, menekan FOMO, dan mengidentifikasi kebiasaan buruk yang merugikan.
          </div>
        </div>

      </div>
    </div>
  );
}
