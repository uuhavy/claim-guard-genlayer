import React from 'react';
import { ShieldCheck, Coins, Award, Users, AlertCircle, ArrowUpRight } from 'lucide-react';
import { PoolSummary } from '../types';

interface DashboardStatsProps {
  summary: PoolSummary;
  onOpenBuy: () => void;
  onOpenFileClaim: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ summary, onOpenBuy, onOpenFileClaim }) => {
  const cards = [
    {
      label: 'Total Policies Issued',
      value: summary.total_policies,
      unit: 'Policies',
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/10',
      textColor: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    {
      label: 'Active Coverage Pool',
      value: `${summary.active_coverage.toFixed(2)}`,
      unit: 'GEN',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-teal-500/10',
      textColor: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    {
      label: 'Total Premiums Locked',
      value: `${summary.total_premiums_collected.toFixed(2)}`,
      unit: 'GEN',
      icon: Coins,
      color: 'from-cyan-500/20 to-blue-500/10',
      textColor: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    {
      label: 'AI-Adjudicated Payouts',
      value: `${summary.total_payouts_distributed.toFixed(2)}`,
      unit: 'GEN',
      icon: Award,
      color: 'from-purple-500/20 to-pink-500/10',
      textColor: 'text-purple-400',
      border: 'border-purple-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-medium text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span>GenLayer Optimistic Democracy with LLM Validators</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Parametric Flight Insurance <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Adjudicated by AI Validator Juries
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminate centralized claims adjusters. When disruptions occur, GenLayer Intelligent Contracts
            crawl live airport radar feeds and carrier press notices, reaching consensus on subjective airline liability
            in seconds.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenBuy}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              <span>Buy Flight Coverage</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenFileClaim}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all"
            >
              File Claim with Evidence
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`glass-panel rounded-2xl p-5 border ${card.border} bg-gradient-to-br ${card.color} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`p-2 rounded-xl bg-slate-950/60 ${card.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                  {card.value}
                </span>
                <span className="text-xs font-semibold text-slate-400">{card.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
