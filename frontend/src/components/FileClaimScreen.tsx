import React, { useState } from 'react';
import { FileText, Globe, Radio, AlertCircle, Loader2, Sparkles, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';
import { submitClaim, CONTRACT_ADDRESS } from '../lib/genlayer';
import { DEMO_SCENARIOS } from '../data/mockScenarios';
import { Policy, ClaimRecord, DemoScenario } from '../types';

interface FileClaimScreenProps {
  policies: Policy[];
  onClaimSettled: (claim: ClaimRecord) => void;
  selectedPolicyId?: string;
}

export const FileClaimScreen: React.FC<FileClaimScreenProps> = ({
  policies,
  onClaimSettled,
  selectedPolicyId,
}) => {
  const activePolicies = policies.filter(p => p.status === 'ACTIVE');
  const [policyId, setPolicyId] = useState(
    selectedPolicyId || (activePolicies.length > 0 ? activePolicies[0].policy_id : (policies[0]?.policy_id || 'POL-000001'))
  );
  const [flightStatusUrl, setFlightStatusUrl] = useState('https://en.wikipedia.org/wiki/Flight');
  const [airlineNoticeUrl, setAirlineNoticeUrl] = useState('https://en.wikipedia.org/wiki/Airline');
  const [claimantStatement, setClaimantStatement] = useState(
    'Flight BA1420 suffered severe mechanical delay exceeding 4 hours due to unexpected engine defect.'
  );

  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(DEMO_SCENARIOS[0]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const applyScenario = (scenario: DemoScenario) => {
    setActiveScenario(scenario);
    setFlightStatusUrl(scenario.radarUrl);
    setAirlineNoticeUrl(scenario.noticeUrl);
    setClaimantStatement(scenario.claimantStatement);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMessage('');

    if (!policyId) {
      setErrorMsg('Please select an active policy from the contract');
      return;
    }
    if (!flightStatusUrl.startsWith('http://') && !flightStatusUrl.startsWith('https://')) {
      setErrorMsg('Flight radar URL must start with http:// or https://');
      return;
    }
    if (!airlineNoticeUrl.startsWith('http://') && !airlineNoticeUrl.startsWith('https://')) {
      setErrorMsg('Airline notice URL must start with http:// or https://');
      return;
    }
    if (!claimantStatement.trim()) {
      setErrorMsg('Please describe the disruption in the claimant statement');
      return;
    }

    try {
      setIsEvaluating(true);
      // Real on-chain file_claim execution on GenLayer Studionet
      const claim = await submitClaim(
        policyId,
        flightStatusUrl,
        airlineNoticeUrl,
        claimantStatement,
        (msg) => setStatusMessage(msg)
      );

      setIsEvaluating(false);
      onClaimSettled(claim);
    } catch (err: any) {
      console.error('On-chain file_claim transaction error:', err);
      setErrorMsg(err?.message || 'Transaction rejected or consensus failed on GenLayer');
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          File Flight Disruption Claim
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Triggers on-chain non-deterministic execution (<code className="text-blue-400 font-mono text-xs">gl.vm.run_nondet_unsafe</code>). Validators crawl both URLs and reach LLM consensus on Studionet.
        </p>
      </div>

      {/* 1-Click Preset Scenarios for Hackathon Judges */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-indigo-500/20 bg-indigo-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4" />
            <span>1-Click Hackathon Evidence Presets</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">Real Web Evidence URLs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DEMO_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              type="button"
              onClick={() => applyScenario(sc)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeScenario?.id === sc.id
                  ? 'bg-blue-600/20 border-blue-500/60 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white font-mono">{sc.flightNumber}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-blue-500/20 text-blue-300">
                  Preset
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{sc.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Claim Submission Form */}
      <form onSubmit={handleClaimSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">On-Chain Claim Error</p>
              <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Policy Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Select On-Chain Policy</span>
            </label>
            <span className="text-[10px] font-mono text-emerald-400">Read from contract</span>
          </div>
          <select
            value={policyId}
            onChange={e => setPolicyId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono text-xs sm:text-sm"
          >
            {policies.length > 0 ? (
              policies.map(p => (
                <option key={p.policy_id} value={p.policy_id}>
                  {p.policy_id} [{p.status}] — Flight {p.flight_number} ({p.departure_date}) — Coverage: {p.coverage_amount} GEN
                </option>
              ))
            ) : (
              <option value="POL-000001">Loading contract policies...</option>
            )}
          </select>
        </div>

        {/* Evidence URLs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Flight Status / Radar Feed URL (crawled by gl.nondet.web.render)</span>
              </label>
            </div>
            <input
              type="url"
              value={flightStatusUrl}
              onChange={e => setFlightStatusUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Airline Notice / Bulletin URL (crawled by gl.nondet.web.render)</span>
              </label>
            </div>
            <input
              type="url"
              value={airlineNoticeUrl}
              onChange={e => setAirlineNoticeUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              required
            />
          </div>
        </div>

        {/* Claimant Statement */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Claimant Incident Statement (Passed into on-chain LLM prompt)
          </label>
          <textarea
            value={claimantStatement}
            onChange={e => setClaimantStatement(e.target.value)}
            rows={3}
            placeholder="Explain the disruption, duration of delay, and airline conduct..."
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
            required
          />
        </div>

        {/* Real On-Chain Execution Status */}
        {isEvaluating ? (
          <div className="p-6 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-4">
            <div className="flex items-center space-x-3 text-xs font-mono text-blue-300">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
              <span className="font-semibold">{statusMessage || 'Transacting with GenLayer Validators...'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              GenLayer nodes are independently executing <code className="text-slate-300">gl.nondet.web.render</code> and <code className="text-slate-300">gl.nondet.exec_prompt</code> to achieve decentralized semantic consensus.
            </p>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2"
          >
            <span>Convene AI Validator Jury On-Chain</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
};
