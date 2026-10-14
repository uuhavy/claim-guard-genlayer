# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json


@allow_storage
@dataclass
class Policy:
    policy_id: str
    holder: str
    flight_number: str
    departure_date: str
    policy_terms: str
    premium: bigint
    coverage_amount: bigint
    status: str
    created_index: bigint


@allow_storage
@dataclass
class ClaimRecord:
    claim_id: str
    policy_id: str
    claimant: str
    flight_status_url: str
    airline_notice_url: str
    claimant_statement: str
    verdict: str
    payout_ratio: bigint
    payout_amount: bigint
    confidence: bigint
    rationale: str
    resolved_index: bigint


def get_payout_bracket(ratio: int) -> int:
    if ratio >= 80:
        return 2
    elif ratio >= 20:
        return 1
    return 0


def get_confidence_band(conf: int) -> int:
    if conf < 40:
        return 0
    elif conf < 80:
        return 1
    return 2


class Contract(gl.Contract):
    policies: TreeMap[str, Policy]
    claims: TreeMap[str, ClaimRecord]
    user_latest_policy: TreeMap[str, str]
    policy_to_claim: TreeMap[str, str]
    total_policies: bigint
    total_claims: bigint
    total_coverage_pool: bigint
    total_premiums_collected: bigint
    total_payouts_distributed: bigint
    active_coverage: bigint

    def __init__(self):
        self.total_policies = bigint(0)
        self.total_claims = bigint(0)
        self.total_coverage_pool = bigint(0)
        self.total_premiums_collected = bigint(0)
        self.total_payouts_distributed = bigint(0)
        self.active_coverage = bigint(0)

    @gl.public.write.payable
    def buy_policy(
        self,
        flight_number: str,
        departure_date: str,
        policy_terms: str,
    ) -> str:
        if not flight_number or not isinstance(flight_number, str):
            raise gl.vm.UserError("Invalid input: flight_number must be a non-empty string")
        clean_flight = flight_number.strip().upper()
        if len(clean_flight) < 2 or len(clean_flight) > 12:
            raise gl.vm.UserError("Invalid input: flight_number must be between 2 and 12 characters")

        if not departure_date or not isinstance(departure_date, str):
            raise gl.vm.UserError("Invalid input: departure_date must be a non-empty string")
        clean_date = departure_date.strip()
        if len(clean_date) < 6:
            raise gl.vm.UserError("Invalid input: departure_date must be a valid date format")

        if not policy_terms or not isinstance(policy_terms, str):
            raise gl.vm.UserError("Invalid input: policy_terms must be a non-empty string")
        clean_terms = policy_terms.strip()
        if len(clean_terms) < 5:
            raise gl.vm.UserError("Invalid input: policy_terms must contain valid coverage terms")

        sender_str = str(getattr(gl.message, "sender_address", ""))
        if not sender_str:
            sender_str = "0x0000000000000000000000000000000000000001"

        attached_val = getattr(gl.message, "value", 0)
        try:
            val_int = int(attached_val)
        except Exception:
            val_int = 0

        if val_int > 0:
            premium_big = bigint(val_int)
        else:
            premium_big = bigint(10000000000000000)

        coverage_big = premium_big * bigint(5)

        next_pol_index = int(self.total_policies) + 1
        pol_id = f"POL-{next_pol_index:06d}"

        new_policy = Policy(
            policy_id=pol_id,
            holder=sender_str,
            flight_number=clean_flight,
            departure_date=clean_date,
            policy_terms=clean_terms,
            premium=premium_big,
            coverage_amount=coverage_big,
            status="ACTIVE",
            created_index=bigint(next_pol_index),
        )

        self.policies[pol_id] = new_policy
        self.user_latest_policy[sender_str] = pol_id
        self.total_policies = bigint(next_pol_index)
        self.total_premiums_collected = self.total_premiums_collected + premium_big
        self.total_coverage_pool = self.total_coverage_pool + coverage_big
        self.active_coverage = self.active_coverage + coverage_big

        return pol_id

    @gl.public.write
    def file_claim(
        self,
        policy_id: str,
        flight_status_url: str,
        airline_notice_url: str,
        claimant_statement: str,
    ) -> str:
        if not policy_id or not isinstance(policy_id, str):
            raise gl.vm.UserError("Invalid input: policy_id must be a non-empty string")
        clean_pol_id = policy_id.strip()
        if clean_pol_id not in self.policies:
            raise gl.vm.UserError(f"Policy not found: {clean_pol_id}")

        target_policy = self.policies[clean_pol_id]
        if target_policy.status != "ACTIVE":
            raise gl.vm.UserError(f"Policy {clean_pol_id} is not active (status: {target_policy.status})")

        sender_str = str(getattr(gl.message, "sender_address", ""))
        if sender_str and target_policy.holder and sender_str != target_policy.holder:
            raise gl.vm.UserError("Unauthorized: Only the policy holder can file a claim")

        if not flight_status_url or not isinstance(flight_status_url, str):
            raise gl.vm.UserError("Invalid input: flight_status_url must be a non-empty string")
        clean_status_url = flight_status_url.strip()
        if not (clean_status_url.startswith("http://") or clean_status_url.startswith("https://")):
            raise gl.vm.UserError("Invalid input: flight_status_url must start with http:// or https://")

        if not airline_notice_url or not isinstance(airline_notice_url, str):
            raise gl.vm.UserError("Invalid input: airline_notice_url must be a non-empty string")
        clean_notice_url = airline_notice_url.strip()
        if not (clean_notice_url.startswith("http://") or clean_notice_url.startswith("https://")):
            raise gl.vm.UserError("Invalid input: airline_notice_url must start with http:// or https://")

        if not claimant_statement or not isinstance(claimant_statement, str):
            raise gl.vm.UserError("Invalid input: claimant_statement must be a non-empty string")
        clean_statement = claimant_statement.strip()
        if len(clean_statement) == 0:
            raise gl.vm.UserError("Invalid input: claimant_statement cannot be empty")

        target_flight = target_policy.flight_number
        target_date = target_policy.departure_date
        target_terms = target_policy.policy_terms

        def leader_fn() -> dict:
            try:
                raw_status_text = gl.nondet.web.render(clean_status_url, mode="text")
            except Exception as exc:
                raise gl.vm.UserError(f"Failed to fetch flight status evidence: {str(exc)}")

            if not raw_status_text or len(raw_status_text.strip()) == 0:
                raise gl.vm.UserError("Flight status evidence returned empty content")

            clean_status = (
                raw_status_text.encode("ascii", errors="ignore").decode("ascii")[:4000]
            )

            try:
                raw_notice_text = gl.nondet.web.render(clean_notice_url, mode="text")
            except Exception as exc:
                raise gl.vm.UserError(f"Failed to fetch airline notice evidence: {str(exc)}")

            if not raw_notice_text or len(raw_notice_text.strip()) == 0:
                raise gl.vm.UserError("Airline notice evidence returned empty content")

            clean_notice = (
                raw_notice_text.encode("ascii", errors="ignore").decode("ascii")[:4000]
            )

            prompt_text = (
                "You are an autonomous AI flight insurance claim adjudication court.\n"
                "Analyze the flight status data and airline official notice against the insurance policy terms.\n\n"
                f"Flight Number: {target_flight}\n"
                f"Departure Date: {target_date}\n"
                f"Policy Terms: {target_terms}\n"
                f"Claimant Incident Statement: {clean_statement}\n\n"
                f"Flight Status / Radar Feed (first 4000 chars):\n{clean_status}\n\n"
                f"Airline Notice / Press Feed (first 4000 chars):\n{clean_notice}\n\n"
                "ADJUDICATION RULES:\n"
                "1. Determine whether the flight suffered an eligible delay, cancellation, or disruption according to the Policy Terms.\n"
                "2. If the airline proves force majeure or if the flight arrived on-time/with minor delay under threshold, REJECT or reduce payout.\n"
                "3. If severe delay (>= 3 hours) or cancellation occurred due to airline operational/mechanical issues, APPROVE_FULL.\n"
                "4. If partial delay or shared responsibility, APPROVE_PARTIAL.\n\n"
                "You must output ONLY valid JSON adhering strictly to this schema:\n"
                "{\n"
                '  "verdict": "APPROVE_FULL" | "APPROVE_PARTIAL" | "REJECT",\n'
                '  "payout_ratio": <integer between 0 and 100>,\n'
                '  "confidence": <integer between 0 and 100>,\n'
                '  "rationale": "<concise explanation citing evidence from flight status and airline notice>"\n'
                "}\n\n"
                "Payout ratio brackets:\n"
                "- APPROVE_FULL: payout_ratio between 80 and 100\n"
                "- APPROVE_PARTIAL: payout_ratio between 20 and 79\n"
                "- REJECT: payout_ratio between 0 and 19\n"
                "Ensure all numeric fields are integers 0-100. Return valid JSON only with no conversational prefix or markdown."
            )

            try:
                llm_output = gl.nondet.exec_prompt(
                    prompt_text, response_format="json"
                )
            except Exception as exc:
                raise gl.vm.UserError(f"LLM execution error: {str(exc)}")

            try:
                if isinstance(llm_output, dict):
                    parsed = llm_output
                else:
                    parsed = json.loads(llm_output)
            except Exception:
                raise gl.vm.UserError("Unparseable LLM output: response is not valid JSON")

            if not isinstance(parsed, dict):
                raise gl.vm.UserError("Unparseable LLM output: root element must be a dictionary")

            verdict_raw = str(parsed.get("verdict", "")).strip().upper()
            if verdict_raw not in ("APPROVE_FULL", "APPROVE_PARTIAL", "REJECT"):
                raise gl.vm.UserError(
                    f"Invalid verdict from LLM: '{verdict_raw}'. Expected APPROVE_FULL, APPROVE_PARTIAL, or REJECT"
                )

            def sanitize_num(val_in, default_val: int) -> int:
                try:
                    num = int(val_in)
                    if num < 0:
                        return 0
                    if num > 100:
                        return 100
                    return num
                except Exception:
                    return default_val

            payout_val = sanitize_num(parsed.get("payout_ratio"), 0)
            conf_val = sanitize_num(parsed.get("confidence"), 50)

            if verdict_raw == "APPROVE_FULL" and payout_val < 80:
                payout_val = 100
            elif verdict_raw == "APPROVE_PARTIAL" and (payout_val < 20 or payout_val >= 80):
                payout_val = 50
            elif verdict_raw == "REJECT" and payout_val >= 20:
                payout_val = 0

            rationale_raw = str(parsed.get("rationale", "No rationale provided"))
            rationale_clean = (
                rationale_raw.encode("ascii", errors="ignore").decode("ascii")[:1000]
            )

            return {
                "verdict": verdict_raw,
                "payout_ratio": payout_val,
                "confidence": conf_val,
                "rationale": rationale_clean,
            }

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False

            leader_data = leader_res.calldata
            if not isinstance(leader_data, dict):
                return False

            leader_verdict = leader_data.get("verdict")
            leader_ratio = leader_data.get("payout_ratio")
            leader_conf = leader_data.get("confidence")

            if leader_verdict not in ("APPROVE_FULL", "APPROVE_PARTIAL", "REJECT"):
                return False
            if not isinstance(leader_ratio, int) or not isinstance(leader_conf, int):
                return False

            try:
                validator_data = leader_fn()
            except Exception:
                return False

            if not isinstance(validator_data, dict):
                return False

            val_verdict = validator_data.get("verdict")
            val_ratio = validator_data.get("payout_ratio")
            val_conf = validator_data.get("confidence")

            if val_verdict not in ("APPROVE_FULL", "APPROVE_PARTIAL", "REJECT"):
                return False
            if not isinstance(val_ratio, int) or not isinstance(val_conf, int):
                return False

            if leader_verdict != val_verdict:
                return False

            if get_payout_bracket(leader_ratio) != get_payout_bracket(val_ratio):
                return False

            if get_confidence_band(leader_conf) != get_confidence_band(val_conf):
                return False

            return True

        adjudication = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        next_claim_index = int(self.total_claims) + 1
        claim_id = f"CLAIM-{next_claim_index:06d}"
        v_str = str(adjudication["verdict"])
        payout_ratio_int = int(adjudication["payout_ratio"])
        conf_int = int(adjudication["confidence"])
        rationale_str = str(adjudication["rationale"])

        coverage_amount_int = int(target_policy.coverage_amount)
        calculated_payout = (coverage_amount_int * payout_ratio_int) // 100
        payout_big = bigint(calculated_payout)

        if calculated_payout > 0:
            try:
                gl.emit_transfer(Address(target_policy.holder), u256(calculated_payout))
            except Exception:
                pass

        claim_rec = ClaimRecord(
            claim_id=claim_id,
            policy_id=clean_pol_id,
            claimant=target_policy.holder,
            flight_status_url=clean_status_url,
            airline_notice_url=clean_notice_url,
            claimant_statement=clean_statement,
            verdict=v_str,
            payout_ratio=bigint(payout_ratio_int),
            payout_amount=payout_big,
            confidence=bigint(conf_int),
            rationale=rationale_str,
            resolved_index=bigint(next_claim_index),
        )

        self.claims[claim_id] = claim_rec
        self.policy_to_claim[clean_pol_id] = claim_id
        target_policy.status = "SETTLED" if v_str != "REJECT" else "REJECTED"
        self.policies[clean_pol_id] = target_policy

        self.total_claims = bigint(next_claim_index)
        self.total_payouts_distributed = self.total_payouts_distributed + payout_big
        if self.active_coverage >= target_policy.coverage_amount:
            self.active_coverage = self.active_coverage - target_policy.coverage_amount
        else:
            self.active_coverage = bigint(0)

        return claim_id

    @gl.public.view
    def get_policy(self, policy_id: str) -> str:
        if policy_id not in self.policies:
            raise gl.vm.UserError(f"Policy {policy_id} not found")
        p = self.policies[policy_id]
        return json.dumps({
            "policy_id": p.policy_id,
            "holder": p.holder,
            "flight_number": p.flight_number,
            "departure_date": p.departure_date,
            "policy_terms": p.policy_terms,
            "premium": int(p.premium),
            "coverage_amount": int(p.coverage_amount),
            "status": p.status,
            "created_index": int(p.created_index),
        })

    @gl.public.view
    def get_claim(self, claim_id: str) -> str:
        if claim_id not in self.claims:
            raise gl.vm.UserError(f"Claim {claim_id} not found")
        c = self.claims[claim_id]
        return json.dumps({
            "claim_id": c.claim_id,
            "policy_id": c.policy_id,
            "claimant": c.claimant,
            "flight_status_url": c.flight_status_url,
            "airline_notice_url": c.airline_notice_url,
            "claimant_statement": c.claimant_statement,
            "verdict": c.verdict,
            "payout_ratio": int(c.payout_ratio),
            "payout_amount": int(c.payout_amount),
            "confidence": int(c.confidence),
            "rationale": c.rationale,
            "resolved_index": int(c.resolved_index),
        })

    @gl.public.view
    def get_pool_summary(self) -> str:
        return json.dumps({
            "total_policies": int(self.total_policies),
            "total_claims": int(self.total_claims),
            "total_coverage_pool": int(self.total_coverage_pool),
            "total_premiums_collected": int(self.total_premiums_collected),
            "total_payouts_distributed": int(self.total_payouts_distributed),
            "active_coverage": int(self.active_coverage),
        })
