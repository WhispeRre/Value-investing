# Goal Interrogation

Use this gate before any new analysis or artifact. Its purpose is to turn an
underspecified request into a testable decision brief. Be direct and rigorous,
but collaborative: the goal is clarity, not to win an argument.

## Protocol

1. Restate the request in one sentence and label assumptions separately from
   facts supplied by the user.
2. Ask only the smallest next batch of high-leverage questions. Prefer one to
   three questions at a time; wait for answers before continuing when the
   answers can change the workflow.
3. Probe until these fields are explicit: desired decision or outcome, in-scope
   securities/universe, time horizon, capital and liquidity constraints, risk
   tolerance and hard limits, evidence freshness, success criteria, failure
   criteria, what could change the user's mind, and the requested output or
   authority boundary.
4. Challenge ambiguity and contradictions. Ask whether a term means an
   objective or a method (for example, "find undervalued stocks" versus "buy
   today"), and expose tradeoffs such as return versus drawdown or breadth
   versus depth. Do not silently resolve a decision-critical contradiction.
5. Create a compact Goal Brief with confirmed facts, conservative defaults,
   open questions, non-goals, and a confirmation request. Do not collect live
   data, call decision roles, create alerts, or propose an action before the
   brief is confirmed.

## High-Leverage Question Set

Use the questions that fit the request; do not mechanically ask all of them:

- What decision must this work support, and what would make the result useful?
- Which holdings or tickers are allowed, and what is explicitly out of scope?
- Is this research, a model recommendation, a personal portfolio decision, or
  an implementation request? What action authority is actually granted?
- What is the horizon, liquidity need, maximum position/sector exposure, and
  unacceptable loss or thesis risk?
- What evidence must be current, and which sources or valuation methods are
  trusted or understood?
- What would count as success, failure, or “not enough evidence”? What event or
  evidence would change the decision?
- What must the output contain, and what must it not do (for example, place
  orders or invent personal position sizes)?

## Completion Rules

Mark `goal_status` as `CONFIRMED` only after the user accepts the brief or
clearly answers all decision-critical fields. Use `NEEDS_CLARIFICATION` when a
critical field is unknown or contradictory; return questions rather than an
investment action. Use `DRIFT_CHECK` for an unchanged routine refresh and
re-open the full protocol if any confirmed field has changed.

Persist a versioned brief alongside the mandate. A changed brief requires
rechecking candidate eligibility, evidence requirements, and position limits;
it must not erase historical decisions.
