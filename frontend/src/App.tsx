import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { BuyPolicyScreen } from './components/BuyPolicyScreen';
import { FileClaimScreen } from './components/FileClaimScreen';
import { VerdictViewer } from './components/VerdictViewer';
import { PolicyList } from './components/PolicyList';
import { DemoScenariosScreen } from './components/DemoScenariosScreen';
import { fetchPoolSummary, fetchAllPolicies, fetchAllClaims, CONTRACT_ADDRESS } from './lib/genlayer';
import { WalletState, checkWalletConnection, connectWallet, switchToStudionet } from './lib/wallet';
import { Policy, ClaimRecord, PoolSummary, DemoScenario } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletState, setWalletState] = useState<WalletState>({
    address: '',
    chainId: null,
    balance: '0',
    isConnected: false,
    isCorrectNetwork: false,
  });
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [summary, setSummary] = useState<PoolSummary>({
    total_policies: 0,
    total_claims: 0,
    total_coverage_pool: 0,
    total_premiums_collected: 0,
    total_payouts_distributed: 0,
    active_coverage: 0,
  });
  const [latestClaim, setLatestClaim] = useState<ClaimRecord | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');

  const loadOnChainData = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      // Fetch all state directly from the Intelligent Contract
      const [sum, pols, clms] = await Promise.all([
        fetchPoolSummary(),
        fetchAllPolicies(),
        fetchAllClaims(),
      ]);

      setSummary(sum);
      setPolicies(pols);
      setClaims(clms);

      if (clms.length > 0) {
        setLatestClaim(clms[0]);
      }
      if (pols.length > 0) {
        setSelectedPolicyId(pols[0].policy_id);
      }
    } catch (e: any) {
      console.error('Failed to load contract state:', e);
      setLoadError(e?.message || 'Error connecting to GenLayer Intelligent Contract');
    } finally {
      setIsLoading(false);
    }
  };

  // Wallet event listeners and initial check
  useEffect(() => {
    checkWalletConnection().then(setWalletState);
    loadOnChainData();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      const handleAccountsChanged = async () => {
        const state = await checkWalletConnection();
        setWalletState(state);
        loadOnChainData();
      };

      const handleChainChanged = async () => {
        const state = await checkWalletConnection();
        setWalletState(state);
        loadOnChainData();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      const state = await connectWallet();
      setWalletState(state);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      alert(err?.message || 'Failed to connect wallet');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToStudionet();
      const state = await checkWalletConnection();
      setWalletState(state);
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      alert(err?.message || 'Failed to switch network');
    }
  };

  const handlePolicyCreated = async (newPolicy: Policy) => {
    // Re-fetch genuine state directly from contract
    await loadOnChainData();
    const updatedState = await checkWalletConnection();
    setWalletState(updatedState);
    setActiveTab('dashboard');
  };

  const handleClaimSettled = async (claim: ClaimRecord) => {
    setLatestClaim(claim);
    // Re-fetch genuine state directly from contract
    await loadOnChainData();
    const updatedState = await checkWalletConnection();
    setWalletState(updatedState);
    setActiveTab('verdicts');
  };

  const handleSelectScenario = (scenario: DemoScenario) => {
    if (policies.length > 0) {
      setSelectedPolicyId(policies[0].policy_id);
    }
    setActiveTab('claim');
  };

  const handleClaimPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setActiveTab('claim');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletState={walletState}
        onConnect={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>Contract Read Notice: {loadError}</span>
            </div>
            <button
              onClick={loadOnChainData}
              className="px-3 py-1 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-white text-xs font-semibold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

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
            walletState={walletState}
            onConnectWallet={handleConnectWallet}
            onSwitchNetwork={handleSwitchNetwork}
            onPolicyCreated={handlePolicyCreated}
            onSuccessNavigate={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'claim' && (
          <FileClaimScreen
            policies={policies}
            selectedPolicyId={selectedPolicyId}
            walletState={walletState}
            onConnectWallet={handleConnectWallet}
            onSwitchNetwork={handleSwitchNetwork}
            onClaimSettled={handleClaimSettled}
          />
        )}

        {activeTab === 'verdicts' && (
          <VerdictViewer
            claims={claims}
            activeClaim={latestClaim}
            onFileAnother={() => setActiveTab('claim')}
          />
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
              ClaimGuard &copy; 2026. Intelligent Contract:{' '}
              <a
                href={`https://studio.genlayer.com/contracts/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-mono"
              >
                {CONTRACT_ADDRESS}
              </a>
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
