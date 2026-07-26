# Value Investing Portfolio Decisions

## 1. How I think about Alva

Alva's value is not only in answering questions. Through Skills and Agents, it can connect company fundamentals, market data, research, and news, then turn fragmented inputs into continuously updated decision evidence. That ability to organize complex information into useful indicators is a strong product direction.

The blank conversation box is also a barrier. Most users do not know what to ask or how to combine financial metrics, news, and market signals. Alva should first learn a user's familiar industries, securities, horizon, and risk tolerance, then recommend or generate a relevant Playbook. Users should see a concrete decision solution before they are asked to discover the platform's capabilities themselves.

## 2. How the Skill is designed

The Skill follows five architectural stages: clarify the need, establish constraints, assemble evidence, cross-validate the reasoning, and produce a decision.

First, it borrows the core idea of Grill Me. Instead of immediately analyzing a user's initial request, the Skill uses a multi-turn dialogue to clarify the actual decision to be supported, circle of competence, securities in scope, investment horizon, risk tolerance, success criteria, and action boundaries. It turns those answers into a Goal Brief for user confirmation. This separates the user's real objective from a proposed method and prevents a polished but unsuitable answer from being produced while the need is still ambiguous.

Once the need is clear, the Skill adopts the multi-agent debate pattern used by TradingAgents. It creates one shared evidence packet for each security, then asks independent roles to examine business quality, fundamentals, valuation, industry conditions, and thesis integrity. Bull and Bear agents cross-examine one another using the same facts and preserve unresolved disagreements. Thesis risk, portfolio risk, and position roles then review the provisional conclusion before the Portfolio Manager adjudicates it. This is not majority voting: every conclusion must remain connected to its evidence, assumptions, conflicts, and risk constraints, improving confidence, explainability, and traceability.

The complete flow is: multi-turn requirement clarification → confirmed Goal Brief → fixed circle of competence, security universe, and investment policy → shared evidence packet → independent role analysis → Bull/Bear debate → risk and position review → buy, hold, trim, exit, or further-research decision → continuously updated Playbook. These constraints and decision gates turn the Playbook from a market-information display into a decision framework aligned with the user's actual needs, knowledge boundaries, and investment preferences.

## 3. What it does for value investing

This Skill does not predict tomorrow's price. It asks three long-term questions every day: Has value changed? Does price offer a margin of safety? Is the risk still worth carrying?

The Playbook presents today's decision, Bear/Base/Bull valuation ranges, logic risk, and the method behind the conclusion. An addition must pass valuation, thesis, risk, and position checks and is built in stages. Hold is a valid decision. Selling distinguishes thesis impairment, value realization, and excessive position risk. Learning Circle securities remain research-only.

The goal is to reduce three recurring mistakes: investing outside one's understanding, treating every decline as cheapness, and refusing to act after the thesis changes. The Skill provides auditable decision support; it does not promise returns or place orders.
