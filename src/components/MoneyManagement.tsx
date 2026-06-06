import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Calculator } from 'lucide-react';

export default function MoneyManagement() {
  const [accountSize, setAccountSize] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [leverage, setLeverage] = useState('1');

  // Calculations
  const account = parseFloat(accountSize) || 0;
  const risk = parseFloat(riskPercent) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;

  // Risk-per-trade
  const riskAmount = (account * risk) / 100;

  // Lot/Posisi size
  const pipsDifference = Math.abs(entry - sl);
  const positionSize = pipsDifference > 0 ? riskAmount / pipsDifference : 0;

  // Reward
  const profitAmount = Math.abs(tp - entry) * positionSize;
  const riskRewardRatio = pipsDifference > 0 ? Math.abs(tp - entry) / pipsDifference : 0;

  // Margin & Leverage
  const marginUsed = (positionSize * entry) / parseFloat(leverage);
  const marginPercent = account > 0 ? (marginUsed / account) * 100 : 0;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800">
      <div className="flex items-center space-x-3 mb-6">
        <Calculator className="text-cyan-400" size={24} />
        <h2 className="text-xl font-bold text-white">💰 MONEY MANAGEMENT CALCULATOR</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account & Risk */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Account Size (USD)</label>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
            placeholder="10000"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Risk Per Trade (%)</label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
            placeholder="2"
            step="0.5"
          />
          <p className="text-[10px] text-slate-500 mt-1">Recommended: 1-3%</p>
        </div>

        {/* Entry, SL, TP */}
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Entry Price</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Stop Loss Price</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Take Profit Price</label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2">Leverage</label>
          <select
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:border-cyan-500 outline-none"
          >
            <option value="1">1x (No Leverage)</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="20">20x</option>
            <option value="50">50x</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
          <p className="text-[10px] text-slate-400 uppercase">Max Risk</p>
          <p className="text-lg font-bold text-red-400">${riskAmount.toFixed(2)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
          <p className="text-[10px] text-slate-400 uppercase">Position Size</p>
          <p className="text-lg font-bold text-cyan-400">{positionSize.toFixed(4)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
          <p className="text-[10px] text-slate-400 uppercase">Max Profit</p>
          <p className="text-lg font-bold text-emerald-400">${profitAmount.toFixed(2)}</p>
        </div>

        <div className={`bg-slate-800/50 border rounded p-3 ${riskRewardRatio >= 1.5 ? 'border-emerald-500' : 'border-amber-500'}`}>
          <p className="text-[10px] text-slate-400 uppercase">Risk:Reward</p>
          <p className={`text-lg font-bold ${riskRewardRatio >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            1:{riskRewardRatio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Margin Info */}
      <div className={`border rounded-lg p-4 ${marginPercent > 50 ? 'border-red-500 bg-red-500/10' : marginPercent > 30 ? 'border-amber-500 bg-amber-500/10' : 'border-emerald-500 bg-emerald-500/10'}`}>
        <div className="flex items-center space-x-2 mb-2">
          {marginPercent > 50 ? (
            <AlertTriangle className="text-red-400" size={16} />
          ) : (
            <CheckCircle2 className="text-emerald-400" size={16} />
          )}
          <p className="font-bold text-white">Margin Usage: {marginPercent.toFixed(1)}%</p>
        </div>
        <p className="text-xs text-slate-300">
          {marginPercent > 50
            ? '⚠️ High margin usage - risk of liquidation'
            : marginPercent > 30
            ? '⚠️ Moderate margin - be careful'
            : '✓ Safe margin level'}
        </p>
      </div>

      {/* Tips */}
      <div className="bg-slate-800/30 border border-slate-700 rounded p-4">
        <p className="text-xs font-bold text-cyan-400 mb-2">💡 TRADING RULES:</p>
        <ul className="text-xs text-slate-300 space-y-1">
          <li>✓ Risk only 1-3% per trade (never more than 5%)</li>
          <li>✓ Risk:Reward ratio minimum 1:1.5</li>
          <li>✓ Keep margin usage below 30%</li>
          <li>✓ Never use more than 10x leverage for retail trading</li>
          <li>✓ Max 5 open trades at same time</li>
        </ul>
      </div>
    </div>
  );
}
