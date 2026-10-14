# ClaimGuard — Autonomous AI-Adjudicated Flight Insurance on GenLayer

[![GenLayer](https://img.shields.io/badge/Blockchain-GenLayer%20Intelligent%20Contracts-3B82F6)](https://genlayer.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python: 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![Vite: React](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%20%2B%20TS-61DAFB)](https://vitejs.dev)
[![Strict ASCII: R25](https://img.shields.io/badge/Compliance-Strict%20ASCII%20(R25)-success)](contracts/claim_guard.py)

ClaimGuard is a decentralized parametric flight insurance protocol built natively on the **GenLayer Blockchain**. It replaces centralized, slow claims adjusters and rigid binary oracles with an **on-chain, decentralized AI validator jury**.

When flight disruptions happen, claimants submit live flight radar feeds and official airline notices. GenLayer's Intelligent Contract crawls the web evidence, evaluates liability through on-chain LLM inference, reaches validator consensus, and automatically releases payouts in seconds.

---

## Architecture & How GenLayer Solves Flight Insurance

```
                                  +---------------------------------------------+
                                  |            CLAIMANT / PASSENGER             |
                                  +---------------------------------------------+
                                                         |
                                                         | 1. file_claim(policy_id, radar_url, notice_url)
                                                         v
+---------------------------------------------------------------------------------------------------------------+
| GENLAYER INTELLIGENT CONTRACT (contracts/claim_guard.py)                                                      |
|                                                                                                               |
|  [ LEADER PROPOSAL ]                                        [ INDEPENDENT VALIDATOR JURY ]                    |
|  1. gl.nondet.web.render(radar_url)                         1. gl.nondet.web.render(radar_url)                |
|  2. gl.nondet.web.render(notice_url)                        2. gl.nondet.web.render(notice_url)               |
|  3. gl.nondet.exec_prompt(judicial_prompt)                  3. gl.nondet.exec_prompt(judicial_prompt)         |
|           |                                                              |                                    |
|           +-----------------------------> [ CONSENSUS RULES ] <----------+                                    |
|                                           - Rule 1: Verdict Match (APPROVE_FULL / PARTIAL / REJECT)           |
|                                           - Rule 2: Payout Ratio Bracket (FULL / PARTIAL / REJECT)            |
|                                           - Rule 3: Confidence Band Match (LOW / MED / HIGH)                  |
|                                                          |                                                    |
|                                                          v (Optimistic Democracy Quorum)                      |
|                                           [ DETERMINISTIC STATE COMMIT ]                                      |
|                                           - Settle ClaimRecord in storage                                     |
|                                           - Update Policy status to SETTLED                                   |
|                                           - gl.emit_transfer() payout release                                 |
+---------------------------------------------------------------------------------------------------------------+
```

### The Three GenLayer Primitives Utilized
1. **`gl.nondet.web.render(url, mode="text")`**: The Intelligent Contract crawls web content directly from live flight radars and airline press releases (up to 4,000 characters).
2. **`gl.nondet.exec_prompt(prompt, response_format="json")`**: The leader node prompts an LLM to interpret airline liability, extraordinary circumstances, and delay duration against policy terms.
3. **`gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`**: Multiple decentralized validators re-execute the web rendering and LLM prompt, agreeing only if the judicial ruling satisfies semantic consensus constraints.

---

## Repository Structure

```text
claim-guard/
├── contracts/
│   ├── __init__.py
│   └── claim_guard.py           # Production GenLayer Intelligent Contract (Pure ASCII R25)
├── tests/
│   └── test_claim_guard.py      # Complete gltest & pytest suite with web/LLM mocks
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Dashboard, BuyPolicy, FileClaim, VerdictViewer
│   │   ├── data/                # 1-Click hackathon demo scenarios
│   │   ├── lib/                 # genlayer-js Web3 integration
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Main application shell
│   │   └── main.tsx             # DOM entry
│   ├── package.json             # React 18, Vite, Tailwind CSS, genlayer-js
│   ├── vite.config.ts           # Vite configuration
│   └── .env.example             # RPC & contract address configuration
├── requirements-dev.txt         # Python gltest & pytest dependencies
├── SUBMISSION.md                # Ready-to-copy GenLayer Builder Portal submission kit
└── README.md                    # Project documentation
```

---

## Semantic Consensus Rules

The validator jury function (`validator_fn`) verifies the leader proposal across three dimensions:

| Rule | Metric | Validation Criteria |
| :--- | :--- | :--- |
| **Rule 1: Verdict Match** | `verdict` | `leader["verdict"] == validator["verdict"]` (`APPROVE_FULL`, `APPROVE_PARTIAL`, or `REJECT`) |
| **Rule 2: Payout Bracket** | `payout_ratio` | Both leader and validator fall into the same bracket: `FULL` ($\ge 80\%$), `PARTIAL` ($20\%-79\%$), or `REJECT` ($< 20\%$) |
| **Rule 3: Confidence Band** | `confidence` | Both leader and validator agree on confidence band: `LOW` ($< 40\%$), `MED` ($40\%-79\%$), or `HIGH` ($\ge 80\%$) |

---

## 1-Click Hackathon Scenarios

The frontend includes three pre-configured scenarios for instant judge testing:

1. **British Airways BA1420 (Mechanical Delay — 4h 15m):**
   - Radar telemetry proves 4-hour delay at London Heathrow.
   - British Airways press bulletin confirms turbine APU maintenance.
   - AI Jury Verdict: **`APPROVE_FULL`** ($100\%$ Payout Released).
2. **United Airlines UA901 (Shared Ground Delay — 2h 10m):**
   - Radar telemetry logs 2h 10m arrival delay at Chicago O'Hare.
   - Airline bulletin confirms baggage downtime and airspace flow control.
   - AI Jury Verdict: **`APPROVE_PARTIAL`** ($50\%$ Tiered Payout).
3. **Lufthansa LH400 (On-Time Arrival — Fraud / Invalid Claim):**
   - Radar telemetry reveals flight landed 7 minutes early at JFK.
   - Airline operations show normal flight with zero irregular disruption.
   - AI Jury Verdict: **`REJECT`** ($0\%$ Payout, Policy Marked Rejected).

---

## Getting Started & Local Development

### 1. Prerequisites
- Python 3.10+ (with `pytest` and `genlayer-test`)
- Node.js 18+ and `npm`

### 2. Contract Testing
To run the automated test suite verifying contract storage, policy issuance, web mocks, LLM mocks, and consensus failure cases:

```powershell
# In repository root
pytest -v tests/test_claim_guard.py
```

### 3. Frontend Development
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Deployment Instructions

### Deploy Intelligent Contract to GenLayer
```powershell
# Using GenLayer CLI to deploy to Studionet
glsim deploy contracts/claim_guard.py --network studionet
```
Copy the returned contract address and update `VITE_CONTRACT_ADDRESS` in `frontend/.env`.

### Deploy Frontend to Vercel
```powershell
cd frontend
npm install -g vercel
vercel --prod
```

---

## License
MIT License. Built for the GenLayer Ecosystem.
