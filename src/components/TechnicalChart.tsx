import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Clock, Maximize2, Sparkles, AlertCircle, 
  HelpCircle, RefreshCw, Zap, Eye, Calendar, AreaChart, Settings, Trash2
} from 'lucide-react';
import { LivePrice, Asset } from '../types';
import { SUPPORTED_ASSETS } from '../assetsList';

interface TechnicalChartProps {
  selectedAsset: Asset | null;
  prices: Record<string, LivePrice>;
  onSelectAsset?: (asset: Asset, currentPrice: number) => void;
}

interface CandleHistoryPoint {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function TechnicalChart({ selectedAsset, prices, onSelectAsset }: TechnicalChartProps) {
  // Determine active asset
  const defaultAsset = SUPPORTED_ASSETS[0]; // XAUUSD
  const activeAsset = selectedAsset || defaultAsset;
  const symbol = activeAsset.symbol;
  const livePriceData = prices[symbol.toUpperCase()];
  const currentPrice = livePriceData?.price || 100;

  // Asset price history database stored locally to preserve across selections during the session
  const [historyCache, setHistoryCache] = useState<Record<string, CandleHistoryPoint[]>>({});
  const [chartData, setChartData] = useState<CandleHistoryPoint[]>([]);
  const [activeTimeframe, setActiveTimeframe] = useState<'1M' | '5M' | '1H'>('5M');
  const [isLive, setIsLive] = useState(true);
  const [lastTickTime, setLastTickTime] = useState<Date>(new Date());
  
  // Custom tooltips & state
  const [hoveredData, setHoveredData] = useState<CandleHistoryPoint | null>(null);

  // Custom Trendlines state
  const [trendLines, setTrendLines] = useState<Record<string, { id: string; price: number; color: string; type: 'support' | 'resistance' }[]>>({});
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const addTrendLine = (price: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const type = price < currentPrice ? 'support' : 'resistance';
    const color = type === 'support' ? '#38bdf8' : '#f59e0b'; // sky-400 vs amber-500
    
    setTrendLines(prev => {
      const currentList = prev[symbol] || [];
      return {
        ...prev,
        [symbol]: [...currentList, { id, price, color, type }]
      };
    });
  };

  const removeTrendLine = (id: string) => {
    setTrendLines(prev => {
      const currentList = prev[symbol] || [];
      return {
        ...prev,
        [symbol]: currentList.filter(t => t.id !== id)
      };
    });
  };

  const clearAllTrendLines = () => {
    setTrendLines(prev => ({
      ...prev,
      [symbol]: []
    }));
  };

  // SVG structure dimensions refs
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  // 1. Handle dimension tracking
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Ensure standard height proportional to screen size, bounding to reasonable ranges
        const checkedHeight = Math.max(280, Math.min(height, 500));
        setDimensions({ width: width || 600, height: checkedHeight || 350 });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 2. Helper to generate realistic historical candlestick data points for the initial seed
  const generateHistorySeed = (sym: string, startPrice: number, changePercent24h: number = 0, count: number = 28): CandleHistoryPoint[] => {
    const rawChange = changePercent24h / 100;
    // Walk back in time (60 seconds per candle)
    const now = Date.now();
    const data: CandleHistoryPoint[] = [];
    
    let tempPrice = startPrice;
    
    // Customize asset-dependent volatility to make the candles look extremely realistic
    const isCrypto = sym.toUpperCase().includes('USDT') || sym.toUpperCase().includes('BTC');
    const volatility = isCrypto ? 0.0035 : 0.0016;

    for (let i = 0; i < count; i++) {
      const timeOffset = i * 60000; // 60-second steps backwards
      const time = new Date(now - timeOffset);
      
      // Calculate trend bias backwards
      const trendBias = -rawChange / count;
      const randomNoise = (Math.random() - 0.5) * volatility * tempPrice;
      const drift = tempPrice * trendBias;
      
      const prevClose = tempPrice;
      const nextOpen = tempPrice + drift + randomNoise;
      
      // Ensure prices stay physically bounds
      const oVal = Math.max(0.0001, nextOpen);
      const cVal = Math.max(0.0001, prevClose);
      
      const bodyMax = Math.max(oVal, cVal);
      const bodyMin = Math.min(oVal, cVal);
      
      // Wicks expansion
      const hVal = bodyMax + (Math.random() * volatility * 0.85 * tempPrice);
      const lVal = Math.max(0.0001, bodyMin - (Math.random() * volatility * 0.85 * tempPrice));
      
      tempPrice = oVal;

      data.push({
        time,
        open: oVal,
        high: hVal,
        low: lVal,
        close: cVal
      });
    }

    return data.reverse();
  };

  // 3. Init or load history when symbol/asset changes
  useEffect(() => {
    if (!symbol) return;

    const savedHistory = historyCache[symbol];
    if (savedHistory && savedHistory.length > 0) {
      // Keep old history
      setChartData(savedHistory);
    } else {
      // Seed brand new realistic historical series of candles
      const seedChange = livePriceData?.change24h || 0;
      const seedPoints = generateHistorySeed(symbol, currentPrice, seedChange, 28);
      
      setChartData(seedPoints);
      setHistoryCache(prev => ({
        ...prev,
        [symbol]: seedPoints
      }));
    }
  }, [symbol]);

  // 4. Autocomplete ticking event: update current active candle or slide in a new one under a 1-second precision clock
  useEffect(() => {
    if (!isLive || !symbol) return;

    const interval = setInterval(() => {
      const now = new Date();
      setLastTickTime(now);

      setChartData(prevData => {
        if (prevData.length === 0) return [];
        
        // Pull latest from current prices prop
        const newestLivePrice = prices[symbol.toUpperCase()]?.price || currentPrice;
        
        const updated = [...prevData];
        const latestCandle = { ...updated[updated.length - 1] };
        
        // Define candle timeframe window block (60 seconds)
        const elapsedMs = now.getTime() - latestCandle.time.getTime();
        
        if (elapsedMs >= 60000) {
          // Time to construct and transition into a brand new candle
          const newCandle: CandleHistoryPoint = {
            time: now,
            open: latestCandle.close,
            high: Math.max(latestCandle.close, newestLivePrice),
            low: Math.min(latestCandle.close, newestLivePrice),
            close: newestLivePrice
          };
          
          updated.shift(); // sliding window maintain count (28 points)
          updated.push(newCandle);
        } else {
          // Edit the current active candle real-time
          latestCandle.close = newestLivePrice;
          if (newestLivePrice > latestCandle.high) latestCandle.high = newestLivePrice;
          if (newestLivePrice < latestCandle.low) latestCandle.low = newestLivePrice;
          updated[updated.length - 1] = latestCandle;
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, symbol, prices, currentPrice]);

  // 4y. Synchronize chartData changes back to historyCache to avoid side-effects inside state updaters
  useEffect(() => {
    if (chartData.length > 0 && symbol) {
      setHistoryCache(prevCache => {
        // Simple comparison to prevent useless state transitions and infinite loops
        if (prevCache[symbol] === chartData) return prevCache;
        return {
          ...prevCache,
          [symbol]: chartData
        };
      });
    }
  }, [chartData, symbol]);

  // 4b. Instant sub-second ticker: immediately pulses current active candle close/wicks when the live prices ticks
  useEffect(() => {
    if (!isLive || !symbol) return;

    const newestPrice = prices[symbol.toUpperCase()]?.price || currentPrice;

    setChartData(prevData => {
      if (prevData.length === 0) return [];
      const updated = [...prevData];
      const latestCandle = { ...updated[updated.length - 1] };

      let changed = false;

      if (latestCandle.close !== newestPrice) {
        latestCandle.close = newestPrice;
        changed = true;
      }
      if (newestPrice > latestCandle.high) {
        latestCandle.high = newestPrice;
        changed = true;
      }
      if (newestPrice < latestCandle.low) {
        latestCandle.low = newestPrice;
        changed = true;
      }

      if (!changed) return prevData;

      updated[updated.length - 1] = latestCandle;
      return updated;
    });
  }, [currentPrice, symbol, isLive, prices]);

  // 5. Build D3 Canvas & Chart Rendering Logic
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const margin = { top: 25, right: 75, bottom: 30, left: 16 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create primary group container with offset margins
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define X & Y Domains
    const xExtent = d3.extent<CandleHistoryPoint, Date>(chartData, d => d.time) as [Date, Date];
    const yMin = d3.min<CandleHistoryPoint, number>(chartData, d => d.low) || 0;
    const yMax = d3.max<CandleHistoryPoint, number>(chartData, d => d.high) || 100;
    
    // Add 2% padding to top & bottom of Y axis for aesthetic breathing room
    const paddingMultiplier = 0.02;
    const yPad = (yMax - yMin) * paddingMultiplier;
    const yDomain: [number, number] = [Math.max(0, yMin - yPad), yMax + yPad];

    // Scales
    const xScale = d3.scaleTime()
      .domain(xExtent)
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0]);

    // Latest stroke styling
    const latestPoint = chartData[chartData.length - 1];
    const lastGain = latestPoint.close >= latestPoint.open;
    const strokeColor = lastGain ? '#10b981' : '#f43f5e'; // emerald-500 vs rose-500

    // Subtle dashed gridlines for analytical styling
    const xTicks = Math.min(6, Math.floor(width / 100));
    const yTicks = 5;

    // X Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(xTicks)
        .tickSize(-height)
        .tickFormat(() => '')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#1e293b') // slate-800
        .attr('stroke-dasharray', '3,3')
      );

    // Y Gridlines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(0,0)')
      .call(d3.axisLeft(yScale)
        .ticks(yTicks)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#1e293b') // slate-800
        .attr('stroke-dasharray', '3,3')
      );

    // X Axis Labels (Hours/Minutes/Seconds formatted cleanly)
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(xTicks)
        .tickFormat(d3.timeFormat('%H:%M:%S') as any)
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#64748b') // slate-500
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, ui-monospace, sans-serif')
        .attr('dy', '11px')
      )
      .call(g => g.selectAll('.tick line').remove());

    // Y Axis Labels (right-aligned for easier price tracking)
    g.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(yScale)
        .ticks(yTicks)
        .tickFormat(d => d.toLocaleString(undefined, { maximumFractionDigits: (symbol.includes('USDT') || symbol.includes('USD') ? 2 : 0) }))
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('fill', '#94a3b8') // slate-400
        .attr('font-size', '9.5px')
        .attr('font-family', 'JetBrains Mono, ui-monospace, sans-serif')
        .attr('dx', '5px')
      )
      .call(g => g.selectAll('.tick line').remove());

    // DRAW THE WICKS
    g.append('g')
      .selectAll('line.wick')
      .data(chartData)
      .enter()
      .append('line')
      .attr('class', 'wick')
      .attr('x1', (d: any) => xScale(d.time))
      .attr('y1', (d: any) => yScale(d.low))
      .attr('x2', (d: any) => xScale(d.time))
      .attr('y2', (d: any) => yScale(d.high))
      .attr('stroke', (d: any) => d.close >= d.open ? '#10b981' : '#f43f5e')
      .attr('stroke-width', '1.5');

    // DRAW THE BODIES
    const candleWidth = Math.max(3, (width / chartData.length) * 0.65);
    g.append('g')
      .selectAll('rect.candle')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'candle')
      .attr('x', (d: any) => xScale(d.time) - candleWidth / 2)
      .attr('y', (d: any) => yScale(Math.max(d.open, d.close)))
      .attr('width', candleWidth)
      .attr('height', (d: any) => Math.max(1.5, Math.abs(yScale(d.open) - yScale(d.close))))
      .attr('fill', (d: any) => d.close >= d.open ? '#10b981' : '#f43f5e')
      .attr('stroke', (d: any) => d.close >= d.open ? '#059669' : '#b91c1c')
      .attr('stroke-width', '0.5')
      .attr('rx', '1');

    // Render Dashboard style current price glowing tracking lines across the chart
    const latestY = yScale(latestPoint.close);
    
    // Draw running dotted guide line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', latestY)
      .attr('x2', width)
      .attr('y2', latestY)
      .attr('stroke', strokeColor)
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', '0.65');

    // Glow circle outer
    g.append('circle')
      .attr('cx', width)
      .attr('cy', latestY)
      .attr('r', '5')
      .attr('fill', strokeColor)
      .attr('opacity', '0.3')
      .attr('class', 'animate-ping')
      .style('transform-origin', `${width}px ${latestY}px`);

    // Solid inner circle
    g.append('circle')
      .attr('cx', width)
      .attr('cy', latestY)
      .attr('r', '3.5')
      .attr('fill', strokeColor)
      .attr('stroke', '#020617')
      .attr('stroke-width', '1');

    // Price Tag Badge
    const tagGroup = g.append('g')
      .attr('transform', `translate(${width + 1}, ${latestY - 8.5})`);

    tagGroup.append('rect')
      .attr('width', '68')
      .attr('height', '18')
      .attr('rx', '3')
      .attr('fill', strokeColor)
      .attr('id', 'price-tag-badge');

    tagGroup.append('text')
      .attr('x', '34')
      .attr('y', '12.5')
      .attr('text-anchor', 'middle')
      .attr('fill', '#020617')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'JetBrains Mono, ui-monospace, sans-serif')
      .text(latestPoint.close.toLocaleString(undefined, { maximumFractionDigits: symbol.includes('USDT') || symbol.includes('USD') ? 2 : 0 }));

    // Interactive Hover Tracking Grid Overlay
    const mouseG = g.append('g')
      .attr('class', 'mouse-over-effects')
      .attr('opacity', '0');

    // Vertical cursor line tracker
    const verticalLine = mouseG.append('line')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#475569') // slate-600
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '2,2');

    // Hover tooltip circle
    const hoverCircle = mouseG.append('circle')
      .attr('r', '5')
      .attr('fill', strokeColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', '1.5');

    // Horizontal drawing preview line
    const horizontalPreviewLine = mouseG.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('stroke', '#38bdf8') // sky-400
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', isDrawingMode ? '0.85' : '0');

    // Capture area overlay
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseenter', () => mouseG.attr('opacity', '1'))
      .on('mouseleave', () => {
        mouseG.attr('opacity', '0');
        setHoveredData(null);
      })
      .on('mousemove', function(event) {
        // Find closest point based on mouse relative x position
        const [mouseX, mouseY] = d3.pointer(event);
        const mouseDate = xScale.invert(mouseX);

        // Update horizontal drawing preview line position & visibility
        if (isDrawingMode) {
          horizontalPreviewLine
            .attr('y1', mouseY)
            .attr('y2', mouseY)
            .attr('opacity', '0.85');
        } else {
          horizontalPreviewLine.attr('opacity', '0');
        }

        // Bisector algorithm
        const bisect = d3.bisector<CandleHistoryPoint, Date>(d => d.time).center;
        const index = bisect(chartData, mouseDate);
        const resolvedPoint = chartData[index];

        if (resolvedPoint) {
          const px = xScale(resolvedPoint.time);
          const py = yScale(resolvedPoint.close);

          verticalLine.attr('x1', px).attr('x2', px);
          hoverCircle.attr('cx', px).attr('cy', py);

          setHoveredData(resolvedPoint);
        }
      })
      .on('click', function(event) {
        if (!isDrawingMode) return;
        const [, mouseY] = d3.pointer(event);
        const priceAtClick = yScale.invert(mouseY);
        addTrendLine(priceAtClick);
      });

    // DRAW EXISTING TREND LINES ON TOP OF OVERLAY FOR INTERACTIVE GESTURES
    const activeLines = trendLines[symbol] || [];
    const trendLinesG = g.append('g').attr('class', 'trend-lines');

    activeLines.forEach((line) => {
      const ly = yScale(line.price);
      
      // Skip rendering if the custom level is scrolled outside current chart viewport
      if (ly < 0 || ly > height) return;

      const group = trendLinesG.append('g')
        .attr('class', `trend-line-${line.id}`)
        .style('cursor', 'pointer');

      // 1. Dotted/dashed horizontal visual line
      const visualLine = group.append('line')
        .attr('x1', 0)
        .attr('y1', ly)
        .attr('x2', width)
        .attr('y2', ly)
        .attr('stroke', line.color)
        .attr('stroke-width', '1.5')
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', '0.85');

      let labelY = ly - 17;
      if (ly < 18) {
        labelY = ly + 4;
      }

      // 2. Interactive text label tag
      const labelBg = group.append('rect')
        .attr('x', 8)
        .attr('y', labelY)
        .attr('width', '115')
        .attr('height', '15')
        .attr('rx', '3')
        .attr('fill', '#020617')
        .attr('stroke', line.color)
        .attr('stroke-width', '0.75')
        .attr('opacity', '0.95');

      const labelText = group.append('text')
        .attr('x', 14)
        .attr('y', labelY + 10.5)
        .attr('fill', line.color)
        .attr('font-size', '8px')
        .attr('font-family', 'JetBrains Mono, ui-monospace, sans-serif')
        .attr('font-weight', 'bold')
        .text(`${line.type.toUpperCase()}: ${priceFormattor(line.price)}`);

      // 3. Invisible thick intercept track for precise hover targeting
      const interceptTrack = group.append('line')
        .attr('x1', 0)
        .attr('y1', ly)
        .attr('x2', width)
        .attr('y2', ly)
        .attr('stroke', 'transparent')
        .attr('stroke-width', '14')
        .attr('pointer-events', 'stroke');

      // 4. Click to delete & hover helpers
      interceptTrack
        .on('mouseenter', () => {
          visualLine.attr('stroke', '#ef4444').attr('stroke-width', '2.25').attr('opacity', '1');
          labelBg.attr('stroke', '#ef4444');
          labelText.attr('fill', '#ef4444').text('✕ HAPUS GARIS');
        })
        .on('mouseleave', () => {
          visualLine.attr('stroke', line.color).attr('stroke-width', '1.5').attr('opacity', '0.85');
          labelBg.attr('stroke', line.color);
          labelText.attr('fill', line.color).text(`${line.type.toUpperCase()}: ${priceFormattor(line.price)}`);
        })
        .on('click', function(event) {
          event.stopPropagation(); // Prevent launching another raw overlay click event (double trigger)
          removeTrendLine(line.id);
        });
    });

  }, [chartData, dimensions, symbol, trendLines, isDrawingMode]);

  // Handle asset click/change binding
  const changeSelectedAssetObj = (sym: string) => {
    const asset = SUPPORTED_ASSETS.find(a => a.symbol === sym);
    if (asset && onSelectAsset) {
      const matchPrice = prices[sym.toUpperCase()]?.price || 100;
      onSelectAsset(asset, matchPrice);
    }
  };

  // Perform quick metrics math with the active scale
  const metricsInfo = React.useMemo(() => {
    if (chartData.length < 5) return { max: 0, min: 0, rsi: 50, trend: 'NEUTRAL', changePct: 0 };
    const pricesList = chartData.map(d => d.close);
    const max = Math.max(...chartData.map(d => d.high));
    const min = Math.min(...chartData.map(d => d.low));
    
    // Quick RSI Estimation from current chart frame
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < pricesList.length; i++) {
      const diff = pricesList[i] - pricesList[i-1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    
    let chartRsi = 50;
    if (gains + losses > 0) {
      chartRsi = Math.round((gains / (gains + losses)) * 100);
    }

    const firstVal = pricesList[0];
    const lastVal = pricesList[pricesList.length - 1];
    const changePct = ((lastVal - firstVal) / firstVal) * 100;
    const trend = changePct > 0.05 ? 'BULLISH' : (changePct < -0.05 ? 'BEARISH' : 'NEUTRAL');

    return { max, min, rsi: chartRsi, trend, changePct };
  }, [chartData]);

  // Clean formattor
  const priceFormattor = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: symbol.includes('USDT') || symbol.includes('USD') ? 2 : 0,
      maximumFractionDigits: symbol.includes('USDT') || symbol.includes('USD') ? 4 : 0
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-5" id="real-time-technical-chart-panel">
      
      {/* Upper header segment and live toggle controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg">
            <AreaChart size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-extrabold text-emerald-400 tracking-wider">CHART LIVE CANDLESTICK</span>
              {isLive ? (
                <span className="flex items-center space-x-1 py-0.5 px-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[8.5px] font-mono select-none">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                  <span>AUTOPILOT (5 DETIK)</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-slate-500 text-[8.5px] font-mono">TERJEDA</span>
              )}
            </div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-tight flex items-center mt-0.5">
              <span>{activeAsset.name}</span>
              <span className="ml-1.5 text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-900">{symbol}</span>
            </h2>
          </div>
        </div>

        {/* Quick controls and timeframe selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Quick Select Asset Dropdown */}
          <select 
            value={symbol}
            onChange={(e) => changeSelectedAssetObj(e.target.value)}
            className="flex-1 sm:flex-none text-xs bg-slate-950 text-slate-300 font-mono font-bold px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-slate-700 max-w-[130px]"
          >
            {SUPPORTED_ASSETS.slice(0, 16).map((item) => (
              <option key={item.symbol} value={item.symbol}>{item.symbol}</option>
            ))}
          </select>

          {/* Autoplay/Pause Toggle */}
          <button
            onClick={() => setIsLive(prev => !prev)}
            className={`p-1.5 rounded border text-xs transition duration-200 ${
              isLive 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/80 hover:bg-emerald-950/60' 
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={isLive ? "Jeda update sirkuit instan" : "Mulai sirkuit autopilot"}
          >
            <Clock size={14} className={isLive ? "animate-spin animate-duration-10000" : ""} />
          </button>

          {/* Trendline Drawing Mode Toggle */}
          <button
            onClick={() => setIsDrawingMode(prev => !prev)}
            className={`p-1.5 rounded border text-xs transition duration-200 flex items-center space-x-1.5 ${
              isDrawingMode 
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800 hover:bg-cyan-950 font-bold' 
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title={isDrawingMode ? "Matikan mode menggambar trend line" : "Aktifkan mode menggambar trend line"}
          >
            <TrendingUp size={14} className={isDrawingMode ? "animate-pulse" : ""} />
            <span className="font-mono text-[10px] uppercase font-bold tracking-tight">GAMBAR TREN</span>
          </button>

          {/* Clear Trendlines Button (only visible if there are lines) */}
          {(trendLines[symbol] && trendLines[symbol].length > 0) && (
            <button
              onClick={clearAllTrendLines}
              className="p-1.5 rounded border text-xs transition duration-205 bg-slate-950 text-rose-455 text-rose-400 border-slate-800 hover:bg-rose-950/40 hover:text-rose-300"
              title="Hapus semua trendline dari chart"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bento-Style Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* current price */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 space-y-1">
          <span className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider block">Harga Live</span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-sm font-mono font-extrabold text-white">{priceFormattor(currentPrice)}</span>
            <span className="text-[9px] text-slate-500 font-mono">
              {symbol.includes('USDT') ? 'USDT' : (symbol.includes('USD') ? 'USD' : 'IDR')}
            </span>
          </div>
          <p className="text-[9px] text-slate-500 font-mono flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse duration-700" />
            <span>TICK LIVE: {lastTickTime.toTimeString().substring(0, 8)}</span>
          </p>
        </div>

        {/* 24h Change percentage */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 space-y-1">
          <span className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider block">Perubahan 24 Jam</span>
          <div className="flex items-baseline space-x-1">
            <span className={`text-sm font-mono font-extrabold ${
              (livePriceData?.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(livePriceData?.change24h || 0) >= 0 ? '+' : ''}{(livePriceData?.change24h || 0).toFixed(2)}%
            </span>
          </div>
          <div className="text-[9px] text-slate-500 font-mono truncate">
            MIN: {priceFormattor(livePriceData?.low24h || currentPrice * 0.98)} | MAX: {priceFormattor(livePriceData?.high24h || currentPrice * 1.02)}
          </div>
        </div>

        {/* Viewport statistics */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 space-y-1">
          <span className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider block">Ayunan Chart (Rentang Terikat)</span>
          <div className="text-slate-200 text-xs font-mono font-bold leading-none mt-1">
            H: <span className="text-emerald-400">{priceFormattor(metricsInfo.max)}</span>
          </div>
          <div className="text-slate-200 text-xs font-mono font-bold leading-none">
            L: <span className="text-rose-400">{priceFormattor(metricsInfo.min)}</span>
          </div>
          <div className="text-[8.5px] text-slate-500 font-mono">
            RATA-RATA: {priceFormattor((metricsInfo.max + metricsInfo.min) / 2)}
          </div>
        </div>

        {/* Dynamic Indicator computation from visible chart series */}
        <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 space-y-1">
          <span className="text-[9.5px] text-slate-500 font-mono uppercase tracking-wider block">Indeks Momentum RSI Chart</span>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-sm font-mono font-extrabold ${
              metricsInfo.rsi >= 70 ? 'text-amber-500' : (metricsInfo.rsi <= 30 ? 'text-amber-500' : 'text-emerald-400')
            }`}>{metricsInfo.rsi}</span>
            <span className="text-[9px] text-slate-400 font-mono">/ 100</span>
          </div>
          <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded inline-block font-black ${
            metricsInfo.rsi >= 70 ? 'bg-amber-950 text-amber-500' : 
            metricsInfo.rsi <= 70 && metricsInfo.rsi >= 45 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950/60 text-rose-455 text-rose-400'
          }`}>
            {metricsInfo.rsi >= 70 ? 'OVERBOUGHT JET' : (metricsInfo.rsi <= 30 ? 'OVERSOLD DEPTH' : (metricsInfo.rsi >= 50 ? 'BULLISH STRENGTH' : 'BEARISH INCLINE'))}
          </span>
        </div>
      </div>

      {/* Main D3 Graphic Visualizer Container */}
      <div className="relative bg-slate-950 border border-slate-900 rounded-xl overflow-hidden p-2">
        
        {/* Cursor tracking overlay indicators */}
        <div className="absolute top-3 left-4 flex space-x-3 pointer-events-none select-none z-10 font-mono text-[9px]">
          {isDrawingMode ? (
            <div className="bg-cyan-950/95 border border-cyan-800/80 text-cyan-400 px-3 py-2 rounded shadow-2xl flex items-center space-x-2 border-dashed text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-extrabold uppercase tracking-tight">MODE GAMBAR: Klik di chart untuk memasang Trendline Horizontal (Support/Resistance)</span>
            </div>
          ) : hoveredData ? (
            <div className="bg-slate-900/95 border border-slate-800 text-slate-300 px-3 py-2 rounded shadow-2xl flex flex-wrap gap-x-3 items-center animate-fade-in text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>O: <strong className="text-white">{priceFormattor(hoveredData.open)}</strong></span>
              <span>H: <strong className="text-emerald-400">{priceFormattor(hoveredData.high)}</strong></span>
              <span>L: <strong className="text-rose-400">{priceFormattor(hoveredData.low)}</strong></span>
              <span>C: <strong className={`${hoveredData.close >= hoveredData.open ? 'text-emerald-400' : 'text-rose-400'}`}>{priceFormattor(hoveredData.close)}</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-mono text-[9px]">{hoveredData.time.toLocaleTimeString()}</span>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/40 text-slate-400 px-2 py-1 rounded shadow flex items-center space-x-1">
              <Sparkles size={11} className="text-emerald-500" />
              <span>ARAHKAN MOUSE KE CANDLE UNTUK DETIL OPEN / HIGH / LOW / CLOSE (OHLC)</span>
            </div>
          )}
        </div>

        {/* The responsive D3 canvas */}
        <div ref={containerRef} className="w-full h-[320px] transition-all">
          <svg 
            ref={svgRef} 
            width={dimensions.width} 
            height={dimensions.height}
            className={`overflow-visible select-none pointer-events-auto ${isDrawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
          />
        </div>
      </div>

      {/* Educational notice block */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-3 flex items-start space-x-2.5">
        <AlertCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-[10px] font-mono text-slate-400 leading-normal">
          <span className="text-slate-200 font-bold block uppercase mb-0.5">💡 INTEGRASI DAN SINKRONISASI AI</span>
          Setiap fluktuasi garis grafik di atas dikomparasikan ke model kecerdasan buatan (Gemini). Saat Anda berpindah kembali ke tab <span className="text-emerald-400 font-extrabold underline cursor-pointer">"Analisa Sinyal"</span>, data harga dan level pivot dari charts ini langsung dialirkan secara otomatis untuk mendapatkan rujukan target profit dan stop loss yang paling presisi.
        </div>
      </div>

    </div>
  );
}
