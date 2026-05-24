import React, { useState } from 'react';
import { Asset, PriceAlert, LivePrice } from '../types';
import { SUPPORTED_ASSETS } from '../assetsList';
import { 
  Bell, BellRing, Plus, Trash2, Volume2, VolumeX, 
  Send, ShieldCheck, AlertCircle, Sparkles, Copy, Trash, CheckCircle2
} from 'lucide-react';

interface PriceAlertsPanelProps {
  prices: Record<string, LivePrice>;
  selectedAsset: Asset | null;
  selectedPrice: number | null;
  alerts: PriceAlert[];
  onAddAlert: (assetSymbol: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => void;
  onDeleteAlert: (id: string) => void;
  onClearAllAlerts: () => void;
}

export default function PriceAlertsPanel({
  prices,
  selectedAsset,
  selectedPrice,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onClearAllAlerts
}: PriceAlertsPanelProps) {
  const [targetAssetSymbol, setTargetAssetSymbol] = useState<string>(selectedAsset?.symbol || 'BTCUSDT');
  const [targetPriceStr, setTargetPriceStr] = useState<string>('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('fm_alerts_muted');
    return saved === 'true';
  });

  // Handle muted status persistence
  const toggleMute = () => {
    setIsMuted(prev => {
      localStorage.setItem('fm_alerts_muted', String(!prev));
      return !prev;
    });
  };

  // Pre-load currently active price when target asset changes
  const activeLivePrice = prices[targetAssetSymbol]?.price || 0;

  // Let user auto-fill the current live price
  const handleCopyCurrentPrice = () => {
    if (activeLivePrice) {
      setTargetPriceStr(activeLivePrice.toString());
      
      // Auto-suggest logical condition based on entered price
      if (selectedPrice && activeLivePrice > selectedPrice) {
        setCondition('BELOW');
      } else {
        setCondition('ABOVE');
      }
    }
  };

  // Sync state if selected asset changes from parent
  const handleAssetSelectChange = (sym: string) => {
    setTargetAssetSymbol(sym);
    const live = prices[sym]?.price;
    if (live) {
      setTargetPriceStr(live.toString());
    }
  };

  // Quick percent offset adjustment buttons
  const handleAdjustPercent = (percent: number) => {
    const base = Number(targetPriceStr) || activeLivePrice || 0;
    if (base > 0) {
      const adjusted = base * (1 + percent / 100);
      const isForex = targetAssetSymbol.includes('USD') && !targetAssetSymbol.includes('USDT');
      const isStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => targetAssetSymbol.startsWith(s));
      
      let formatted: number;
      if (isStock) formatted = Math.round(adjusted);
      else if (isForex) formatted = Number(adjusted.toFixed(5));
      else formatted = Number(adjusted.toFixed(2));

      setTargetPriceStr(formatted.toString());
      if (adjusted > activeLivePrice) {
        setCondition('ABOVE');
      } else {
        setCondition('BELOW');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetPriceStr);
    if (isNaN(parsedTarget) || parsedTarget <= 0) return;

    // Trigger parent callback
    onAddAlert(targetAssetSymbol, parsedTarget, condition);
    setTargetPriceStr('');
  };

  const pendingAlerts = alerts.filter(a => a.status === 'PENDING');
  const triggeredAlerts = alerts.filter(a => a.status === 'TRIGGERED');

  const getPriceLayout = (sym: string, val: number) => {
    const isIdxStock = ['BBCA', 'BBRI', 'TLKM', 'ASII', 'GOTO', 'BMRI'].some(s => sym.startsWith(s));
    if (isIdxStock) return 'Rp' + val.toLocaleString('id-ID');
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
      {/* Title Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <BellRing className="text-emerald-400 animate-pulse" size={16} />
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase">Set Price Alarm</h2>
        </div>
        
        {/* Mute and Voice Toggle Switch */}
        <button
          onClick={toggleMute}
          className={`p-1.5 rounded-lg border transition duration-150 cursor-pointer flex items-center ${
            isMuted 
              ? 'bg-red-950/40 border-red-950 text-red-400 hover:bg-red-900/40' 
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title={isMuted ? 'Nyalakan bunyi nada' : 'Bisukan nada alaram'}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          <span className="text-[9px] font-mono ml-1 uppercase">{isMuted ? 'MUTE' : 'SOUND'}</span>
        </button>
      </div>

      {/* Form Setup Block */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Aset / Pasangan</label>
            <select
              value={targetAssetSymbol}
              onChange={(e) => handleAssetSelectChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono"
            >
              {SUPPORTED_ASSETS.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} ({asset.exchange || 'LIVE'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Kondisi Alaram</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-slate-700 font-mono"
            >
              <option value="ABOVE">▲ LEBIH BESAR (≥)</option>
              <option value="BELOW">▼ LEBIH KECIL (≤)</option>
            </select>
          </div>
        </div>

        {/* Input Target with Quick Fill Helper */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase block">Target Nilai Harga</label>
            <button
              type="button"
              onClick={handleCopyCurrentPrice}
              className="text-[9.5px] font-mono text-emerald-400 hover:underline flex items-center cursor-pointer"
            >
              <Copy size={10} className="mr-1" /> Kopi Harga Live ({activeLivePrice ? getPriceLayout(targetAssetSymbol, activeLivePrice) : '-'})
            </button>
          </div>

          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="CONTOH: 68500.50 atau 1.0850"
              value={targetPriceStr}
              onChange={(e) => setTargetPriceStr(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-slate-650 transition font-mono pr-12"
            />
            <span className="absolute right-3.5 top-2.5 text-[9px] font-mono text-slate-500 uppercase">
              {prices[targetAssetSymbol]?.symbol.replace('USDT', '') || 'VAL'}
            </span>
          </div>
        </div>

        {/* Quick Percent Adjustments */}
        <div className="flex space-x-1.5 justify-between">
          <button
            type="button"
            onClick={() => handleAdjustPercent(-2)}
            className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[10px] font-mono py-1 rounded-md text-slate-400 hover:text-white transition duration-150"
          >
            -2%
          </button>
          <button
            type="button"
            onClick={() => handleAdjustPercent(-0.5)}
            className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[10px] font-mono py-1 rounded-md text-slate-400 hover:text-white transition duration-150"
          >
            -0.5%
          </button>
          <button
            type="button"
            onClick={() => handleAdjustPercent(0.5)}
            className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[10px] font-mono py-1 rounded-md text-slate-400 hover:text-white transition duration-150"
          >
            +0.5%
          </button>
          <button
            type="button"
            onClick={() => handleAdjustPercent(2)}
            className="flex-1 bg-slate-950 border border-slate-850 hover:border-slate-800 text-[10px] font-mono py-1 rounded-md text-slate-400 hover:text-white transition duration-150"
          >
            +2%
          </button>
        </div>

        {/* Action button */}
        <button
          type="submit"
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-mono font-bold text-xs uppercase text-slate-950 hover:text-black rounded-lg transition-transform hover:scale-[1.01] flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/25"
        >
          <Plus size={14} />
          <span>Kunci Alaram Harga</span>
        </button>
      </form>

      {/* Lists Tabs Container */}
      <div className="space-y-4 pt-3.5 border-t border-slate-950">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-slate-450 uppercase tracking-widest block font-bold">
              Alaram Menunggu ({pendingAlerts.length})
            </span>
            {pendingAlerts.length > 0 && (
              <button
                onClick={onClearAllAlerts}
                className="text-[9px] font-mono text-slate-500 hover:text-white flex items-center cursor-pointer"
              >
                <Trash size={10} className="mr-1" /> Hapus Semua
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-0.5">
            {pendingAlerts.length === 0 ? (
              <div className="p-3 bg-slate-950/45 border border-slate-850/30 rounded-lg text-center text-slate-500 text-[10px] font-mono">
                BELUM ADA ALARAM HARGA AKTIF
              </div>
            ) : (
              pendingAlerts.map(alert => {
                const live = prices[alert.symbol];
                const distanceVal = live ? alert.targetPrice - live.price : 0;
                const distancePercent = live ? (distanceVal / live.price) * 100 : 0;

                return (
                  <div 
                    key={alert.id}
                    className="flex justify-between items-center bg-slate-950/80 hover:bg-slate-950 border border-slate-900 px-3 py-2 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[11px] font-mono font-bold text-white leading-none">{alert.symbol}</span>
                        <span className={`text-[8.5px] px-1 rounded font-mono font-bold leading-normal ${
                          alert.condition === 'ABOVE' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                        }`}>
                          {alert.condition === 'ABOVE' ? '≥' : '≤'}
                        </span>
                      </div>
                      <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                        Target: <span className="font-bold text-slate-200">{getPriceLayout(alert.symbol, alert.targetPrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-415 text-slate-400 block font-bold">
                          {live ? getPriceLayout(alert.symbol, live.price) : '-'}
                        </span>
                        <span className={`text-[8.5px] font-mono leading-none block ${
                          distancePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {distancePercent >= 0 ? '+' : ''}{distancePercent.toFixed(1)}% jarak
                        </span>
                      </div>
                      
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer hover:bg-slate-900 rounded-md"
                        title="Batalkan alaram ini"
                      >
                        <Trash2 size={11.5} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Triggered Section */}
        {triggeredAlerts.length > 0 && (
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold mb-2">
              Alaram Terpicu ({triggeredAlerts.length})
            </span>

            <div className="space-y-1.5 max-h-[110px] overflow-y-auto custom-scrollbar">
              {triggeredAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="flex justify-between items-center bg-emerald-950/25 border border-emerald-950/60 px-3 py-1.5 rounded-lg text-[10px] font-mono text-emerald-400"
                >
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    <div>
                      <span className="font-bold text-white mr-1.5">{alert.symbol}</span>
                      <span>Hit {getPriceLayout(alert.symbol, alert.targetPrice)}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500">
                    {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Integration statement */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 flex items-start space-x-2 text-[10px] font-mono text-slate-500 leading-normal">
        <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={12} />
        <span>Setiap alaram harga memindai pasar sirkuler multi-feed. Notifikasi audio diutamakan dan visual toast menyala instan.</span>
      </div>
    </div>
  );
}
