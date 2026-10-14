import React, { useState } from 'react';
import { Shield, Plane, Activity, Copy, Check, ExternalLink, Wallet } from 'lucide-react';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../lib/genlayer';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userAddress: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userAddress }) => {
  const [copied, setCopied] = useState(false);

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddress = (addr: string) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
                <Plane className="w-3.5 h-3.5 text-cyan-300 absolute -top-1 -right-1 transform rotate-45" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
                  ClaimGuard
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  GenLayer
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous AI Parametric Insurance</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'buy', label: 'Buy Policy' },
              { id: 'claim', label: 'File Claim' },
              { id: 'verdicts', label: 'AI Jury Verdicts' },
              { id: 'scenarios', label: '1-Click Demos' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Network & Wallet Status */}
          <div className="flex items-center space-x-3">
            {/* Studionet / Testnet Status */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-mono">Studionet ({CHAIN_ID})</span>
            </div>

            {/* Contract Address Pill */}
            <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <span className="text-[11px] font-mono text-slate-500">Contract:</span>
              <button
                onClick={copyContract}
                title="Click to copy contract address"
                className="font-mono text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>{shortAddress(CONTRACT_ADDRESS)}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              <a
                href={`https://studio.genlayer.com/contracts/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                title="View on GenLayer Studio"
                className="text-slate-400 hover:text-white p-0.5"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Connected Wallet */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/30 text-xs text-blue-300">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono font-medium">{shortAddress(userAddress)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
