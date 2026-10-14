import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, AlertTriangle, XCircle, Globe, Radio } from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/mockScenarios';
import { DemoScenario } from '../types';

interface DemoScenariosScreenProps {
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const DemoScenariosScreen: React.FC<DemoScenariosScreenProps> = ({ onSelectScenario }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-medium text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Hackathon Evaluation Suite</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Live Test Scenarios for GenLayer Judges
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Test ClaimGuard with real-world aviation dispute patterns. Each scenario exercises GenLayer's non-deterministic web rendering and LLM semantic consensus.
        </p>
      </div>

      <div className="space-y-4">
        {DEMO_SCENARIOS.map((sc, index) => {
          const isFull = sc.expectedVerdict === 'APPROVE_FULL';
          const isPartial = sc.expectedVerdict === 'APPROVE_PARTIAL';

          return (
            <div
              key={sc.id}
              className="glass-panel rounded-3xl p-6 sm:p-7 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isFull
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isPartial
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{sc.title}</h3>
                    <p className="text-xs text-slate-400">
                      Airline: <span className="text-slate-200">{sc.airline}</span> | Flight:{' '}
                      <span className="font-mono text-blue-400">{sc.flightNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                      isFull
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isPartial
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    Expected: {sc.expectedVerdict} ({sc.expectedRatio}%)
                  </span>

                  <button
                    onClick={() => onSelectScenario(sc)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
                  >
                    <span>Run Scenario</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Evidence Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 flex items-center space-x-1 font-semibold text-[11px]">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Radar Telemetry:</span>
                  </span>
                  <p className="text-slate-300 italic font-mono text-[11px] leading-relaxed">
                    "{sc.radarSnippet}"
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 flex items-center space-x-1 font-semibold text-[11px]">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Carrier Press Bulletin:</span>
                  </span>
                  <p className="text-slate-300 italic font-mono text-[11px] leading-relaxed">
                    "{sc.noticeSnippet}"
                  </p>
                </div>
              </div>

              {/* Policy Terms */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400">
                <strong className="text-slate-300">Policy Terms:</strong> {sc.policyTerms}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
