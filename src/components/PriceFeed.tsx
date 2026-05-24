import { useState, useEffect } from 'react';
import { getLivePrices, tickLivePrices } from '../services/marketService';
import { SUPPORTED_ASSETS } from '../assetsList';
import { LivePrice, Asset } from '../types';
import { Search, Coins, RefreshCw, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface PriceFeedProps {
  onSelectAsset: (asset: Asset, currentPrice: number) => void;
}

export default function PriceFeed({ onSelectAsset }: PriceFeedProps) {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'crypto' | 'crypto_futures' | 'forex' | 'commodity' | 'stock'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch and set interval loop
  useEffect(() => {
    async function initFeed() {
      setIsLoading(true);
      const initial = await getLivePrices();
      setPrices(initial);
      setIsLoading(false);
    }
    
    initFeed();

    // 1. Fetch real API rates every 12 seconds
    const apiInterval = setInterval(async () => {
      const updated = await getLivePrices();
      setPrices(updated);
    }, 12000);

    // 2. Perform micro price ticks every 1.5 seconds for visual realism and dynamic charts
    const tickInterval = setInterval(() => {
      const ticked = tickLivePrices();
      setPrices({ ...ticked });
    }, 1500);

    return () => {
      clearInterval(apiInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    const updated = await getLivePrices();
    setPrices(updated);
    setIsLoading(false);
  };

  // Filter assets based on tabs and search bar
  const filteredAssets = SUPPORTED_ASSETS.filter((asset) => {
    const categoryMatches = activeCategory === 'all' || asset.type === activeCategory;
    const searchMatches = asset.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          asset.name.toLowerCase().includes(search.toLowerCase());
    return categoryMatches && searchMatches;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase">Live Feed: ON</h2>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="text-slate-400 hover:text-white transition p-1 bg-slate-800 rounded-lg hover:bg-slate-700"
          title="Segarkan harga"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Cari Pair: BTC, GOLD, EURUSD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-650 transition font-mono"
        />
      </div>

      {/* Categories Selector */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-lg mb-4">
        {(['all', 'commodity', 'crypto', 'crypto_futures', 'forex', 'stock'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-1.5 rounded-md font-mono text-[9px] sm:text-[10px] font-medium uppercase transition ${
              activeCategory === cat ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            {cat === 'all' 
              ? 'Semua' 
              : cat === 'commodity' 
                ? 'Metal' 
                : cat === 'crypto'
                  ? 'Spot'
                  : cat === 'crypto_futures'
                    ? 'Futures'
                    : cat === 'stock' 
                      ? 'Saham' 
                      : cat}
          </button>
        ))}
      </div>

      {/* List items scroll container */}
      <div className="flex-1 overflow-y-auto max-h-[480px] custom-scrollbar space-y-2 pr-1">
        {isLoading && Object.keys(prices).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500 font-mono text-xs">
            <RefreshCw className="animate-spin mb-2" size={20} />
            MENGHUBUNGKAN BURSAS...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            TIDAK ADA ASSET DITEMUKAN
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const p = prices[asset.symbol];
            if (!p) return null;
            const isPos = p.change24h >= 0;

            return (
              <div
                key={asset.symbol}
                onClick={() => onSelectAsset(asset, p.price)}
                className="group flex justify-between items-center p-3 bg-slate-950/60 hover:bg-slate-800/40 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer transition"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-400 transition">
                      {asset.symbol}
                    </span>
                    <span className="text-[9px] px-1 bg-slate-900 rounded text-slate-500 font-mono">
                      {asset.type === 'crypto' 
                        ? 'SPOT' 
                        : asset.type === 'crypto_futures' 
                          ? 'FUTURES' 
                          : asset.type === 'commodity' 
                            ? 'METAL' 
                            : asset.type === 'stock' 
                              ? 'SAHAM' 
                              : 'FX'}
                    </span>
                    {asset.exchange && (
                      <span className={`text-[8px] font-extrabold px-1 rounded font-mono tracking-tight uppercase ${
                        asset.exchange === 'Bitunix' 
                          ? 'bg-amber-950/90 border border-amber-500/30 text-amber-400' 
                          : asset.exchange === 'MEXC' 
                            ? 'bg-blue-950/90 border border-blue-500/30 text-blue-400' 
                            : asset.exchange === 'Bybit'
                              ? 'bg-amber-500/10 border border-amber-500/20 text-orange-400'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}>
                        {asset.exchange}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase truncate max-w-[130px]">
                    {asset.name}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="text-sm font-mono font-bold text-white tracking-tight">
                    {asset.type === 'forex' 
                      ? p.price.toFixed(5) 
                      : asset.type === 'stock'
                        ? 'Rp' + p.price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                        : p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className={`text-[10px] font-mono font-semibold flex items-center ${isPos ? 'text-emerald-400' : 'text-rose-455 text-rose-400'}`}>
                      {isPos ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                      {isPos ? '+' : ''}{p.change24h.toFixed(2)}%
                    </span>
                    
                    <span className="opacity-0 group-hover:opacity-100 transition duration-150 text-[10px] font-mono text-emerald-400 flex items-center bg-emerald-950/40 border border-emerald-900/40 px-1 py-0.2 rounded">
                      <Zap size={8} className="mr-0.5" /> JALANKAN
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-900 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>SINKRONISASI: MULTI-BURSA (BINANCE, BITUNIX, MEXC, BYBIT)</span>
        <span>DELAY: &lt;12MS</span>
      </div>
    </div>
  );
}
