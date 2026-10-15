import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, AlertTriangle, Scale, ExternalLink, Cpu } from 'lucide-react';
import { ClaimRecord } from '../types';
import { CONTRACT_ADDRESS } from '../lib/genlayer';

interface VerdictViewerProps {
  claims: ClaimRecord[];
  activeClaim?: ClaimRecord | null;
  onFileAnother: () => void;
}

export const VerdictViewer: React.FC<VerdictViewerProps> = ({ claims, activeClaim, onFileAnother }) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(
    activeClaim?.claim_id || (claims.length > 0 ? claims[0].claim_id : '')
  );

  const displayClaim = claims.find(c => c.claim_id === selectedClaimId) || activeClaim || claims[0];

  if (!displayClaim) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
          <Scale className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">No On-Chain Verdicts Yet</h3>
        <p className="text-sm text-slate-400">
          File a flight delay claim to convene GenLayer's AI validator court and view the judicial ruling recorded on-chain.
        </p>
        <button
          onClick={onFileAnother}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
        >
          File a Claim Now
        </button>
      </div>
    );
  }

  const isApprovedFull = displayClaim.verdict === 'APPROVE_FULL';
  const isApprovedPartial = displayClaim.verdict === 'APPROVE_PARTIAL';

  const verdictMeta = {
    APPROVE_FULL: {
      badge: 'APPROVE FULL',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      glow: 'shadow-emerald-500/20',
      icon: CheckCircle2,
      headline: 'Claim Approved — Full Payout Released',
      desc: 'The decentralized AI jury determined carrier liability under policy terms.',
    },
    APPROVE_PARTIAL: {
      badge: 'APPROVE PARTIAL',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      glow: 'shadow-amber-500/20',
      icon: AlertTriangle,
      headline: 'Partial Claim Approved — Tiered Payout Released',
      desc: 'Partial delay or shared responsibility verified under the policy schedule.',
    },
    REJECT: {
      badge: 'REJECT CLAIM',
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      glow: 'shadow-rose-500/20',
      icon: XCircle,
      headline: 'Claim Denied — Zero Payout',
      desc: 'Radar telemetry or carrier evidence contradicts the claimant statement or falls under exclusions.',
    },
  }[displayClaim.verdict] || {
    badge: displayClaim.verdict,
    color: 'bg-slate-800 text-slate-300 border-slate-700',
    glow: '',
    icon: Scale,
    headline: 'Verdict Settled',
    desc: 'Judicial adjudication finalized.',
  };

  const Icon = verdictMeta.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-medium text-blue-400">
          <Scale className="w-3.5 h-3.5" />
          <span>GenLayer Autonomous Judicial Ruling</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          AI Validator Jury Verdict
        </h2>
        <p className="text-slate-400 text-sm font-mono">
          Settled On-Chain on Contract: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-4)}
        </p>
      </div>

      {/* Claim Switcher if multiple claims exist */}
      {claims.length > 1 && (
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-mono">Select Claim:</span>
          {claims.map(c => (
            <button
              key={c.claim_id}
              onClick={() => setSelectedClaimId(c.claim_id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                displayClaim.claim_id === c.claim_id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.claim_id} ({c.verdict})
            </button>
          ))}
        </div>
      )}

      {/* Main Ruling Card */}
      <div className={`glass-panel rounded-3xl p-6 sm:p-8 border ${isApprovedFull ? 'border-emerald-500/30' : isApprovedPartial ? 'border-amber-500/30' : 'border-rose-500/30'} space-y-6 shadow-2xl`}>
        {/* Header Verdict Badge & Amount */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${verdictMeta.color} shadow-lg ${verdictMeta.glow}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${verdictMeta.color}`}>
                  {verdictMeta.badge}
                </span>
                <span className="text-xs font-mono text-slate-400 font-semibold">{displayClaim.claim_id}</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">{verdictMeta.headline}</h3>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs text-slate-500 font-medium">On-Chain Payout</p>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {displayClaim.payout_amount.toFixed(3)} <span className="text-sm font-normal text-blue-400">GEN</span>
            </p>
          </div>
        </div>

        {/* Meters: Payout Ratio & AI Confidence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payout Ratio Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">Payout Ratio</span>
              <span className="font-mono font-bold text-white text-sm">{displayClaim.payout_ratio}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isApprovedFull
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : isApprovedPartial
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(displayClaim.payout_ratio, 3)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Bracket: {displayClaim.payout_ratio >= 80 ? 'FULL (>= 80%)' : displayClaim.payout_ratio >= 20 ? 'PARTIAL (20-79%)' : 'REJECT (< 20%)'}
            </p>
          </div>

          {/* AI Confidence Gauge */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Validator Confidence</span>
              </span>
              <span className="font-mono font-bold text-blue-400 text-sm">{displayClaim.confidence}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: `${displayClaim.confidence}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Band: {displayClaim.confidence >= 80 ? 'HIGH (>= 80%)' : displayClaim.confidence >= 40 ? 'MED (40-79%)' : 'LOW (< 40%)'}
            </p>
          </div>
        </div>

        {/* AI Jury Judicial Rationale Quote */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Validator Jury Judicial Rationale (From Intelligent Contract Storage)</span>
          </span>
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 relative">
            <div className="text-3xl font-serif text-slate-600 select-none absolute top-2 left-3">“</div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-5 font-normal italic">
              {displayClaim.rationale}
            </p>
          </div>
        </div>

        {/* Semantic Consensus Verification Matrix */}
        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-400">
            <span>GenLayer Semantic Consensus Verification Rules</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/20">CONFIRMED ON-CHAIN</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Verdict Matched</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Payout Bracket Aligned</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Confidence Band Concordant</span>
            </div>
          </div>
        </div>

        {/* Transaction Metadata */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span>Policy Covered:</span>
            <span className="text-slate-200">{displayClaim.policy_id}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Claimant Address:</span>
            <span className="text-slate-200 truncate max-w-[200px]">{displayClaim.claimant}</span>
          </div>
          {displayClaim.txHash && (
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>GenLayer Tx Hash:</span>
              <span className="text-blue-400 truncate max-w-[220px]">{displayClaim.txHash}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`https://studio.genlayer.com/contracts/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <span>View Contract on GenLayer Studio</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onFileAnother}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            File Another Flight Claim
          </button>
        </div>
      </div>
    </div>
  );
};
