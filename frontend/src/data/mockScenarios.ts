import { DemoScenario } from '../types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'ba-engine-delay',
    title: 'British Airways — Flight Incident & Engine Telemetry Analysis',
    airline: 'British Airways',
    flightNumber: 'BA1420',
    departureDate: '2026-10-20',
    expectedVerdict: 'APPROVE_FULL',
    expectedRatio: 100,
    radarUrl: 'https://en.wikipedia.org/wiki/British_Airways_Flight_38',
    radarSnippet: 'British Airways Flight 38 official investigation records: Ice crystals in fuel system caused loss of thrust and emergency landing disruption.',
    noticeUrl: 'https://en.wikipedia.org/wiki/British_Airways',
    noticeSnippet: 'British Airways operational bulletin: Fleet safety inspections and carrier liability adjustments under commercial aviation standards.',
    claimantStatement: 'Flight was grounded due to critical uncommanded reduction of engine thrust during approach. Delay exceeded 4 hours.',
    policyTerms: 'Parametric Coverage: Delay >= 3 hours or cancellation due to carrier operational or mechanical defect qualifies for full 100% payout.'
  },
  {
    id: 'ua-shared-delay',
    title: 'United Airlines — Airspace Flow Control & Operational Delay',
    airline: 'United Airlines',
    flightNumber: 'UA901',
    departureDate: '2026-10-22',
    expectedVerdict: 'APPROVE_PARTIAL',
    expectedRatio: 50,
    radarUrl: 'https://en.wikipedia.org/wiki/Air_traffic_control',
    radarSnippet: 'Air Traffic Control operations: Airport surface movement radar and flow management delays across congested hub corridors.',
    noticeUrl: 'https://en.wikipedia.org/wiki/United_Airlines',
    noticeSnippet: 'United Airlines fleet operations: Hub schedule recovery protocols and baggage logistics handling guidelines.',
    claimantStatement: 'Flight delayed 2 hours 15 minutes due to combined ground handling and airspace flow control sequencing.',
    policyTerms: 'Parametric Coverage: Delays between 2h 00m and 3h 59m qualify for 50% partial payout tier. Weather exclusions apply.'
  },
  {
    id: 'lh-ontime-reject',
    title: 'Lufthansa — Normal Scheduled Flight (No Disruption Discovered)',
    airline: 'Lufthansa',
    flightNumber: 'LH400',
    departureDate: '2026-10-25',
    expectedVerdict: 'REJECT',
    expectedRatio: 0,
    radarUrl: 'https://en.wikipedia.org/wiki/Lufthansa',
    radarSnippet: 'Lufthansa operations: Flag carrier scheduled network operations, standard on-time performance across European transit points.',
    noticeUrl: 'https://en.wikipedia.org/wiki/Frankfurt_Airport',
    noticeSnippet: 'Frankfurt Airport terminal operations: Standard runway operations with zero irregular flight cancellation directives.',
    claimantStatement: 'Claiming discretionary reimbursement for airport wait time on a normally scheduled flight.',
    policyTerms: 'Parametric Coverage: Flights arriving on schedule or delays under 3 hours are strictly excluded from payout.'
  }
];
