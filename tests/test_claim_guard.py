# Test suite for ClaimGuard GenLayer Intelligent Contract
# Compatible with gltest, direct_vm, and standalone Python test environments.

import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import pytest


# Define mock VM and Return structures to support both gltest and local direct mode
class MockReturn:
    def __init__(self, calldata):
        self.calldata = calldata


class MockUserError(Exception):
    pass


class MockNondetWeb:
    def __init__(self):
        self.urls = {}

    def render(self, url: str, mode: str = "text") -> str:
        for pattern, content in self.urls.items():
            if pattern in url or url in pattern:
                if isinstance(content, dict):
                    if content.get("status", 200) >= 400:
                        raise Exception(f"HTTP Error {content.get('status')}")
                    return content.get("body", "")
                return str(content)
        raise Exception(f"Failed to fetch URL: {url} (404 Not Found)")


class MockNondet:
    def __init__(self):
        self.web = MockNondetWeb()
        self.prompts = {}
        self.call_count = 0
        self.prompt_sequence = []

    def exec_prompt(self, prompt: str, response_format: str = "json") -> str:
        self.call_count += 1
        if self.prompt_sequence:
            return self.prompt_sequence.pop(0)

        for pattern, response in self.prompts.items():
            if pattern in prompt or prompt in pattern:
                if isinstance(response, str):
                    return response
                return json.dumps(response)

        # Default fallback adjudication
        return json.dumps({
            "verdict": "APPROVE_FULL",
            "payout_ratio": 100,
            "confidence": 95,
            "rationale": "Default mock claim adjudication approval"
        })


class MockGenVM:
    UserError = MockUserError
    Return = MockReturn

    def __init__(self):
        self.validator_override = None

    def run_nondet_unsafe(self, leader_fn, validator_fn):
        leader_output = leader_fn()
        leader_res = MockReturn(leader_output)

        if self.validator_override is not None:
            is_valid = self.validator_override(leader_res)
        else:
            is_valid = validator_fn(leader_res)

        if not is_valid:
            raise Exception("Consensus failed: Validator rejected leader proposal")

        return leader_res.calldata


class MockMessage:
    def __init__(self):
        self.sender_address = "0xAlice11111111111111111111111111111111111"
        self.value = 10000000000000000  # 0.01 GEN


class MockPublic:
    @staticmethod
    def write(fn):
        return fn

    class payable:
        def __call__(self, fn):
            return fn


class MockPublicWrapper:
    @staticmethod
    def write(fn=None):
        if fn is None:
            return MockPublicWrapper()
        return fn

    @staticmethod
    def view(fn):
        return fn

    @staticmethod
    def payable(fn):
        return fn


# Support @gl.public.write.payable syntax
def create_mock_public():
    class PublicWrite:
        def __call__(self, fn):
            return fn

        @staticmethod
        def payable(fn):
            return fn

    class Public:
        write = PublicWrite()

        @staticmethod
        def view(fn):
            return fn

    return Public()


class GenericMockStorage(dict):
    def __class_getitem__(cls, item):
        return cls


class GenericMockArray(list):
    def __class_getitem__(cls, item):
        return cls


class MockGL:
    def __init__(self):
        self.nondet = MockNondet()
        self.vm = MockGenVM()
        self.public = create_mock_public()
        self.message = MockMessage()

    class Contract:
        pass

    @staticmethod
    def emit_transfer(recipient, amount):
        pass


import types
if "genlayer" not in sys.modules:
    _gl_mod = types.ModuleType("genlayer")
    _gl_inst = MockGL()
    _gl_mod.gl = _gl_inst
    _gl_mod.allow_storage = lambda cls: cls
    _gl_mod.bigint = int
    _gl_mod.u256 = int
    _gl_mod.Address = str
    _gl_mod.TreeMap = GenericMockStorage
    _gl_mod.DynArray = GenericMockArray
    sys.modules["genlayer"] = _gl_mod


# Global mock installation helper accepting naked dict parameter (per spec)
def sim_installMocks(target_env, mocks: dict):
    """
    Installs mock configurations for web rendering and LLM prompt execution.
    Accepts a naked dictionary configuring 'nondet_web_request' (or 'web') and
    'nondet_exec_prompt' (or 'llm').
    """
    assert isinstance(mocks, dict), "sim_installMocks must receive a naked dictionary"

    if hasattr(target_env, "sim_installMocks"):
        return target_env.sim_installMocks(mocks)

    if hasattr(target_env, "provider") and hasattr(target_env.provider, "make_request"):
        try:
            return target_env.provider.make_request("sim_installMocks", mocks)
        except Exception:
            pass

    # Direct VM or in-memory mock environment
    web_mocks = mocks.get("nondet_web_request") or mocks.get("web") or {}
    llm_mocks = mocks.get("nondet_exec_prompt") or mocks.get("llm") or {}

    if hasattr(target_env, "nondet"):
        for url_pattern, content in web_mocks.items():
            target_env.nondet.web.urls[url_pattern] = content
        for prompt_pattern, response in llm_mocks.items():
            target_env.nondet.prompts[prompt_pattern] = response


# Setup test fixture
@pytest.fixture
def test_env(monkeypatch):
    mock_gl = MockGL()
    import contracts.claim_guard as cg

    monkeypatch.setattr(cg, "gl", mock_gl)
    monkeypatch.setattr(cg.gl.vm, "UserError", MockUserError)

    contract = cg.Contract()
    contract.policies = {}
    contract.claims = {}
    contract.user_latest_policy = {}
    contract.policy_to_claim = {}
    contract.total_policies = 0
    contract.total_claims = 0
    contract.total_coverage_pool = 0
    contract.total_premiums_collected = 0
    contract.total_payouts_distributed = 0
    contract.active_coverage = 0

    return {
        "contract": contract,
        "mock_gl": mock_gl,
        "module": cg,
    }


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

def test_sim_install_mocks_structure(test_env):
    """Verify sim_installMocks properly accepts and processes a naked dict."""
    mock_gl = test_env["mock_gl"]
    mocks = {
        "nondet_web_request": {
            "https://flightradar.com/BA1420": "Flight BA1420 arrived 4 hours late.",
            "https://ba.com/press": "Technical engine maintenance caused flight delay.",
        },
        "nondet_exec_prompt": {
            "flight insurance": {
                "verdict": "APPROVE_FULL",
                "payout_ratio": 100,
                "confidence": 95,
                "rationale": "4-hour mechanical delay is covered under policy terms."
            }
        }
    }
    # Must accept naked dict without throwing
    sim_installMocks(mock_gl, mocks)
    assert "https://flightradar.com/BA1420" in mock_gl.nondet.web.urls
    assert "flight insurance" in mock_gl.nondet.prompts


def test_buy_policy_valid(test_env):
    """Verify successful policy purchase and storage updates."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"
    mock_gl.message.value = 10000000000000000  # 0.01 GEN

    pol_id = contract.buy_policy(
        flight_number="BA1420",
        departure_date="2026-10-20",
        policy_terms="Severe delay >= 3 hours or cancellation. Payout 100%."
    )

    assert pol_id == "POL-000001"
    assert contract.total_policies == 1
    assert contract.total_premiums_collected == 10000000000000000
    assert contract.total_coverage_pool == 50000000000000000  # 5x coverage
    assert contract.active_coverage == 50000000000000000

    policy_raw = contract.get_policy(pol_id)
    policy = json.loads(policy_raw)
    assert policy["policy_id"] == "POL-000001"
    assert policy["flight_number"] == "BA1420"
    assert policy["departure_date"] == "2026-10-20"
    assert policy["status"] == "ACTIVE"
    assert policy["holder"] == "0xAlice11111111111111111111111111111111111"


def test_buy_policy_custom_premium(test_env):
    """Verify custom premium value scales coverage pool proportionally."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xBob2222222222222222222222222222222222222"
    mock_gl.message.value = 50000000000000000  # 0.05 GEN

    pol_id = contract.buy_policy("LH400", "2026-11-01", "Delay >= 3 hours")
    assert pol_id == "POL-000001"
    assert contract.total_premiums_collected == 50000000000000000
    assert contract.total_coverage_pool == 250000000000000000  # 5x = 0.25 GEN


def test_buy_policy_invalid_inputs(test_env):
    """Verify input validation rules for flight number, date, and terms."""
    contract = test_env["contract"]
    UserError = test_env["mock_gl"].vm.UserError

    # Invalid flight number
    with pytest.raises(UserError, match="flight_number"):
        contract.buy_policy("", "2026-10-20", "Terms")

    # Invalid departure date
    with pytest.raises(UserError, match="departure_date"):
        contract.buy_policy("BA1420", "bad", "Terms")

    # Invalid policy terms
    with pytest.raises(UserError, match="policy_terms"):
        contract.buy_policy("BA1420", "2026-10-20", "tiny")


def test_file_claim_approved_full(test_env):
    """Valid claim approval: Severe 4-hour delay results in APPROVE_FULL and 100% payout."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"
    mock_gl.message.value = 10000000000000000

    pol_id = contract.buy_policy("BA1420", "2026-10-20", "Severe delay >= 3 hours. 100% payout.")

    radar_url = "https://flightstatus.net/radar/BA1420"
    notice_url = "https://britishairways.com/notices/BA1420"

    sim_installMocks(mock_gl, {
        "nondet_web_request": {
            radar_url: "Flight BA1420 Scheduled: 10:00 UTC, Actual Arrival: 14:15 UTC. Status: DELAYED 4h 15m.",
            notice_url: "British Airways statement: BA1420 experienced unexpected turbine maintenance at gate.",
        },
        "nondet_exec_prompt": {
            "flight insurance": {
                "verdict": "APPROVE_FULL",
                "payout_ratio": 100,
                "confidence": 94,
                "rationale": "Evidence confirms flight BA1420 arrived 4h 15m late due to technical engine failure."
            }
        }
    })

    claim_id = contract.file_claim(
        policy_id=pol_id,
        flight_status_url=radar_url,
        airline_notice_url=notice_url,
        claimant_statement="My flight was delayed by over 4 hours due to mechanical issues."
    )

    assert claim_id == "CLAIM-000001"
    assert contract.total_claims == 1
    assert contract.total_payouts_distributed == 50000000000000000
    assert contract.active_coverage == 0

    claim_raw = contract.get_claim(claim_id)
    claim = json.loads(claim_raw)
    assert claim["claim_id"] == "CLAIM-000001"
    assert claim["policy_id"] == pol_id
    assert claim["verdict"] == "APPROVE_FULL"
    assert claim["payout_ratio"] == 100
    assert claim["payout_amount"] == 50000000000000000
    assert claim["confidence"] == 94
    assert "4h 15m late" in claim["rationale"]

    # Verify policy marked SETTLED
    pol = json.loads(contract.get_policy(pol_id))
    assert pol["status"] == "SETTLED"


def test_file_claim_approved_partial(test_env):
    """Valid claim partial approval: 2-hour delay with shared operational fault gives APPROVE_PARTIAL."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"
    mock_gl.message.value = 20000000000000000  # 0.02 GEN -> 0.10 GEN coverage

    pol_id = contract.buy_policy("UA901", "2026-10-22", "Delay >= 2 hours pays 50%, >= 4 hours pays 100%.")

    radar_url = "https://flightstatus.net/radar/UA901"
    notice_url = "https://united.com/notices/UA901"

    sim_installMocks(mock_gl, {
        "nondet_web_request": {
            radar_url: "Flight UA901 Arrival delayed by 2 hours 15 minutes.",
            notice_url: "United press: Baggage logistics and air traffic control hold.",
        },
        "nondet_exec_prompt": {
            "flight insurance": {
                "verdict": "APPROVE_PARTIAL",
                "payout_ratio": 50,
                "confidence": 78,
                "rationale": "Flight delayed 2h 15m qualifying for partial 50% payout tier."
            }
        }
    })

    claim_id = contract.file_claim(
        policy_id=pol_id,
        flight_status_url=radar_url,
        airline_notice_url=notice_url,
        claimant_statement="Flight arrived 2 hours late."
    )

    claim = json.loads(contract.get_claim(claim_id))
    assert claim["verdict"] == "APPROVE_PARTIAL"
    assert claim["payout_ratio"] == 50
    assert claim["payout_amount"] == 50000000000000000  # 50% of 0.10 GEN
    assert contract.total_payouts_distributed == 50000000000000000


def test_file_claim_rejected_ontime(test_env):
    """Claim rejection: Flight status indicates on-time arrival, resulting in REJECT and 0 payout."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"
    mock_gl.message.value = 10000000000000000

    pol_id = contract.buy_policy("DL123", "2026-10-25", "Delay >= 3 hours pays 100%.")

    radar_url = "https://flightstatus.net/radar/DL123"
    notice_url = "https://delta.com/notices/DL123"

    sim_installMocks(mock_gl, {
        "nondet_web_request": {
            radar_url: "Flight DL123 departed on time, arrived 5 minutes early.",
            notice_url: "Delta announcement: Normal flight operations.",
        },
        "nondet_exec_prompt": {
            "flight insurance": {
                "verdict": "REJECT",
                "payout_ratio": 0,
                "confidence": 98,
                "rationale": "Radar logs demonstrate flight DL123 landed early with 0 delay."
            }
        }
    })

    claim_id = contract.file_claim(
        policy_id=pol_id,
        flight_status_url=radar_url,
        airline_notice_url=notice_url,
        claimant_statement="My luggage was delayed."
    )

    claim = json.loads(contract.get_claim(claim_id))
    assert claim["verdict"] == "REJECT"
    assert claim["payout_ratio"] == 0
    assert claim["payout_amount"] == 0
    assert contract.total_payouts_distributed == 0

    pol = json.loads(contract.get_policy(pol_id))
    assert pol["status"] == "REJECTED"


def test_validator_rejection_verdict_divergence(test_env):
    """Validator rejects leader proposal when verdict diverges (APPROVE_FULL vs REJECT)."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"

    pol_id = contract.buy_policy("AF500", "2026-10-28", "Delay >= 3h")

    radar_url = "https://radar.net/AF500"
    notice_url = "https://airfrance.com/notices"

    mock_gl.nondet.web.urls[radar_url] = "Ambiguous delay logs"
    mock_gl.nondet.web.urls[notice_url] = "Notice regarding strike action"

    # Leader awards APPROVE_FULL
    mock_gl.nondet.prompts["flight insurance"] = {
        "verdict": "APPROVE_FULL",
        "payout_ratio": 100,
        "confidence": 85,
        "rationale": "Leader approves claim"
    }

    # Validator independently rules REJECT
    def verdict_mismatch_validator(leader_res):
        val_verdict = "REJECT"
        val_ratio = 0
        val_conf = 85

        if leader_res.calldata["verdict"] != val_verdict:
            return False
        return True

    mock_gl.vm.validator_override = verdict_mismatch_validator

    with pytest.raises(Exception, match="Consensus failed: Validator rejected leader proposal"):
        contract.file_claim(pol_id, radar_url, notice_url, "Flight cancelled")


def test_validator_rejection_bracket_divergence(test_env):
    """Validator rejects leader proposal when payout brackets diverge (FULL vs PARTIAL)."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    cg = test_env["module"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"

    pol_id = contract.buy_policy("EK201", "2026-11-05", "Delay >= 3h")

    radar_url = "https://radar.net/EK201"
    notice_url = "https://emirates.com/notices"

    mock_gl.nondet.web.urls[radar_url] = "Flight delayed"
    mock_gl.nondet.web.urls[notice_url] = "Weather notice"

    mock_gl.nondet.prompts["flight insurance"] = {
        "verdict": "APPROVE_FULL",
        "payout_ratio": 85,  # Bracket 2 (FULL)
        "confidence": 80,
        "rationale": "Leader proposal"
    }

    # Validator produces ratio 60 (Bracket 1: PARTIAL)
    def bracket_mismatch_validator(leader_res):
        val_ratio = 60
        if cg.get_payout_bracket(leader_res.calldata["payout_ratio"]) != cg.get_payout_bracket(val_ratio):
            return False
        return True

    mock_gl.vm.validator_override = bracket_mismatch_validator

    with pytest.raises(Exception, match="Consensus failed: Validator rejected leader proposal"):
        contract.file_claim(pol_id, radar_url, notice_url, "Delay claim")


def test_validator_rejection_confidence_band_divergence(test_env):
    """Validator rejects leader proposal when confidence bands diverge (HIGH vs MED)."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    cg = test_env["module"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"

    pol_id = contract.buy_policy("QR100", "2026-11-10", "Delay >= 3h")

    radar_url = "https://radar.net/QR100"
    notice_url = "https://qatar.com/notices"

    mock_gl.nondet.web.urls[radar_url] = "Radar feed"
    mock_gl.nondet.web.urls[notice_url] = "Qatar notice"

    mock_gl.nondet.prompts["flight insurance"] = {
        "verdict": "APPROVE_FULL",
        "payout_ratio": 90,
        "confidence": 85,  # Band 2 (HIGH)
        "rationale": "Leader proposal"
    }

    # Validator produces confidence 50 (Band 1: MED)
    def conf_mismatch_validator(leader_res):
        val_conf = 50
        if cg.get_confidence_band(leader_res.calldata["confidence"]) != cg.get_confidence_band(val_conf):
            return False
        return True

    mock_gl.vm.validator_override = conf_mismatch_validator

    with pytest.raises(Exception, match="Consensus failed: Validator rejected leader proposal"):
        contract.file_claim(pol_id, radar_url, notice_url, "Delay claim")


def test_claim_on_nonexistent_policy(test_env):
    """Verify filing a claim on a nonexistent policy raises UserError."""
    contract = test_env["contract"]
    UserError = test_env["mock_gl"].vm.UserError

    with pytest.raises(UserError, match="Policy not found"):
        contract.file_claim("POL-999999", "https://radar.net/1", "https://notice.net/1", "Claim")


def test_claim_on_already_settled_policy(test_env):
    """Verify double-claiming on an already settled policy is rejected."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    UserError = mock_gl.vm.UserError
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"

    pol_id = contract.buy_policy("BA1420", "2026-10-20", "Severe delay >= 3h")

    radar_url = "https://flightstatus.net/radar/BA1420"
    notice_url = "https://britishairways.com/notices/BA1420"

    sim_installMocks(mock_gl, {
        "nondet_web_request": {
            radar_url: "Flight delayed 4 hours",
            notice_url: "Maintenance statement",
        },
        "nondet_exec_prompt": {
            "flight insurance": {
                "verdict": "APPROVE_FULL",
                "payout_ratio": 100,
                "confidence": 95,
                "rationale": "Approved delay claim"
            }
        }
    })

    # First claim succeeds
    contract.file_claim(pol_id, radar_url, notice_url, "First claim statement")

    # Second claim on same policy must fail
    with pytest.raises(UserError, match="not active"):
        contract.file_claim(pol_id, radar_url, notice_url, "Second claim attempt")


def test_claim_unauthorized_claimant(test_env):
    """Verify only the policy holder can file a claim."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    UserError = mock_gl.vm.UserError

    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"
    pol_id = contract.buy_policy("BA1420", "2026-10-20", "Delay >= 3h")

    # Different sender attempts claim
    mock_gl.message.sender_address = "0xEve9999999999999999999999999999999999999"
    with pytest.raises(UserError, match="Unauthorized: Only the policy holder can file a claim"):
        contract.file_claim(pol_id, "https://radar.net/1", "https://notice.net/1", "Eve's fraudulent claim")


def test_claim_invalid_urls(test_env):
    """Verify URLs without http:// or https:// are rejected."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    UserError = mock_gl.vm.UserError
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"

    pol_id = contract.buy_policy("BA1420", "2026-10-20", "Delay >= 3h")

    with pytest.raises(UserError, match="flight_status_url"):
        contract.file_claim(pol_id, "ftp://radar.net/data", "https://notice.net/1", "Statement")

    with pytest.raises(UserError, match="airline_notice_url"):
        contract.file_claim(pol_id, "https://radar.net/1", "file:///etc/passwd", "Statement")


def test_views_and_pool_summary(test_env):
    """Verify get_pool_summary aggregates accurate protocol metrics."""
    contract = test_env["contract"]
    mock_gl = test_env["mock_gl"]
    mock_gl.message.sender_address = "0xAlice11111111111111111111111111111111111"
    mock_gl.message.value = 10000000000000000

    pol_id = contract.buy_policy("BA1420", "2026-10-20", "Severe delay >= 3h")

    summary_raw = contract.get_pool_summary()
    summary = json.loads(summary_raw)

    assert summary["total_policies"] == 1
    assert summary["total_claims"] == 0
    assert summary["total_premiums_collected"] == 10000000000000000
    assert summary["total_coverage_pool"] == 50000000000000000
    assert summary["active_coverage"] == 50000000000000000
    assert summary["total_payouts_distributed"] == 0
