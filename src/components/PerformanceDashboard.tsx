import { useState } from 'react';
import { MarketSignal, SignalHistoryStats } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart3, 
  Layers, ArrowUpRight, ArrowDownRight, Award 
} from 'lucide-react';

interface PerformanceDashboardProps {
  signals: MarketSignal[];
  onResetHistory: () => void;
  isLoading: boolean;
}

export default function PerformanceDashboard({ signals, onResetHistory, isLoading }: PerformanceDashboardProps) {
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

  // Compile cumulative trajectory points for the SVG Chart
  // We sort signals in ascending chronological order to draw the line
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
    
    // Add bottom coordinates to seal the shaded gradient area
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
            <span className="text-rose-455 text-rose-400">▼ {sellCount} SELL</span>
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
            <span>{wins.length} TP</span>
            <span>{losses.length} SL</span>
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
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-950/40 text-yellow-400 border border-yellow-905 border-yellow-950/60">VIP</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-3 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" /> INTELEKTUAL MODE AKTIF
          </p>
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
                  <span className={hoveredPoint.profit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-455 text-rose-400 font-bold'}>
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
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">REKAM JEJAK SINYAL HISTORIS</h3>
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
              <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                <th className="py-3 px-4 font-normal">WAKTU</th>
                <th className="py-3 px-4 font-normal">SIMBOL</th>
                <th className="py-3 px-4 font-normal">AKSI / TYPE</th>
                <th className="py-3 px-4 font-normal">GAYA</th>
                <th className="py-3 px-4 font-normal">ENTRY</th>
                <th className="py-3 px-4 font-normal">CURRENT</th>
                <th className="py-3 px-4 font-normal">STATUS</th>
                <th className="py-3 px-4 font-normal text-right">RETURN (PIPS/PTS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-mono">
              {signals.map((sig) => {
                const dt = new Date(sig.timestamp).toLocaleDateString([], { month: 'short', day: '2-digit' }) + 
                           ' - ' + new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isPos = sig.pipsProfit >= 0;
                const isIdxStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => sig.pair.toUpperCase().startsWith(s));

                const formatPrice = (val: number) => {
                  if (isIdxStock) {
                    return 'Rp' + val.toLocaleString('id-ID', { maximumFractionDigits: 0 });
                  }
                  return val;
                };

                return (
                  <tr key={sig.id} className="hover:bg-slate-950/40 transition">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">{dt}</td>
                    <td className="py-3.5 px-4 font-bold text-white mb-0.5">{sig.pair}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sig.type === 'BUY' ? 'bg-emerald-950/45 text-emerald-400' : (sig.type === 'SELL' ? 'bg-rose-955 bg-rose-950/40 text-rose-400' : 'bg-slate-800 text-slate-400')
                      }`}>
                        {sig.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{sig.style}</td>
                    <td className="py-3.5 px-4 text-slate-300">{formatPrice(sig.entryPrice)}</td>
                    <td className="py-3.5 px-4 text-slate-300">{formatPrice(sig.currentPrice)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        sig.status === 'TAKE_PROFIT' ? 'bg-emerald-500 text-slate-950 font-bold' : (sig.status === 'STOP_LOSS' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-slate-300')
                      }`}>
                        {sig.status === 'TAKE_PROFIT' ? 'HIT TP' : (sig.status === 'STOP_LOSS' ? 'HIT SL' : 'RUNNING')}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold ${isPos ? 'text-emerald-400' : 'text-rose-455 text-rose-400'}`}>
                      {sig.status === 'ACTIVE' 
                        ? '-' 
                        : (isPos ? '+' : '') + sig.pipsProfit + (isIdxStock ? ' pts' : '')}
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
