export type VerdictType = 'APPROVE_FULL' | 'APPROVE_PARTIAL' | 'REJECT';

export interface Policy {
  policy_id: string;
  holder: string;
  flight_number: string;
  departure_date: string;
  policy_terms: string;
  premium: number; // in wei or GEN
  coverage_amount: number;
  status: 'ACTIVE' | 'SETTLED' | 'REJECTED' | 'EXPIRED';
  created_index: number;
}

export interface ClaimRecord {
  claim_id: string;
  policy_id: string;
  claimant: string;
  flight_status_url: string;
  airline_notice_url: string;
  claimant_statement: string;
  verdict: VerdictType;
  payout_ratio: number; // 0-100
  payout_amount: number;
  confidence: number; // 0-100
  rationale: string;
  resolved_index: number;
  txHash?: string;
}

export interface PoolSummary {
  total_policies: number;
  total_claims: number;
  total_coverage_pool: number;
  total_premiums_collected: number;
  total_payouts_distributed: number;
  active_coverage: number;
}

export interface DemoScenario {
  id: string;
  title: string;
  airline: string;
  flightNumber: string;
  departureDate: string;
  expectedVerdict: VerdictType;
  expectedRatio: number;
  radarUrl: string;
  radarSnippet: string;
  noticeUrl: string;
  noticeSnippet: string;
  claimantStatement: string;
  policyTerms: string;
}
