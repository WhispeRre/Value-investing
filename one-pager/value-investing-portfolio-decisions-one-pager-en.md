# Value Investing Portfolio Decisions

## 1. How I think about Alva

Alva's value is not only in answering questions. Through Skills and Agents, it can connect company fundamentals, market data, research, and news, then turn fragmented inputs into continuously updated decision evidence. That ability to organize complex information into useful indicators is a strong product direction.

The blank conversation box is also a barrier. Most users do not know what to ask or how to combine financial metrics, news, and market signals. Alva should first learn a user's familiar industries, securities, horizon, and risk tolerance, then recommend or generate a relevant Playbook. Users should see a concrete decision solution before they are asked to discover the platform's capabilities themselves.

## 2. How the Skill is designed

I am a value investor. I believe people cannot reliably make money outside what they understand. The Skill therefore starts by defining a user's circle of competence and selected universe, and researches only inside that scope.

Each security receives one timestamped evidence packet before independent role review, borrowing TradingAgents' role-based structure:

- Business, Fundamental, Valuation, Industry/Cycle, and Thesis roles examine business quality, financial strength, valuation, industry conditions, and thesis integrity.
- Bull and Bear use the same evidence packet to test upside potential and value-trap risk, while preserving material conflicts.
- Thesis Risk, Portfolio Risk, and Position check permanent impairment, portfolio limits, and staged capacity.

The live Alva Playbook currently runs `INDEPENDENT_RULE_BASED_PASSES`. Role scores are transparent calculations over real Arrays data; they are not random values and are not presented as an open-ended LLM debate. Facts, calculations, policy assumptions, and missing evidence remain separate.

## 3. What it does for value investing

This Skill does not predict tomorrow's price. It asks three long-term questions every day: Has value changed? Does price offer a margin of safety? Is the risk still worth carrying?

The Playbook presents today's decision, Bear/Base/Bull valuation ranges, logic risk, and the method behind the conclusion. An addition must pass valuation, thesis, risk, and position checks and is built in stages. Hold is a valid decision. Selling distinguishes thesis impairment, value realization, and excessive position risk. Learning Circle securities remain research-only.

The goal is to reduce three recurring mistakes: investing outside one's understanding, treating every decline as cheapness, and refusing to act after the thesis changes. The Skill provides auditable decision support; it does not promise returns or place orders.

