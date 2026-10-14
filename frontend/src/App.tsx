import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { BuyPolicyScreen } from './components/BuyPolicyScreen';
import { FileClaimScreen } from './components/FileClaimScreen';
import { VerdictViewer } from './components/VerdictViewer';
import { PolicyList } from './components/PolicyList';
import { DemoScenariosScreen } from './components/DemoScenariosScreen';
import { fetchPoolSummary, fetchAllPolicies } from './lib/genlayer';
import { Policy, ClaimRecord, PoolSummary, DemoScenario } from './types';
import { DEMO_SCENARIOS } from './data/mockScenarios';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userAddress] = useState('0x38F14E3b2169E2E416f082e668D8436E92b51336');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [summary, setSummary] = useState<PoolSummary>({
    total_policies: 2,
    total_claims: 0,
    total_coverage_pool: 0.15,
    total_premiums_collected: 0.03,
    total_payouts_distributed: 0,
    active_coverage: 0.15,
  });
  const [latestClaim, setLatestClaim] = useState<ClaimRecord | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('POL-000001');

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [sum, pols] = await Promise.all([fetchPoolSummary(), fetchAllPolicies()]);
        setSummary(sum);
        setPolicies(pols);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      }
    };
    loadInitialData();
  }, []);

  const handlePolicyCreated = (newPolicy: Policy) => {
    setPolicies(prev => [newPolicy, ...prev]);
    setSummary(prev => ({
      ...prev,
      total_policies: prev.total_policies + 1,
      total_premiums_collected: prev.total_premiums_collected + newPolicy.premium,
      total_coverage_pool: prev.total_coverage_pool + newPolicy.coverage_amount,
      active_coverage: prev.active_coverage + newPolicy.coverage_amount,
    }));
  };

  const handleClaimSettled = (claim: ClaimRecord) => {
    setLatestClaim(claim);
    setPolicies(prev =>
      prev.map(p =>
        p.policy_id === claim.policy_id
          ? { ...p, status: claim.verdict === 'REJECT' ? 'REJECTED' : 'SETTLED' }
          : p
      )
    );
    setSummary(prev => ({
      ...prev,
      total_claims: prev.total_claims + 1,
      total_payouts_distributed: prev.total_payouts_distributed + claim.payout_amount,
      active_coverage: Math.max(0, prev.active_coverage - claim.payout_amount * 5),
    }));
    setActiveTab('verdicts');
  };

  const handleSelectScenario = (scenario: DemoScenario) => {
    setSelectedPolicyId(policies[0]?.policy_id || 'POL-000001');
    setActiveTab('claim');
  };

  const handleClaimPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setActiveTab('claim');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userAddress={userAddress} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-10">
            <DashboardStats
              summary={summary}
              onOpenBuy={() => setActiveTab('buy')}
              onOpenFileClaim={() => setActiveTab('claim')}
            />
            <PolicyList
              policies={policies}
              onSelectClaim={handleClaimPolicy}
              onOpenBuy={() => setActiveTab('buy')}
            />
          </div>
        )}

        {activeTab === 'buy' && (
          <BuyPolicyScreen
            userAddress={userAddress}
            onPolicyCreated={handlePolicyCreated}
            onSuccessNavigate={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'claim' && (
          <FileClaimScreen
            policies={policies}
            selectedPolicyId={selectedPolicyId}
            onClaimSettled={handleClaimSettled}
          />
        )}

        {activeTab === 'verdicts' && (
          <div>
            {latestClaim ? (
              <VerdictViewer
                claim={latestClaim}
                onFileAnother={() => setActiveTab('claim')}
              />
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
                  <span className="font-mono text-lg font-bold">gl</span>
                </div>
                <h3 className="text-xl font-bold text-white">No Verdict Rendered Yet</h3>
                <p className="text-sm text-slate-400">
                  Submit a claim to convene GenLayer's AI validator court and view the judicial ruling in real time.
                </p>
                <button
                  onClick={() => setActiveTab('claim')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
                >
                  File a Claim Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <DemoScenariosScreen onSelectScenario={handleSelectScenario} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p>
              ClaimGuard &copy; 2026. Built natively for the{' '}
              <strong className="text-slate-300">GenLayer Blockchain</strong>.
            </p>
          </div>
          <div className="flex items-center space-x-4 font-mono">
            <span>gl.nondet.web.render</span>
            <span>&bull;</span>
            <span>gl.nondet.exec_prompt</span>
            <span>&bull;</span>
            <span>gl.vm.run_nondet_unsafe</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
