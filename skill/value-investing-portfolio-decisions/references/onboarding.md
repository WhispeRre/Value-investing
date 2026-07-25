# Onboarding And Mandate

Use a short, conversational setup before analysis.

## Modes

- **Existing holdings:** inspect current holdings, cost basis, weights, and
  target weights. Do not require a new discovery universe.
- **Fixed watchlist:** analyze only user-provided symbols.
- **In-circle discovery:** discover candidates only within user-approved
  industries, markets, business models, and exclusions.

## Required Mandate Fields

Collect or conservatively default: market/listing scope; core, learning, and
excluded circles; allowed tickers; investment horizon; risk tolerance; minimum
margin of safety; maximum position and sector weights; tranche count; price-stop
preference; valuation methods the user understands; and daily analysis versus
push cadence.

Ask the user to explain what they understand about an industry. A broad theme
such as “AI” is not a sufficient circle; decompose it into business models or
value-chain segments. Confirm the resulting mandate before creating the hosted
workflow.

Persist a versioned mandate. A changed mandate requires re-evaluating candidate
eligibility and position limits, but must not erase historical decisions.
