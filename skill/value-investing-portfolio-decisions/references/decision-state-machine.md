# Decision State Machine

Normal states:

```text
WATCH -> RESEARCH -> ACCUMULATE -> HOLD -> TRIM -> EXIT
```

Exception states: `THESIS_AT_RISK`, `THESIS_BROKEN`, `DATA_INSUFFICIENT`, and
`VALUATION_UNCERTAIN`.

Enter `ACCUMULATE` only when quality, valuation, thesis, and risk gates pass.
Enter `TRIM` when price reaches a value band, expected return falls below the
policy floor, or the position exceeds its limit. Enter `EXIT` when the thesis
or economics are invalidated, risk becomes unacceptable, or valuation leaves
insufficient future return.

Any new `ACCUMULATE`, `TRIM`, or `EXIT` transition requires `ACTION_REVIEW`:
independent specialist reports, Bull/Bear cross-examination, Research Manager
adjudication, independent Thesis Risk, Portfolio Risk, and Position reviews,
and a Portfolio Manager decision. A hard veto blocks an add. A confirmed thesis
break has priority over valuation or price.

If a decision-critical conflict remains unresolved, use `RESEARCH`, `HOLD`,
`THESIS_AT_RISK`, or `VALUATION_UNCERTAIN` according to the evidence. Do not
force an action to make the state machine advance.

A daily run must compare the current state with bounded prior state. Unchanged
state returns `NO_ACTION`; it must not create a new recommendation merely from
rewritten prose.
