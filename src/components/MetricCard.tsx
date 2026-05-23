import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorClass?: string;
}

export default function MetricCard({ title, value, subtitle, icon, trend, colorClass = 'text-green-400' }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-mono font-bold text-white mt-2 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 bg-neutral-800/80 rounded-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center space-x-1">
          <span className={`text-xs font-mono font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.isPositive ? '▲' : '▼'} {trend.value}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">VS KINERJA SEBELUMNYA</span>
        </div>
      )}
    </motion.div>
  );
}
