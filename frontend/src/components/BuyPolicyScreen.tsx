import React, { useState } from 'react';
import { Plane, Calendar, Shield, Sparkles, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { purchasePolicy, CONTRACT_ADDRESS } from '../lib/genlayer';
import { Policy } from '../types';

interface BuyPolicyScreenProps {
  userAddress: string;
  onPolicyCreated: (newPolicy: Policy) => void;
  onSuccessNavigate: () => void;
}

export const BuyPolicyScreen: React.FC<BuyPolicyScreenProps> = ({
  userAddress,
  onPolicyCreated,
  onSuccessNavigate,
}) => {
  const [flightNumber, setFlightNumber] = useState('BA1420');
  const [departureDate, setDepartureDate] = useState('2026-10-20');
  const [premiumGen, setPremiumGen] = useState(0.01);
  const [policyPreset, setPolicyPreset] = useState(
    'Severe delay >= 3 hours or cancellation. Payout 100% of coverage pool.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [successResult, setSuccessResult] = useState<{ policy: Policy; txHash: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const coverageGen = Number((premiumGen * 5).toFixed(3));

  const presets = [
    {
      title: 'Standard Delay & Cancellation',
      desc: 'Severe delay >= 3 hours or flight cancellation. 100% full coverage.',
      text: 'Severe delay >= 3 hours or cancellation. Payout 100% of coverage pool.',
    },
    {
      title: 'Tiered Delay Schedule',
      desc: '2h delay pays 50%, >= 4h pays 100%. Mechanical & operational defects.',
      text: 'Delay between 2h and 3h59m pays 50%. Delay >= 4 hours pays 100%. Force majeure excluded.',
    },
    {
      title: 'Comprehensive Irregular Operations',
      desc: 'Covers tarmac holds, diversion, carrier crew timeout, and missed connections.',
      text: 'Flight diversion, tarmac delay > 2 hours, or carrier crew timeout. 100% full coverage.',
    },
  ];

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMessage('');

    if (!flightNumber.trim()) {
      setErrorMsg('Please specify a flight number');
      return;
    }
    if (!departureDate) {
      setErrorMsg('Please choose a departure date');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await purchasePolicy(
        flightNumber.trim(),
        departureDate,
        policyPreset,
        premiumGen,
        (msg) => setStatusMessage(msg)
      );
      setSuccessResult(result);
      onPolicyCreated(result.policy);
    } catch (err: any) {
      console.error('Buy policy on-chain transaction failed:', err);
      setErrorMsg(err?.message || 'Transaction failed on GenLayer Studionet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Purchase Autonomous Flight Coverage
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Executes real <code className="text-blue-400">buy_policy</code> transaction directly on GenLayer Intelligent Contract <code className="text-slate-300 font-mono text-xs">{CONTRACT_ADDRESS.slice(0, 10)}...</code>.
        </p>
      </div>

      {successResult ? (
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/30 text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Policy Confirmed On-Chain via GenLayer Consensus
            </span>
            <h3 className="text-2xl font-bold text-white font-mono">{successResult.policy.policy_id}</h3>
            <p className="text-slate-400 text-sm">
              Covering flight <strong className="text-white">{successResult.policy.flight_number}</strong> on{' '}
              <span className="text-slate-200">{successResult.policy.departure_date}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-xs text-slate-500">Premium Locked</p>
              <p className="text-lg font-bold text-blue-400 font-mono">{successResult.policy.premium} GEN</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Coverage Pool</p>
              <p className="text-lg font-bold text-emerald-400 font-mono">{successResult.policy.coverage_amount} GEN</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto text-left text-xs font-mono">
            <span className="text-slate-500 block mb-1">On-Chain Transaction Hash:</span>
            <span className="text-blue-400 break-all">{successResult.txHash}</span>
          </div>

          <div className="pt-2 flex justify-center space-x-3">
            <button
              onClick={() => setSuccessResult(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Issue Another Policy
            </button>
            <button
              onClick={onSuccessNavigate}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
            >
              View Contract Policies
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBuy} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">On-Chain Transaction Error</p>
                <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Flight Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Plane className="w-3.5 h-3.5 text-blue-400" />
                <span>Flight Number (IATA/ICAO)</span>
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={e => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="e.g. BA1420, LH400, UA901"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono uppercase text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Departure Date</span>
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Premium & Coverage Slider */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Premium
                </label>
                <p className="text-xs text-slate-500">Payable amount attached to on-chain transaction</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-blue-400 font-mono">{premiumGen} GEN</span>
              </div>
            </div>

            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={premiumGen}
              onChange={e => setPremiumGen(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Parametric Coverage Multiplier (5x):</span>
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">{coverageGen} GEN</span>
            </div>
          </div>

          {/* Policy Terms Presets */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select Policy Terms / Coverage Rules</span>
            </label>
            <div className="space-y-2">
              {presets.map((preset, index) => (
                <div
                  key={index}
                  onClick={() => setPolicyPreset(preset.text)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    policyPreset === preset.text
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-sm shadow-blue-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{preset.title}</span>
                    <input
                      type="radio"
                      name="preset"
                      checked={policyPreset === preset.text}
                      onChange={() => setPolicyPreset(preset.text)}
                      className="accent-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{preset.desc}</p>
                </div>
              ))}
            </div>
            <textarea
              value={policyPreset}
              onChange={e => setPolicyPreset(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Submit */}
          {isSubmitting ? (
            <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
              <div className="flex items-center space-x-3 text-blue-300">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 shrink-0" />
                <span className="text-xs font-mono font-medium">{statusMessage || 'Processing transaction on GenLayer...'}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transaction is interacting with GenLayer Studionet validators. Waiting for block inclusion and majority agree.
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Shield className="w-5 h-5" />
              <span>Lock {premiumGen} GEN & Execute On-Chain Buy</span>
            </button>
          )}
        </form>
      )}
    </div>
  );
};
