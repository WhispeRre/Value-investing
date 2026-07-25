# Multi-Agent Contracts

Use one shared evidence packet, independent first-pass role reports, directed
cross-examination, and two manager decisions. Roles may interpret sourced facts
but may not create financial facts, valuation inputs, or event dates.

## Evidence Packet

Build the packet before running opinion agents:

```json
{
  "packet_id": "ticker-asof-version",
  "symbol": "TICKER",
  "as_of": "RFC3339 timestamp",
  "mandate_version": "string",
  "facts": [],
  "computed_values": [],
  "valuation_inputs": [],
  "current_position": {},
  "portfolio_constraints": {},
  "prior_decision": {},
  "missing_evidence": []
}
```

Every fact and computed value needs a stable `evidence_id`, source, observation
time, period or horizon, units, and calculation lineage where applicable. Keep
prior agent opinions out of the packet.

## Role Report

Require every specialist, debate, and risk role to return:

```json
{
  "role": "VALUATION",
  "verdict": "UNDERVALUED",
  "claims": [
    {
      "claim_id": "valuation-001",
      "claim": "text",
      "kind": "FACT|CALCULATION|ASSUMPTION|INFERENCE",
      "evidence_ids": [],
      "materiality": "LOW|MEDIUM|HIGH",
      "confidence": 0.0
    }
  ],
  "assumptions": [],
  "missing_evidence": [],
  "suggested_state": "RESEARCH",
  "confidence": 0.0
}
```

Reject a claim when an asserted fact lacks an `evidence_id`, its period or units
do not match the comparison, or the supporting source is stale under the
mandate. Do not convert rejected claims into manager evidence.

## Specialist Roles

- **Business:** business model, moat, revenue drivers, competitive advantage,
  governance, and quality risks.
- **Fundamental:** normalized earnings, cash flow, balance sheet, capital
  returns, and KPI trend.
- **Valuation:** method selection, bear/base/bull range, assumptions,
  sensitivity, expected return, and margin of safety. Apply
  [valuation-policy.md](valuation-policy.md).
- **Industry/Cycle:** industry structure, cycle, benchmark, regulation, and
  common-factor exposure.
- **Thesis:** explicit thesis claims, confirming evidence, falsification
  conditions, and changes from the prior decision.

Run the required specialists independently against the evidence packet. A
specialist must not see another role's verdict before its first response.

## Research Cross-Validation

### Research Manager Intake

The Research Manager validates report shape and evidence, deduplicates claims
that rely on the same source, and creates a conflict set. It must not decide by
counting role votes.

Escalate to `ACTION_REVIEW` when any of these occurs:

- a provisional transition to `ACCUMULATE`, `TRIM`, or `EXIT`;
- a thesis or hard-risk state changes;
- valuation confidence is low but an action is proposed;
- two high-materiality claims conflict;
- price enters a policy action zone;
- a portfolio or position limit is breached.

### Bull/Bear Debate

Give both roles the evidence packet, accepted specialist reports, and conflict
set.

- **Bull:** build the strongest durable upside case, identify value-realization
  paths, and challenge the highest-impact Bear claims.
- **Bear:** test for a value trap, expose fragile assumptions, define downside
  and falsification conditions, and challenge the highest-impact Bull claims.

Require separate initial cases. Then require one directed response from each
side. Each challenge must use this shape:

```json
{
  "conflict_id": "conflict-001",
  "challenger": "BEAR",
  "target_claim_id": "bull-002",
  "challenge": "text",
  "counter_evidence_ids": [],
  "response": "text",
  "status": "RESOLVED|PARTIAL|UNRESOLVED"
}
```

Allow at most one additional round when an unresolved conflict can change the
state or target weight. Otherwise preserve the disagreement for adjudication.

### Research Manager Decision

Return:

- supported and rejected claim IDs;
- resolved and unresolved conflict IDs;
- missing decision-critical evidence;
- provisional state and action;
- confidence capped by the weakest critical input;
- explicit abstention reason when no action is justified.

## Risk And Position Review

Give the Research Manager plan separately to three roles:

- **Thesis Risk:** test permanent impairment, accounting or governance risk,
  and thesis falsification. It may issue a hard veto for confirmed thesis
  break or invalid economics.
- **Portfolio Risk:** test position and sector limits, correlation, liquidity,
  drawdown budget, and mandate compliance. It may issue a hard veto for a
  policy breach that the proposed action would worsen.
- **Position:** compute current weight, target weight, remaining capacity,
  tranche index, and proposed change. It cannot improve a state rejected by a
  thesis or portfolio hard veto.

Each role must complete its first review before seeing the others' conclusions.
Afterward, allow one directed challenge only when their recommendations conflict
on action direction or hard-veto status.

## Portfolio Manager Adjudication

Use this priority order:

1. confirmed mandate and circle of competence;
2. evidence sufficiency and freshness;
3. thesis integrity and hard vetoes;
4. business quality and valuation;
5. portfolio capacity and tranche policy;
6. unresolved material conflicts;
7. expected return relative to risk and opportunity cost.

The Portfolio Manager must cite the accepted claim IDs, rejected claim IDs,
unresolved conflicts, and vetoes behind the final state. It may not invent new
evidence or override a hard veto without explicit user review.

## Degraded Modes

| Condition | Mode | Allowed output |
|---|---|---|
| Separate role invocations and isolated context are available | `INDEPENDENT` | Full decision contract |
| Only isolated sequential role calls are available | `ISOLATED_SEQUENTIAL` | Full decision contract with reduced independence note |
| One call must simulate every role | `SIMULATED` | Research, hold, or data-insufficient only |
| Critical evidence or a mandatory role fails twice | `INCOMPLETE` | No new action; list missing role or evidence |

## Anti-Patterns

- Do not expose one specialist's conclusion to another before blind first pass.
- Do not count repeated use of one source as independent confirmation.
- Do not accept uncited facts because multiple roles repeat them.
- Do not summarize away dissent or unresolved conflicts.
- Do not let Bull, Bear, or a manager change deterministic calculations.
- Do not run a full debate on an unchanged quiet day solely to generate prose.
