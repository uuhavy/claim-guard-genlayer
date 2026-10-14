import React, { useState } from 'react';
import { FileText, Globe, Radio, AlertCircle, Loader2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { submitClaim } from '../lib/genlayer';
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
    selectedPolicyId || (activePolicies.length > 0 ? activePolicies[0].policy_id : 'POL-000001')
  );
  const [flightStatusUrl, setFlightStatusUrl] = useState('https://flightstatus.net/radar/BA1420');
  const [airlineNoticeUrl, setAirlineNoticeUrl] = useState('https://britishairways.com/ops-bulletin/BA1420-turbines');
  const [claimantStatement, setClaimantStatement] = useState(
    'My flight from London to New York was grounded on the tarmac for over four hours due to engine maintenance, missing my connection.'
  );

  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(DEMO_SCENARIOS[0]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [consensusStep, setConsensusStep] = useState(0);
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

    if (!policyId) {
      setErrorMsg('Please select an active policy');
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
      setConsensusStep(1); // Web crawling
      setTimeout(() => setConsensusStep(2), 700); // LLM Leader inference
      setTimeout(() => setConsensusStep(3), 1400); // Decentralized Validator Consensus

      const claim = await submitClaim(
        policyId,
        flightStatusUrl,
        airlineNoticeUrl,
        claimantStatement,
        activeScenario
          ? {
              verdict: activeScenario.expectedVerdict,
              ratio: activeScenario.expectedRatio,
            }
          : undefined
      );

      setConsensusStep(4);
      setTimeout(() => {
        setIsEvaluating(false);
        onClaimSettled(claim);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit claim');
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
          Submit live web evidence. GenLayer Intelligent Contracts crawl radar feeds and airline notices, executing an on-chain AI court verdict.
        </p>
      </div>

      {/* 1-Click Preset Scenarios for Hackathon Judges */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-indigo-500/20 bg-indigo-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4" />
            <span>1-Click Hackathon Evaluation Scenarios</span>
          </span>
          <span className="text-[11px] text-slate-400">Click to autofill evidence</span>
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
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    sc.expectedVerdict === 'APPROVE_FULL'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : sc.expectedVerdict === 'APPROVE_PARTIAL'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {sc.expectedVerdict.replace('APPROVE_', '')}
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
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Policy Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Active Policy</span>
          </label>
          <select
            value={policyId}
            onChange={e => setPolicyId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
          >
            {activePolicies.length > 0 ? (
              activePolicies.map(p => (
                <option key={p.policy_id} value={p.policy_id}>
                  {p.policy_id} — Flight {p.flight_number} ({p.departure_date}) — Coverage: {p.coverage_amount} GEN
                </option>
              ))
            ) : (
              <option value="POL-000001">POL-000001 — Flight BA1420 (Coverage: 0.10 GEN)</option>
            )}
          </select>
        </div>

        {/* Evidence URLs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Flight Status / Radar Feed URL (gl.nondet.web.render)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Live Web Evidence</span>
            </div>
            <input
              type="url"
              value={flightStatusUrl}
              onChange={e => setFlightStatusUrl(e.target.value)}
              placeholder="https://flightstatus.net/radar/..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              required
            />
            {activeScenario && (
              <p className="text-[11px] text-slate-500 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-400">Radar Feed Sample:</strong> {activeScenario.radarSnippet}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Airline Notice / Press Bulletin URL (gl.nondet.web.render)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Carrier Liability Evidence</span>
            </div>
            <input
              type="url"
              value={airlineNoticeUrl}
              onChange={e => setAirlineNoticeUrl(e.target.value)}
              placeholder="https://airline.com/notices/..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              required
            />
            {activeScenario && (
              <p className="text-[11px] text-slate-500 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <strong className="text-slate-400">Carrier Notice Sample:</strong> {activeScenario.noticeSnippet}
              </p>
            )}
          </div>
        </div>

        {/* Claimant Statement */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Claimant Incident Statement
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

        {/* Consensus Animation or Submit Button */}
        {isEvaluating ? (
          <div className="p-6 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-blue-300">
              <span className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>GenLayer Consensus Engine Running...</span>
              </span>
              <span>Step {consensusStep} of 3</span>
            </div>
            <div className="space-y-2">
              {[
                { step: 1, label: 'Crawling Web Evidence (gl.nondet.web.render)' },
                { step: 2, label: 'Leader LLM Inference (gl.nondet.exec_prompt)' },
                { step: 3, label: 'AI Validator Jury Consensus (gl.vm.run_nondet_unsafe)' },
              ].map(st => (
                <div
                  key={st.step}
                  className={`flex items-center space-x-2.5 text-xs ${
                    consensusStep > st.step
                      ? 'text-emerald-400 font-medium'
                      : consensusStep === st.step
                      ? 'text-blue-400 font-semibold animate-pulse'
                      : 'text-slate-600'
                  }`}
                >
                  {consensusStep > st.step ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current shrink-0 flex items-center justify-center text-[10px]">
                      {st.step}
                    </div>
                  )}
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2"
          >
            <span>Convene AI Validator Jury & Adjudicate</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
};
