import { DemoScenario } from '../types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'ba-engine-delay',
    title: 'British Airways BA1420 — 4h 15m Mechanical Delay',
    airline: 'British Airways',
    flightNumber: 'BA1420',
    departureDate: '2026-10-20',
    expectedVerdict: 'APPROVE_FULL',
    expectedRatio: 100,
    radarUrl: 'https://flightstatus.net/radar/BA1420',
    radarSnippet: 'Flight BA1420 (LHR -> JFK). Scheduled: 10:00 UTC, Actual Arrival: 14:15 UTC. Cumulative Delay: 4h 15m.',
    noticeUrl: 'https://britishairways.com/ops-bulletin/BA1420-turbines',
    noticeSnippet: 'British Airways Official Notice: Flight BA1420 was delayed due to unscheduled auxiliary power unit maintenance at Terminal 5.',
    claimantStatement: 'My flight from London to New York was grounded on the tarmac for over four hours due to engine maintenance, missing my connection.',
    policyTerms: 'Parametric Coverage: Delay >= 3 hours or cancellation due to carrier operational or mechanical failure qualifies for 100% full payout.'
  },
  {
    id: 'ua-shared-delay',
    title: 'United Airlines UA901 — 2h 10m Shared Ground Delay',
    airline: 'United Airlines',
    flightNumber: 'UA901',
    departureDate: '2026-10-22',
    expectedVerdict: 'APPROVE_PARTIAL',
    expectedRatio: 50,
    radarUrl: 'https://flightstatus.net/radar/UA901',
    radarSnippet: 'Flight UA901 (SFO -> ORD). Scheduled: 14:30 UTC, Actual Arrival: 16:40 UTC. Delay: 2 hours 10 minutes.',
    noticeUrl: 'https://united.com/notices/UA901-baggage-atc',
    noticeSnippet: 'United Airlines Press Notice: Combined delay attributed to baggage system downtime and Chicago airspace volume flow control.',
    claimantStatement: 'Arrived over two hours late due to ground handling problems, causing significant schedule disruption.',
    policyTerms: 'Parametric Coverage: Delays between 2h 00m and 2h 59m qualify for 50% partial payout tier. Weather exclusions apply.'
  },
  {
    id: 'lh-ontime-reject',
    title: 'Lufthansa LH400 — On-Time Arrival (Fraud / Invalid Claim)',
    airline: 'Lufthansa',
    flightNumber: 'LH400',
    departureDate: '2026-10-25',
    expectedVerdict: 'REJECT',
    expectedRatio: 0,
    radarUrl: 'https://flightstatus.net/radar/LH400',
    radarSnippet: 'Flight LH400 (FRA -> JFK). Scheduled: 11:15 UTC, Actual Arrival: 11:08 UTC. Status: LANDED 7 MINUTES EARLY.',
    noticeUrl: 'https://lufthansa.com/ops/LH400-normal',
    noticeSnippet: 'Lufthansa Flight Operations: LH400 completed standard flight route with zero irregular operational disruptions or delays.',
    claimantStatement: 'Claiming reimbursement for travel inconvenience and lost baggage on my Frankfurt flight.',
    policyTerms: 'Parametric Coverage: Flight delays under 3 hours or flights arriving on schedule are strictly excluded from payout.'
  }
];
