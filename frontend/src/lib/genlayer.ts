import { createClient, createAccount, generatePrivateKey } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Policy, ClaimRecord, PoolSummary } from '../types';
import { isEthereumAvailable } from './wallet';

export const GENLAYER_RPC = import.meta.env.VITE_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const CONTRACT_ADDRESS: `0x${string}` = (import.meta.env.VITE_CONTRACT_ADDRESS || '0x4Fb3074F563582e1FF253870B48D06387b0f346D') as `0x${string}`;
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 61999);

// Read-only / fallback account for query reads
export function getStoredAccount() {
  let pk = '';
  try {
    pk = localStorage.getItem('claimguard_user_pk') || '';
  } catch (e) {}
  if (!pk) {
    pk = generatePrivateKey();
    try {
      localStorage.setItem('claimguard_user_pk', pk);
    } catch (e) {}
  }
  return createAccount(pk as `0x${string}`);
}

/**
 * Returns a GenLayer client.
 * If userAddress is provided and window.ethereum is available, routes through user's MetaMask!
 */
export function getClient(userAddress?: string) {
  if (userAddress && isEthereumAvailable()) {
    const ethereum = (window as any).ethereum;
    return createClient({
      chain: studionet,
      account: userAddress as `0x${string}`,
      provider: ethereum,
    });
  }

  const account = getStoredAccount();
  return createClient({
    chain: studionet,
    account,
  });
}

/**
 * Reads aggregate pool statistics directly from Intelligent Contract get_pool_summary()
 */
export async function fetchPoolSummary(): Promise<PoolSummary> {
  const client = getClient();
  const res = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_pool_summary',
    args: [],
  });

  if (!res) {
    throw new Error('Empty response from contract get_pool_summary');
  }

  const data = typeof res === 'string' ? JSON.parse(res) : res;
  return {
    total_policies: Number(data.total_policies || 0),
    total_claims: Number(data.total_claims || 0),
    total_coverage_pool: Number(data.total_coverage_pool || 0) / 1e18,
    total_premiums_collected: Number(data.total_premiums_collected || 0) / 1e18,
    total_payouts_distributed: Number(data.total_payouts_distributed || 0) / 1e18,
    active_coverage: Number(data.active_coverage || 0) / 1e18,
  };
}

/**
 * Reads all active & historical policies directly from the Intelligent Contract
 */
export async function fetchAllPolicies(): Promise<Policy[]> {
  const client = getClient();
  const summaryRes = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_pool_summary',
    args: [],
  });

  const summary = typeof summaryRes === 'string' ? JSON.parse(summaryRes) : summaryRes;
  const total = Number(summary.total_policies || 0);

  const policies: Policy[] = [];
  for (let i = total; i >= 1; i--) {
    const polId = `POL-${String(i).padStart(6, '0')}`;
    try {
      const polRes = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_policy',
        args: [polId],
      });
      const p = typeof polRes === 'string' ? JSON.parse(polRes) : polRes;
      policies.push({
        policy_id: p.policy_id,
        holder: p.holder,
        flight_number: p.flight_number,
        departure_date: p.departure_date,
        policy_terms: p.policy_terms,
        premium: Number(p.premium) / 1e18,
        coverage_amount: Number(p.coverage_amount) / 1e18,
        status: p.status,
        created_index: Number(p.created_index),
      });
    } catch (e) {
      console.warn(`Policy ${polId} read warning:`, e);
    }
  }
  return policies;
}

/**
 * Reads all settled claim records directly from the Intelligent Contract
 */
export async function fetchAllClaims(): Promise<ClaimRecord[]> {
  const client = getClient();
  const summaryRes = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_pool_summary',
    args: [],
  });

  const summary = typeof summaryRes === 'string' ? JSON.parse(summaryRes) : summaryRes;
  const total = Number(summary.total_claims || 0);

  const claims: ClaimRecord[] = [];
  for (let i = total; i >= 1; i--) {
    const claimId = `CLAIM-${String(i).padStart(6, '0')}`;
    try {
      const claimRes = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_claim',
        args: [claimId],
      });
      const c = typeof claimRes === 'string' ? JSON.parse(claimRes) : claimRes;
      claims.push({
        claim_id: c.claim_id,
        policy_id: c.policy_id,
        claimant: c.claimant,
        flight_status_url: c.flight_status_url,
        airline_notice_url: c.airline_notice_url,
        claimant_statement: c.claimant_statement,
        verdict: c.verdict,
        payout_ratio: Number(c.payout_ratio),
        payout_amount: Number(c.payout_amount) / 1e18,
        confidence: Number(c.confidence),
        rationale: c.rationale,
        resolved_index: Number(c.resolved_index),
      });
    } catch (e) {
      console.warn(`Claim ${claimId} read warning:`, e);
    }
  }
  return claims;
}

/**
 * Executes on-chain buy_policy transaction requiring user wallet signature
 */
export async function purchasePolicy(
  flightNumber: string,
  departureDate: string,
  policyTerms: string,
  premiumGen: number,
  userAddress: string,
  onStatusUpdate?: (status: string) => void
): Promise<{ policy: Policy; txHash: string }> {
  if (!userAddress) {
    throw new Error('Please connect your MetaMask wallet on GenLayer Studionet before purchasing coverage.');
  }

  const client = getClient(userAddress);
  const weiValue = BigInt(Math.floor(premiumGen * 1e18));

  onStatusUpdate?.('Please confirm and sign the transaction in your connected wallet...');
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'buy_policy',
    args: [flightNumber, departureDate, policyTerms],
    value: weiValue,
  });

  if (!txHash) {
    throw new Error('Transaction rejected or failed in wallet.');
  }

  onStatusUpdate?.(`Transaction signed & broadcast: ${txHash.slice(0, 10)}... Waiting for on-chain consensus receipt...`);
  const receipt: any = await client.waitForTransactionReceipt({ hash: txHash });

  const buyResultName = receipt.resultName || receipt.result_name;
  if (buyResultName && buyResultName !== 'MAJORITY_AGREE' && buyResultName !== 'AGREE') {
    throw new Error(`On-chain transaction consensus rejected: ${buyResultName}`);
  }

  onStatusUpdate?.('Consensus reached! Reading newly issued policy directly from contract...');

  const summaryRes = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_pool_summary',
    args: [],
  });
  const summary = typeof summaryRes === 'string' ? JSON.parse(summaryRes) : summaryRes;
  const latestId = `POL-${String(summary.total_policies).padStart(6, '0')}`;

  const polRes = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_policy',
    args: [latestId],
  });
  const p = typeof polRes === 'string' ? JSON.parse(polRes) : polRes;

  const policy: Policy = {
    policy_id: p.policy_id,
    holder: p.holder,
    flight_number: p.flight_number,
    departure_date: p.departure_date,
    policy_terms: p.policy_terms,
    premium: Number(p.premium) / 1e18,
    coverage_amount: Number(p.coverage_amount) / 1e18,
    status: p.status,
    created_index: Number(p.created_index),
  };

  return { policy, txHash };
}

/**
 * Executes on-chain file_claim transaction requiring user wallet signature
 */
export async function submitClaim(
  policyId: string,
  flightStatusUrl: string,
  airlineNoticeUrl: string,
  claimantStatement: string,
  userAddress: string,
  onStatusUpdate?: (status: string) => void
): Promise<ClaimRecord> {
  if (!userAddress) {
    throw new Error('Please connect your MetaMask wallet on GenLayer Studionet before filing a claim.');
  }

  const client = getClient(userAddress);

  onStatusUpdate?.('Please confirm and sign the claim transaction in your connected wallet...');
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'file_claim',
    args: [policyId, flightStatusUrl, airlineNoticeUrl, claimantStatement],
    value: BigInt(0),
  });

  if (!txHash) {
    throw new Error('Claim transaction rejected or failed in wallet.');
  }

  onStatusUpdate?.(`Transaction broadcast (${txHash.slice(0, 10)}...). GenLayer validators crawling web evidence & running LLM consensus...`);
  const receipt: any = await client.waitForTransactionReceipt({ hash: txHash });

  const claimResultName = receipt.resultName || receipt.result_name;
  if (claimResultName && claimResultName !== 'MAJORITY_AGREE' && claimResultName !== 'AGREE') {
    throw new Error(`On-chain AI Jury consensus rejected transaction: ${claimResultName}`);
  }

  onStatusUpdate?.('Consensus achieved! Reading verified judicial ruling directly from contract...');

  const summaryRes = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_pool_summary',
    args: [],
  });
  const summary = typeof summaryRes === 'string' ? JSON.parse(summaryRes) : summaryRes;
  const latestClaimId = `CLAIM-${String(summary.total_claims).padStart(6, '0')}`;

  const claimRes = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: 'get_claim',
    args: [latestClaimId],
  });
  const c = typeof claimRes === 'string' ? JSON.parse(claimRes) : claimRes;

  return {
    claim_id: c.claim_id,
    policy_id: c.policy_id,
    claimant: c.claimant,
    flight_status_url: c.flight_status_url,
    airline_notice_url: c.airline_notice_url,
    claimant_statement: c.claimant_statement,
    verdict: c.verdict,
    payout_ratio: Number(c.payout_ratio),
    payout_amount: Number(c.payout_amount) / 1e18,
    confidence: Number(c.confidence),
    rationale: c.rationale,
    resolved_index: Number(c.resolved_index),
    txHash: txHash,
  };
}
