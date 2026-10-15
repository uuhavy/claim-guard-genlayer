import { createClient, createAccount, generatePrivateKey } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { Policy, ClaimRecord, PoolSummary } from '../types';

export const GENLAYER_RPC = import.meta.env.VITE_GENLAYER_RPC_URL || 'https://studio.genlayer.com/api';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x4Fb3074F563582e1FF253870B48D06387b0f346D';
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 61999);

// Manage persistent in-browser account so user identity remains consistent
export function getStoredAccount() {
  let pk = '';
  try {
    pk = localStorage.getItem('claimguard_user_pk') || '';
  } catch (e) {
    // SSR / test fallback
  }
  if (!pk) {
    pk = generatePrivateKey();
    try {
      localStorage.setItem('claimguard_user_pk', pk);
    } catch (e) {}
  }
  return createAccount(pk as `0x${string}`);
}

let cachedClient: any = null;

export function getClient() {
  if (!cachedClient) {
    const account = getStoredAccount();
    cachedClient = createClient({
      chain: studionet,
      account,
    });
  }
  return cachedClient;
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
 * Executes on-chain buy_policy transaction and reads confirmed state
 */
export async function purchasePolicy(
  flightNumber: string,
  departureDate: string,
  policyTerms: string,
  premiumGen: number,
  onStatusUpdate?: (status: string) => void
): Promise<{ policy: Policy; txHash: string }> {
  const client = getClient();
  const weiValue = BigInt(Math.floor(premiumGen * 1e18));

  onStatusUpdate?.('Submitting buy_policy to GenLayer Studionet...');
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'buy_policy',
    args: [flightNumber, departureDate, policyTerms],
    value: weiValue,
  });

  if (!txHash) {
    throw new Error('Transaction submission failed: No transaction hash returned by GenLayer RPC.');
  }

  onStatusUpdate?.(`Transaction broadcast: ${txHash.slice(0, 10)}... Awaiting on-chain consensus receipt...`);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });

  if (receipt.result_name && receipt.result_name !== 'MAJORITY_AGREE' && receipt.result_name !== 'AGREE') {
    throw new Error(`On-chain transaction consensus rejected: ${receipt.result_name}`);
  }

  onStatusUpdate?.('Consensus reached! Reading newly issued policy directly from contract...');

  // Read latest total_policies from contract
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
 * Executes on-chain file_claim transaction and reads confirmed AI Jury ruling
 */
export async function submitClaim(
  policyId: string,
  flightStatusUrl: string,
  airlineNoticeUrl: string,
  claimantStatement: string,
  onStatusUpdate?: (status: string) => void
): Promise<ClaimRecord> {
  const client = getClient();

  onStatusUpdate?.('Convening on-chain AI Validator Jury via GenLayer...');
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'file_claim',
    args: [policyId, flightStatusUrl, airlineNoticeUrl, claimantStatement],
  });

  if (!txHash) {
    throw new Error('Transaction submission failed: No transaction hash returned by GenLayer RPC.');
  }

  onStatusUpdate?.(`Transaction ${txHash.slice(0, 10)}... broadcast. Validators crawling web & executing LLM inference...`);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });

  if (receipt.result_name && receipt.result_name !== 'MAJORITY_AGREE' && receipt.result_name !== 'AGREE') {
    throw new Error(`On-chain AI Jury consensus rejected transaction: ${receipt.result_name}`);
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
