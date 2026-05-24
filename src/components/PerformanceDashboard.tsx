import { useState } from 'react';
import { MarketSignal } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart3, 
  Layers, ArrowUpRight, ArrowDownRight, Award, CheckCircle, XCircle 
} from 'lucide-react';

interface PerformanceDashboardProps {
  signals: MarketSignal[];
  onResetHistory: () => void;
  onResolveSignal: (id: string, status: 'TAKE_PROFIT' | 'STOP_LOSS' | 'EXPIRED', pips: number, currentPrice?: number) => void;
  isLoading: boolean;
}

export default function PerformanceDashboard({ signals, onResetHistory, onResolveSignal, isLoading }: PerformanceDashboardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; profit: number } | null>(null);

  // Calculate dynamic stats
  const total = signals.length;
  const completedSignals = signals.filter(s => s.status !== 'ACTIVE');
  const wins = completedSignals.filter(s => s.status === 'TAKE_PROFIT');
  const losses = completedSignals.filter(s => s.status === 'STOP_LOSS');
  
  const winRate = completedSignals.length > 0 
    ? Math.round((wins.length / completedSignals.length) * 100) 
    : 100;

  const totalPips = signals.reduce((acc, curr) => acc + curr.pipsProfit, 0);
  const buyCount = signals.filter(s => s.type === 'BUY').length;
  const sellCount = signals.filter(s => s.type === 'SELL').length;

  // Helper to format timestamps to Indonesian timezone and style
  const formatIndonesianDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    const dayName = dayNames[d.getDay()];
    const date = d.getDate().toString().padStart(2, '0');
    const monthName = monthNames[d.getMonth()];
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${dayName}, ${date} ${monthName} - ${hours}:${minutes} WIB`;
  };

  // Helper to resolve an active signal to TP or SL
  const handleResolve = (sig: MarketSignal, status: 'TAKE_PROFIT' | 'STOP_LOSS') => {
    const isCrypto = sig.pair.toUpperCase().includes('USDT');
    const isStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => sig.pair.toUpperCase().startsWith(s));
    const multiplier = isStock ? 1 : (isCrypto ? 100 : (sig.pair.toUpperCase().includes('JPY') ? 100 : 10000));

    let pips = 0;
    let targetPrice = status === 'TAKE_PROFIT' ? sig.takeProfit1 : sig.stopLoss;

    if (status === 'TAKE_PROFIT') {
      pips = sig.type === 'BUY'
        ? Math.round((sig.takeProfit1 - sig.entryPrice) * multiplier)
        : Math.round((sig.entryPrice - sig.takeProfit1) * multiplier);
    } else {
      pips = sig.type === 'BUY'
        ? Math.round((sig.stopLoss - sig.entryPrice) * multiplier)
        : Math.round((sig.entryPrice - sig.stopLoss) * multiplier);
    }

    onResolveSignal(sig.id, status, pips, targetPrice);
  };

  // Compile cumulative trajectory points for the SVG Chart
  const chronologicalSignals = [...signals].sort((a, b) => a.timestamp - b.timestamp);
  let cumulative = 0;
  const chartPoints = chronologicalSignals.map((sig, idx) => {
    cumulative += sig.pipsProfit;
    return {
      label: sig.pair + ' (' + sig.type + ')',
      profit: cumulative,
      rawProfit: sig.pipsProfit,
      date: new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  });

  // Calculate coordinates for responsive SVG Area Chart
  const padding = 45;
  const width = 680;
  const height = 240;
  const activeWidth = width - padding * 2;
  const activeHeight = height - padding * 2;

  const minVal = chartPoints.length > 0 ? Math.min(0, ...chartPoints.map(p => p.profit)) : -100;
  const maxVal = chartPoints.length > 0 ? Math.max(200, ...chartPoints.map(p => p.profit)) : 1000;
  const valRange = maxVal - minVal;

  const getX = (index: number) => {
    if (chartPoints.length <= 1) return padding + activeWidth / 2;
    return padding + (index / (chartPoints.length - 1)) * activeWidth;
  };

  const getY = (val: number) => {
    const scale = activeHeight / (valRange || 1);
    return padding + activeHeight - (val - minVal) * scale;
  };

  // Generate SVG path string
  let pathD = '';
  let areaD = '';
  if (chartPoints.length > 0) {
    const coords = chartPoints.map((pt, idx) => ({ x: getX(idx), y: getY(pt.profit) }));
    pathD = coords.reduce((acc, curr, idx) => 
      idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`, ''
    );
    
    if (coords.length > 0) {
      const bottomY = getY(Math.max(minVal, 0));
      areaD = `${pathD} L ${coords[coords.length - 1].x} ${bottomY} L ${coords[0].x} ${bottomY} Z`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Signals */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Total Sinyal</p>
          <div className="flex justify-between items-end mt-2">
            <h4 className="text-2xl font-mono font-bold text-white">{total}</h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">AKTIF + HISTORIS</span>
          </div>
          <div className="mt-3 flex space-x-2 text-[10px] font-mono text-slate-400">
            <span className="text-emerald-400">▲ {buyCount} BUY</span>
            <span className="text-rose-400">▼ {sellCount} SELL</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Akurasi / Win-Rate</p>
          <div className="flex justify-between items-end mt-2">
            <h4 className="text-2xl font-mono font-bold text-emerald-400">{winRate}%</h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">SANGAT TINGGI</span>
          </div>
          <div className="mt-3 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>{wins.length} TP Profit</span>
            <span>{losses.length} SL Loss</span>
          </div>
        </div>

        {/* Cumulative Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Akumulasi Profit / Pips</p>
          <div className="flex justify-between items-end mt-2">
            <h4 className={`text-2xl font-mono font-bold ${totalPips >= 0 ? 'text-emerald-400' : 'text-rose-455 text-rose-400'}`}>
              {totalPips >= 0 ? '+' : ''}{totalPips >= 1000 ? (totalPips / 10).toFixed(1) : totalPips} {totalPips >= 1000 ? 'p' : 'pips'}
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">NET RETURN</span>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-3 uppercase truncate">KAIDAH RESIKO: R:R 1:1.5</p>
        </div>

        {/* Active Trading performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase">Peringkat Sinyal</p>
          <div className="flex justify-between items-end mt-2">
            <h4 className="text-2xl font-mono font-bold text-white flex items-center">
              <Award className="text-amber-400 mr-2" size={22} /> ALPHA
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-950/40 text-yellow-400 border border-yellow-950/60">VIP</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-3 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" /> INTELEKTUAL MODE AKTIF
          </p>
        </div>
      </div>

      {/* 🔮 TARGET COGNITIVE ACCURACY MODEL VERIFICATION */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/25 p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Award className="text-teal-400 w-24 h-24" />
        </div>
        <div className="space-y-1.5 max-w-2xl relative z-10">
          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-teal-900/60 border border-teal-500/20 text-teal-300 text-[9px] font-mono font-bold uppercase">
            <span className="w-1 h-1 rounded-full bg-teal-400 animate-ping mr-1" />
            <span>SISTEM KALIBRASI TARGET COGNITIVE</span>
          </div>
          <h3 className="text-sm font-mono font-black text-white uppercase tracking-tight flex items-center">
            TARGET PERFORMA AKURASI SINYAL: <span className="text-teal-400 ml-1.5">95% ACCURACY TARGET</span>
          </h3>
          <p className="text-xs text-slate-450 text-slate-400 leading-relaxed font-sans">
            Untuk merengkuh target akurasi presisi tinggi <b>95%</b>, model menyaring pesanan likuiditas order block dan penawaran ketat. Setiap rekam jejak disajikan secara transparan di bawah ini (Profit hijau / Loss merah secara riil) demi integritas data tanpa rekayasa.
          </p>
        </div>
        
        {/* Progress Gauge */}
        <div className="flex-shrink-0 bg-slate-950/85 border border-slate-800/80 p-4 rounded-xl flex items-center space-x-5 min-w-[210px] justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Akurasi Riil</span>
            <span className="text-xl font-mono font-black text-emerald-400">{winRate}%</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Target Sasaran</span>
            <span className="text-xl font-mono font-black text-teal-400">95%</span>
          </div>
        </div>
      </div>

      {/* Trajectory Area Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-white uppercase mb-4 tracking-wider flex items-center">
          <BarChart3 className="text-emerald-400 mr-2" size={14} /> KURVA TRAJEKTORI PROFIT (SIKLUS AKUMULATIF STATS)
        </h3>

        {chartPoints.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-slate-500 font-mono text-xs">
            BELUM ADA DATA ANALISIS UNTUK DIAGRAM
          </div>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Zero-line */}
              <line 
                x1={padding} 
                y1={getY(0)} 
                x2={width - padding} 
                y2={getY(0)} 
                stroke="#334155" 
                strokeWidth={1} 
                strokeDasharray="4 4" 
              />

              {/* Shaded Area of gradient fill */}
              {areaD && (
                <path d={areaD} fill="url(#chartGrad)" />
              )}

              {/* Line graph outline */}
              {pathD && (
                <path d={pathD} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />
              )}

              {/* Circle interactive markers */}
              {chartPoints.map((pt, idx) => {
                const cx = getX(idx);
                const cy = getY(pt.profit);
                
                return (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r={hoveredPoint?.label === pt.label ? 6 : 3.5}
                    fill={pt.rawProfit >= 0 ? '#10b981' : '#f43f5e'}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint({ x: cx, y: cy, label: pt.label, profit: pt.profit })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}

              {/* X and Y legends */}
              <text x={padding} y={height - 12} fill="#64748b" className="text-[10px] font-mono" textAnchor="middle">MULAI</text>
              <text x={width - padding} y={height - 12} fill="#64748b" className="text-[10px] font-mono" textAnchor="middle">LIVE</text>
              
              {/* Max Val legend */}
              <text x={padding - 10} y={padding + 5} fill="#64748b" className="text-[10px] font-mono" textAnchor="end">{maxVal} pips</text>
              {/* Min Val legend */}
              <text x={padding - 10} y={height - padding + 5} fill="#64748b" className="text-[10px] font-mono" textAnchor="end">{minVal} pips</text>
            </svg>

            {/* Interactive Tooltip Card Hover */}
            {hoveredPoint && (
              <div 
                className="absolute bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xl text-[10px] font-mono text-white pointer-events-none"
                style={{ 
                  left: `${(hoveredPoint.x / width) * 100}%`, 
                  top: `${(hoveredPoint.y / height) * 100 - 32}%`,
                  transform: 'translate(-50%, -70%)'
                }}
              >
                <div className="font-bold uppercase text-slate-400">{hoveredPoint.label}</div>
                <div className="mt-1 flex items-center justify-between space-x-4">
                  <span>AKUMULASI:</span>
                  <span className={hoveredPoint.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-450 text-rose-400 font-bold'}>
                    {hoveredPoint.profit} Pips
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History details database panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <Layers className="text-emerald-400" size={14} />
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">REKAM JEJAK SINYAL HISTORIS & HASIL NYATA</h3>
          </div>
          
          <button
            onClick={onResetHistory}
            disabled={isLoading}
            className="text-[10px] text-slate-400 hover:text-white font-mono bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition cursor-pointer"
            title="Seka sirkuler memo"
          >
            SETEL ULANG SEED
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase font-bold">
                <th className="py-3 px-4 font-bold">WAKTU ANALISIS (INDONESIA)</th>
                <th className="py-3 px-4 font-bold">SIMBOL</th>
                <th className="py-3 px-4 font-bold">AKSI / TYPE</th>
                <th className="py-3 px-4 font-bold">GAYA</th>
                <th className="py-3 px-4 font-bold">ENTRY PRICE</th>
                <th className="py-3 px-4 font-bold">TARGET HARGA</th>
                <th className="py-3 px-4 font-bold">KONDISI REAKSI (PROFIT/LOSS)</th>
                <th className="py-3 px-4 font-bold text-right">RETURN (PIPS/PTS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
              {signals.map((sig) => {
                const isPos = sig.pipsProfit >= 0;
                const isIdxStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => sig.pair.toUpperCase().startsWith(s));

                const formatPrice = (val: number) => {
                  if (isNaN(val)) return '-';
                  if (isIdxStock) {
                    return 'Rp' + val.toLocaleString('id-ID', { maximumFractionDigits: 0 });
                  }
                  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
                };

                return (
                  <tr key={sig.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatIndonesianDate(sig.timestamp)}
                    </td>
                    <td className="py-4 px-4 font-bold text-white mb-0.5">{sig.pair}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sig.type === 'BUY' ? 'bg-emerald-950/45 text-emerald-400' : (sig.type === 'SELL' ? 'bg-rose-950/40 text-rose-400' : 'bg-slate-800 text-slate-400')
                      }`}>
                        {sig.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{sig.style}</td>
                    <td className="py-4 px-4 text-slate-300">{formatPrice(sig.entryPrice)}</td>
                    <td className="py-4 px-4 text-slate-300">
                      <div className="space-y-0.5">
                        <span className="text-emerald-400 block text-[9.5px]">TP1: {formatPrice(sig.takeProfit1)}</span>
                        <span className="text-rose-400 block text-[9.5px]">SL: {formatPrice(sig.stopLoss)}</span>
                      </div>
                    </td>

                    {/* Transparent Resolution toggler direct in columns list */}
                    <td className="py-4 px-4">
                      {sig.status === 'ACTIVE' ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                          <button
                            onClick={() => handleResolve(sig, 'TAKE_PROFIT')}
                            className="text-[9px] font-black bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded cursor-pointer uppercase transition text-center"
                            title="Konfirmasi harga menyentuh take profit"
                          >
                            🚀 TP HIT (PROFIT)
                          </button>
                          <button
                            onClick={() => handleResolve(sig, 'STOP_LOSS')}
                            className="text-[9px] font-black bg-rose-955/20 hover:bg-rose-900/40 border border-rose-500/20 text-rose-400 px-2 py-1 rounded cursor-pointer uppercase transition text-center"
                            title="Konfirmasi harga menyentuh stop loss"
                          >
                            ⚠️ SL HIT (LOSS)
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                            sig.status === 'TAKE_PROFIT' 
                              ? 'bg-emerald-500 text-slate-950 font-extrabold' 
                              : (sig.status === 'STOP_LOSS' 
                                ? 'bg-rose-500 text-slate-950 font-extrabold' 
                                : 'bg-slate-800 text-slate-300')
                          }`}>
                            {sig.status === 'TAKE_PROFIT' ? 'HIT PROFIT (TP)' : (sig.status === 'STOP_LOSS' ? 'HIT LOSS (SL)' : 'BERAKHIR')}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className={`py-4 px-4 text-right font-black ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sig.status === 'ACTIVE' 
                        ? (
                          <span className="text-slate-500 italic text-[10px] animate-pulse">BERJALAN (LIVE)</span>
                        ) 
                        : (isPos ? '+' : '') + sig.pipsProfit + (isIdxStock ? ' pts' : ' pips')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
