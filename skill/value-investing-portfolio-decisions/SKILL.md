---
name: value-investing-portfolio-decisions
description: Create a daily value-investing portfolio decision workflow constrained by a user's circle of competence, selected tickers, and investment policy. Use for monitoring holdings or in-scope candidates, estimating intrinsic value, cross-validating evidence through independent specialist, Bull/Bear, risk, and portfolio roles, managing staged position sizing, and producing buy, hold, trim, or exit decisions. This skill owns investment reasoning and multi-agent decision contracts; delegate Alva data access, automation, Playbook publication, alerts, and Altra implementation to the installed Alva skill.
---

# Value Investing Portfolio Decisions

Turn a confirmed mandate into a daily decision-support workflow. Never promise
profitable or correct trades.

## Boundary With The Alva Skill

Use the installed Alva skill for data, runtime, Automation, Playbook, alerts,
and Altra. Do not duplicate its platform lifecycle.

Own only the investment method: mandate, universe, evidence contract,
multi-agent cross-validation, valuation, thesis state, portfolio risk, position
sizing, action rules, and notification meaning. Hand those contracts to the
Alva skill for implementation.

## Decision Modes

- `QUIET_REFRESH`: no material evidence or state change. Preserve the prior
  decision, return `NO_ACTION`, and do not rerun opinion agents.
- `SPECIALIST_REFRESH`: new evidence affects one or more specialist domains,
  but no action transition is proposed. Run only affected specialists and the
  Research Manager.
- `ACTION_REVIEW`: a possible `ACCUMULATE`, `TRIM`, `EXIT`, thesis-risk
  transition, hard-limit breach, or material unresolved conflict. Run the full
  cross-validation and risk sequence before Portfolio Manager adjudication.

## Workflow

1. **Choose the mode.** Identify existing holdings, a fixed watchlist, or
   discovery only inside user-approved industries.
2. **Build the mandate.** Read [onboarding.md](references/onboarding.md). Record
   markets, core and learning circles, exclusions, horizon, risk limits,
   valuation policy, tranche policy, and notification cadence.
3. **CHECKPOINT - confirm scope.** Show conservative defaults and obtain user
   confirmation before creating actions, hosted workflows, or alerts.
4. **Freeze the universe.** Apply
   [circle-of-competence.md](references/circle-of-competence.md). Never expand
   the candidate universe silently.
5. **Build one evidence packet.** Give every required role the same timestamped
   facts, computed values, policy, prior decision, and missing-data map. Keep
   role opinions out of the packet. Follow
   [agent-contracts.md](references/agent-contracts.md).
6. **Run blind specialist passes.** Run Business, Fundamental, Valuation,
   Industry/Cycle, and Thesis agents independently. Do not show a specialist
   another role's conclusion before its first response.
7. **Select the decision mode.** Compare the evidence packet and specialist
   claims with bounded prior state. Use `ACTION_REVIEW` whenever a new
   `ADD`, `TRIM`, or `EXIT` could result.
8. **Cross-examine action candidates.** In `ACTION_REVIEW`, run separate Bull
   and Bear invocations. Each must cite claim and evidence IDs, challenge the
   opponent's highest-impact claims, and answer the opponent once. Allow one
   additional round only when a material conflict remains unresolved.
9. **Adjudicate research.** The Research Manager records supported conclusions,
   rejected claims, unresolved conflicts, missing evidence, and a provisional
   state. Do not use majority voting.
10. **Run independent risk reviews.** Thesis Risk checks permanent impairment;
    Portfolio Risk checks concentration, correlation, liquidity, and mandate
    limits; Position computes target weight and tranche capacity. Each reviews
    the provisional plan independently before seeing the others' conclusions.
11. **Make the portfolio decision.** The Portfolio Manager applies the mandate,
    hard vetoes, evidence quality, thesis status, valuation, unresolved
    conflicts, and position capacity. Apply
    [decision-state-machine.md](references/decision-state-machine.md),
    [position-sizing.md](references/position-sizing.md), and
    [exit-policy.md](references/exit-policy.md).
12. **Run daily, notify selectively.** Persist the evidence, role reports,
    challenges, adjudication trace, and final decision. Alert only for a new
    state, action, material valuation/thesis/risk change, or policy reminder.
13. **Validate.** Apply
    [decision-evaluation.md](references/decision-evaluation.md). Use Altra
    through the Alva skill for any backtest or portfolio simulation.

## Execution Requirements

- Run each required role as a separate invocation when supported. Otherwise
  use isolated sequential calls with separate role prompts and context.
- Never ask one model call to impersonate all roles and call that independent
  cross-validation.
- Keep facts, calculations, assumptions, agent inference, challenges, and
  manager decisions as separate fields.
- Let Bull and Bear argue from the same evidence packet. Neither may introduce
  an uncited financial fact.
- Let a hard mandate breach or confirmed thesis break veto an add. The
  Portfolio Manager may not override a hard veto without explicit user review.
- Cap final confidence at the weakest decision-critical evidence or role
  confidence. Do not raise confidence because several roles repeat one source.
- If a critical conflict remains unresolved, return `RESEARCH`, `HOLD`,
  `VALUATION_UNCERTAIN`, or `DATA_INSUFFICIENT`; do not force an action.

## Failure Handling

| Trigger | First response | If still unresolved |
|---|---|---|
| Distinct or isolated role calls are unavailable | Set `cross_validation_mode` to `SIMULATED` | Prohibit new `ADD`, `TRIM`, or `EXIT`; return research or hold |
| Evidence packet is stale or missing critical fields | Rerun the affected data path | Return `DATA_INSUFFICIENT` and list missing evidence |
| A role returns uncited facts | Reject those claims and rerun once with the evidence contract | Exclude the role and reduce final confidence |
| Bull/Bear do not address each other | Run one directed rebuttal using claim IDs | Mark the conflict unresolved |
| Research Manager and a hard risk gate disagree | Apply the hard gate | Require explicit user review before any override |
| Holdings, cash, or cost basis are unknown | Switch to watchlist mode | Output model targets only, never personal trade sizes |

## Prohibited Patterns

- Do not recommend outside the confirmed mandate.
- Do not treat a low price as proof of undervaluation.
- Do not let several roles restate the same source and count it as consensus.
- Do not let managers invent new evidence during adjudication.
- Do not use a fixed percentage stop or take-profit as the only sell logic.
- Do not average down solely because price fell.
- Do not hide dissent, missing evidence, or risk vetoes from the final output.
- Do not place live orders. Follow Alva trading rules if the user later requests
  a signal or execution artifact.

## Output Shape

Return one structured decision per in-scope security:

```json
{
  "symbol": "TICKER",
  "state": "ACCUMULATE",
  "action": "ADD",
  "current_weight": 0.04,
  "target_weight": 0.12,
  "tranche": { "index": 2, "total": 4, "pct_of_target": 0.25 },
  "valuation": { "bear": null, "base": null, "bull": null, "margin_of_safety": null },
  "thesis_status": "INTACT",
  "risk_status": "WITHIN_LIMIT",
  "cross_validation": {
    "mode": "INDEPENDENT",
    "agents_run": [],
    "supported_claim_ids": [],
    "rejected_claim_ids": [],
    "unresolved_conflict_ids": [],
    "risk_vetoes": []
  },
  "confidence": 0.0,
  "reason": "",
  "evidence_ids": [],
  "alert_worthy": false
}
```

Expose the daily queue, evidence packet, role reports, Bull/Bear challenges,
risk reviews, valuation zones, position ladder, and Portfolio Manager trace in
the Playbook. Deep-link every alert to the matching decision and evidence.
