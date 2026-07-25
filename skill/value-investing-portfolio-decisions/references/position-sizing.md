# Position Sizing And Tranches

Compute a target weight before computing a trade. A target reflects quality,
confidence, margin of safety, liquidity, correlation, and the user's hard
limits. A tranche is a fraction of the target weight, not automatically a
fraction of total account value.

Example: a 12% target split into four tranches means each tranche is 3% of the
portfolio. Each add requires a fresh thesis and risk check; never average down
solely because price fell.

Output `current_weight`, `target_weight`, `remaining_capacity`, tranche index,
and the proposed change. If holdings, cash, or cost basis are missing, use
watchlist mode and do not fabricate a portfolio action.
