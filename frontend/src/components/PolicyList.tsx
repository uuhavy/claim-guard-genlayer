import React from 'react';
import { Plane, Shield, ExternalLink, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Policy } from '../types';

interface PolicyListProps {
  policies: Policy[];
  onSelectClaim: (policyId: string) => void;
  onOpenBuy: () => void;
}

export const PolicyList: React.FC<PolicyListProps> = ({ policies, onSelectClaim, onOpenBuy }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Active & Historical Policies</h3>
          <p className="text-xs text-slate-400">Policies registered on the GenLayer Intelligent Contract</p>
        </div>
        <button
          onClick={onOpenBuy}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <span>New Policy</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {policies.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3">
          <Plane className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No policies issued yet.</p>
          <button
            onClick={onOpenBuy}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Purchase Your First Policy
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4">Policy ID</th>
                  <th className="py-3 px-4">Flight</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Premium</th>
                  <th className="py-3 px-4">Coverage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {policies.map(p => {
                  const isActive = p.status === 'ACTIVE';
                  const isSettled = p.status === 'SETTLED';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr key={p.policy_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">{p.policy_id}</td>
                      <td className="py-3.5 px-4 font-mono text-blue-400 font-bold">{p.flight_number}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.departure_date}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{p.premium} GEN</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                        {p.coverage_amount} GEN
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isSettled
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isActive ? (
                          <button
                            onClick={() => onSelectClaim(p.policy_id)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors shadow-sm shadow-blue-500/20"
                          >
                            File Claim
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
