# GenLayer Builder Portal Submission — ClaimGuard

> **Submission Track:** Projects / Hackathon Track  
> **Ecosystem:** GenLayer Blockchain (Intelligent Contracts) + Web3 Frontend (Vercel)  
> **Date:** October 2026

---

## 1. Project Overview & Pitch

### Project Title
**ClaimGuard — Autonomous AI-Adjudicated Flight Insurance on GenLayer**

### Category / Track
**Projects / Hackathons**

### One-Liner
An on-chain parametric flight insurance protocol where GenLayer's decentralized AI validator jury crawls real-time airport radars and airline notices to settle subjective claims without human adjusters.

### Short Pitch (Under 1,000 Characters)
ClaimGuard transforms flight delay insurance by replacing rigid, binary oracles and slow human adjusters with an autonomous, decentralized AI court. When a disruption occurs, policyholders submit flight radar links and airline public statements. GenLayer Intelligent Contracts crawl the live web evidence and convene an on-chain LLM validator jury. Consensus is reached on the semantic interpretation of the airline's liability, force majeure clauses, and delay duration—automatically executing on-chain payouts in seconds. Built natively on GenLayer using pure Python, custom semantic validators, and GenLayerJS.

### Project Tags
`Intelligent-Contracts` `GenLayer` `Parametric-Insurance` `AI-Jury` `Web-Crawling` `LLM-Consensus` `DeFi` `Autonomous-Agents`

---

## 2. Key Links Section

| Resource | URL / Placeholder |
| :--- | :--- |
| **GitHub Repository** | `https://github.com/uuhavy/claim-guard-genlayer` |
| **Live Demo (Vercel)** | `https://claim-guard-genlayer.vercel.app` |
| **Deployed Contract Address (Studionet / Bradbury)** | `0x4Fb3074F563582e1FF253870B48D06387b0f346D` |
| **Video Demonstration / Loom** | `https://www.youtube.com/watch?v=placeholder` |
| **Contract Source on Repo** | [`/contracts/claim_guard.py`](contracts/claim_guard.py) |
| **Frontend Source on Repo** | [`/frontend`](frontend/) |

---

## 3. The Problem ClaimGuard Solves

### The Dilemma of Traditional Flight Insurance
Traditional travel insurance is fraught with friction:
1. **Prolonged Claim Delays:** Processing a flight delay or cancellation claim typically takes **30 to 60 days** through centralized claim adjusters.
2. **Subjective Denials:** Airlines and insurers frequently invoke generic "extraordinary circumstances" or "force majeure" clauses to reject legitimate compensation requests under EU261 / DOT rules.
3. **The Failure of Binary Web3 Oracles:** Earlier attempts at crypto flight insurance (Chainlink oracle feeds) failed because flight disruption is rarely binary. A flight might arrive 2 hours late due to ground handling, or suffer a tarmac hold, or land at an alternate airport. Standard smart contracts on EVM cannot read airline press notices or interpret whether an engine breakdown constitutes carrier liability.

### The GenLayer Solution
GenLayer enables **Intelligent Contracts** that run non-deterministic web requests and LLM inference natively inside the consensus loop:
- **`gl.nondet.web.render(url, mode="text")`**: The contract autonomously crawls live flight radar telemetry and official airline incident notices up to 4,000 characters.
- **`gl.nondet.exec_prompt(prompt, response_format="json")`**: An on-chain LLM analyzes the airline's liability against the policy terms.
- **`gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`**: Multiple independent validator nodes reproduce the web crawl and LLM evaluation, verifying that verdict, payout bracket, and confidence bands match before state commit.

---

## 4. Intelligent Contract Architecture & Semantic Consensus

```
                                      +---------------------------------------------+
                                      |            CLAIMANT / PASSENGER             |
                                      +---------------------------------------------+
                                                             |
                                                             | 1. file_claim(policy_id, radar_url, notice_url)
                                                             v
+-------------------------------------------------------------------------------------------------------------------+
| GENLAYER INTELLIGENT CONTRACT (claim_guard.py)                                                                     |
|                                                                                                                   |
|  [ LEADER PROPOSAL ]                                        [ INDEPENDENT VALIDATOR JURY ]                        |
|  1. gl.nondet.web.render(radar_url)                         1. gl.nondet.web.render(radar_url)                    |
|  2. gl.nondet.web.render(notice_url)                        2. gl.nondet.web.render(notice_url)                   |
|  3. gl.nondet.exec_prompt(legal_prompt)                     3. gl.nondet.exec_prompt(legal_prompt)                |
|           |                                                              |                                        |
|           +-----------------------------> [ CONSENSUS RULES ] <----------+                                        |
|                                           - Verdict Match: leader == validator                                    |
|                                           - Payout Bracket: FULL / PARTIAL / REJECT                               |
|                                           - Confidence Band: LOW / MED / HIGH                                     |
|                                                          |                                                        |
|                                                          v (Quorum Reached)                                       |
|                                           [ DETERMINISTIC STATE COMMIT ]                                          |
|                                           - Settle ClaimRecord on-chain                                           |
|                                           - Update Policy status to SETTLED                                       |
|                                           - Release automated payout transfer                                     |
+-------------------------------------------------------------------------------------------------------------------+
```

### Semantic Consensus Rules
1. **Verdict Equality:** Both leader and validator must render the exact same categorical verdict (`APPROVE_FULL`, `APPROVE_PARTIAL`, or `REJECT`).
2. **Payout Bracket Alignment:**
   - `FULL`: Payout ratio $\ge 80\%$
   - `PARTIAL`: Payout ratio $20\% \le r < 80\%$
   - `REJECT`: Payout ratio $< 20\%$
3. **Confidence Band Concordance:**
   - `LOW`: $< 40\%$
   - `MED`: $40\% \le c < 80\%$
   - `HIGH`: $\ge 80\%$

---

## 5. Judge Verification & Testing Guide

### A. Run Contract Tests Locally
To verify all 15 intelligent contract test cases (covering valid payouts, partial tiers, on-time rejections, and validator divergence):

```powershell
# Navigate to repository root
cd claim-guard

# Run unit tests with pytest / gltest
pytest -v tests/test_claim_guard.py
```

### B. Run the Frontend dApp
```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:3000` in your browser.

### C. 1-Click Test Scenarios Built into UI
The dApp includes 3 pre-loaded real-world scenarios in the **"1-Click Demos"** tab:
1. **British Airways BA1420:** 4h 15m delay due to turbine maintenance $\rightarrow$ Verdict: **`APPROVE_FULL`** ($100\%$ Payout).
2. **United Airlines UA901:** 2h 10m delay due to shared baggage/ATC hold $\rightarrow$ Verdict: **`APPROVE_PARTIAL`** ($50\%$ Payout).
3. **Lufthansa LH400:** Flight landed 7 minutes early $\rightarrow$ Verdict: **`REJECT`** ($0\%$ Payout).

---

## 6. Deployment Guide

### Deploying the Intelligent Contract to GenLayer Studionet / Bradbury
```powershell
# Deploy via GenLayer CLI
glsim deploy contracts/claim_guard.py --network studionet
```
Copy the deployed contract address and update `VITE_CONTRACT_ADDRESS` in `frontend/.env`.

### Deploying Frontend to Vercel
```powershell
cd frontend
vercel --prod
```

---

## 7. Compliance Checklist
- [x] `# v0.2.16` and header dependency layout strictly respected.
- [x] **Strict ASCII Rule (R25):** 100% pure ASCII verified with zero unicode characters in `contracts/claim_guard.py`.
- [x] `@allow_storage @dataclass` models use `bigint` for persisted numbers.
- [x] Mappings use `TreeMap[str, ...]`.
- [x] `@gl.public.write.payable` implemented for `buy_policy`.
- [x] Comprehensive `gltest` suite with simulated web and LLM mocks.
- [x] Modern responsive React + TypeScript + Tailwind dApp with `genlayer-js`.
- [x] Zero external dependencies required for judge testing.
