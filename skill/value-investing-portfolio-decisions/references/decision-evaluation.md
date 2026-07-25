# Evaluation And Validation

Validate the domain method separately from Alva platform delivery. Test:

- scope isolation: no out-of-scope candidate receives an action;
- blind first pass: specialists do not receive another role's verdict before
  producing their own report;
- invocation isolation: required roles run separately or the result is labeled
  `SIMULATED` and prohibited from creating a new action;
- source independence: repeated claims from one source do not increase
  consensus or confidence;
- directed debate: Bull and Bear challenge specific claim IDs and answer each
  other before an action transition;
- adjudication trace: supported, rejected, and unresolved claims survive into
  the Portfolio Manager record;
- veto behavior: a hard mandate breach or confirmed thesis break blocks an add;
- missing history, missing weight, missing cost basis, and stale data;
- unchanged runs take the quiet path;
- material valuation, thesis, risk, and state changes produce one decision;
- tranche arithmetic never exceeds target or hard limits;
- price-only declines do not force a sale when value and thesis are intact;
- thesis breaks trigger exit review even without a price threshold;
- unresolved high-materiality conflicts degrade to research, hold, or an
  exception state rather than a forced action;
- alert links identify the same decision shown in the interface.

Use three forward-test cases: an apparently undervalued security with worsening
cash flow, an intact thesis whose position exceeds the mandate limit, and an
unchanged daily run. Verify that the first triggers Bull/Bear and thesis-risk
review, the second produces a portfolio-risk trim without declaring the thesis
broken, and the third stays quiet without rerunning opinion agents.

For performance evaluation, use Altra through the Alva skill with point-in-time
data and explicit fees, slippage, benchmark, horizons, and non-overlap rules.
Measure drawdown, downside capture, turnover, alert precision, and 6/12/24
month forward outcomes, not only next-day hit rate. Never claim guaranteed
returns.
