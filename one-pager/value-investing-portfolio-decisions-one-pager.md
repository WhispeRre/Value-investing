# Value Investing Portfolio Decisions

## 中文版

### 我想解决的，不是“明天涨不涨”

我是一名价值投资者。我不希望系统每天猜一次短期涨跌，也不希望它为了显得有用而每天给出交易动作。我真正需要回答的是：这家公司是否仍在我的认知范围内，它的长期价值有没有改变，当前价格是否留出了足够的安全边际，以及现有仓位是否值得承担这份风险。

我相信“人没有办法赚到自己认知以外的钱”。所以，这个 Skill 的第一步不是扫描整个市场，而是让用户定义自己的能力圈、关注行业、自选标的、持仓、投资期限和风险边界。系统只能在这个范围里研究和提出建议。对于不熟悉的行业、无法解释的商业模式或证据不足的公司，最合理的结论不是买入，而是暂不行动。

价值投资也不是“买入后永远不卖”。当一家好公司的价格显著低于内在价值，我希望分批建立仓位；价格继续下跌时，我要先分清安全边际是在扩大，还是投资逻辑已经受损；当价值被市场重新认识、预期回报下降、仓位过重或投资逻辑被证伪时，我要有纪律地减仓或退出。

因此，我把这个产品定义为一套长期投资决策系统：每天更新证据，但只在证据足以改变判断时行动。

### 核心设计：让不同角色互相挑战

单一 Agent 很容易被最先形成的观点带偏。看多之后，它会倾向于寻找支持材料；看到股价下跌，也可能把“更便宜”误当成“更有价值”。我借鉴 TradingAgents 的多角色思路，但不让几个角色简单投票，而是让它们基于同一份、带时间戳的证据独立判断，再围绕冲突进行质询。

完整决策分为四层：

1. **独立研究。** Business、Fundamental、Valuation、Industry/Cycle 和 Thesis 角色分别检查商业质量、财务趋势、估值区间、行业周期和投资逻辑。它们在第一次判断时看不到其他角色的结论，避免互相锚定。
2. **多空对抗。** Bull 负责建立最强的长期上行逻辑，Bear 负责识别价值陷阱、脆弱假设和下行条件。双方必须引用具体证据和对方的具体观点，不能各说各话。
3. **独立风险复核。** Thesis Risk 判断公司价值是否遭到永久破坏；Portfolio Risk 检查行业集中度、仓位上限、相关性和流动性；Position 计算目标仓位、剩余容量和下一笔分批动作。
4. **两级裁决。** Research Manager 先处理证据质量、重复来源和研究分歧，Portfolio Manager 再结合用户的投资规则、估值、安全边际和组合容量给出最终状态。

这套机制不按票数决定买卖。投资逻辑被确认破坏或组合限制被突破时，风险角色可以否决加仓；关键分歧没有解决时，系统必须回到“继续研究”“持有”或“估值不确定”，不能为了输出一个结论而强行交易。多角色的价值不在于制造更多观点，而在于暴露单一判断最容易忽略的反证。

### Alva 数据如何变成决策

Alva 提供持续更新的数据与研究资料，包括价格和历史行情、财务报表、盈利与现金流、资产负债表、市场预期、公司事件、新闻以及行业和宏观信息。Skill 负责定义如何使用这些资料，Automation 负责按计划更新和比较前后变化。

每个标的先形成一份共享证据包。可追溯事实、确定性计算、估值假设和 Agent 推断会被分开记录，所有关键证据都带来源、观察时间和适用周期。估值不使用一个看似精确的目标价，而是给出 Bear、Base、Bull 三种情景，显示当前价格、长期价值区间、安全边际、关键假设和置信度。

每日运行不等于每日完整辩论：

- **没有实质变化：** 保留原判断，显示 `NO_ACTION`，不重复生成观点，也不发送提醒。
- **局部证据变化：** 只让受影响的研究角色更新，再检查变化是否足以影响决策。
- **可能买入、减仓或退出：** 进入完整的多角色对抗、风险复核和 Portfolio Manager 裁决。

信号的优先级也不是按当天涨跌幅排序。能力圈和用户规则先于一切，其次是证据是否完整和新鲜、投资逻辑是否成立、是否触发风险否决，然后才看商业质量、估值、安全边际、仓位容量和机会成本。这样可以过滤日常价格噪音，把注意力留给真正会改变长期回报或下行风险的信息。

### Playbook 是用户每天打开的决策 Dashboard

我希望用户打开 Playbook 后，先看到“今天是否需要处理”，而不是先读一篇很长的报告。Dashboard 的信息结构应当直接服务于决策：

- **Decision Queue：** 按风险和决策重要性排列需要复核的标的，并说明今天为什么进入队列。
- **Valuation Map：** 显示当前价格、Bear/Base/Bull 价值区间、安全边际和估值假设的变化。
- **Thesis Monitor：** 显示投资逻辑当前是成立、承压还是被证伪，以及哪些证据发生了变化。
- **Role Debate：** 保留 Bull、Bear 和专业研究角色的关键分歧，标记已经解决与尚未解决的问题。
- **Position Plan：** 显示当前仓位、目标仓位、仓位上限、下一批次和建议调整比例。
- **Risk Gates：** 显示投资逻辑、组合限制和数据质量是否触发否决。
- **Evidence Trail：** 让用户查看每项结论的来源、更新时间、计算过程和假设，而不是只看到 Agent 的一句判断。

Alert 只在状态或建议发生有意义的变化时发送，例如首次进入建仓区间、投资逻辑转为高风险、仓位突破限制或出现退出条件。用户点开 Alert 后，应直接进入对应标的的决策详情，而不是回到一个无关的首页。安静的日子不提醒，这是长期投资体验的一部分。

### 买入、持有和卖出如何决定

买入必须同时通过商业质量、投资逻辑、估值、安全边际、风险和仓位容量检查。即使满足条件，也采用分段式建仓，例如按目标仓位的 10% 或 15% 逐步执行；每次加仓前重新验证关键假设，避免把连续下跌机械理解为机会。

持有是一个正式的决策，不是系统没有答案。当价值与价格之间没有足够差距，或者现有仓位与预期回报相匹配时，最好的动作可以是什么都不做。

卖出需要区分三种原因：投资逻辑或公司经济性被破坏时退出；价格进入合理价值区间、未来回报下降时分批止盈；仓位过重或组合风险上升时减仓再平衡。单纯的价格下跌只触发复核，不自动止损；但如果下跌背后对应的是永久性价值损失或硬性风险条件，就要优先保护本金。

### 为什么这符合 Portfolio Watch assignment

这不是只为一组演示股票写死的看板。任何用户都可以用一句自然语言输入自己的行业、标的、持仓和风险规则，Skill 再把这些输入转成同一套研究、估值、风险和仓位决策合同。因此，它可以处理此前没有见过的组合。

Skill 定义方法论：监控哪些维度、什么是噪音、什么是有效信号、多角色如何交叉验证、多个信号如何排序，以及什么情况下可以买入、持有、减仓或退出。Alva 把这套方法变成可持续运行的产品：Automation 更新数据和状态，Playbook 提供决策 Dashboard，Alert 把真正重要的变化送到用户手机并链接回对应证据。

我希望最终减少的不是某一天的波动，而是三类长期错误：在认知以外下注、因为价格波动破坏投资纪律、在投资逻辑已经变化时仍然拒绝行动。这个 Skill 不承诺收益或命中率；它提供的是一套可追溯、可复核、能长期坚持的买卖决策方法。

---

## English Version

### The problem I want to solve is not tomorrow's price move

I am a value investor. I do not want a system to guess the next day's direction or produce a trade every morning to prove that it is useful. I need it to answer harder questions: Do I still understand this business? Has its long-term value changed? Does the current price offer a sufficient margin of safety? Is the expected return worth the risk already carried by my portfolio?

One belief defines the product: people cannot reliably make money outside what they understand. The Skill therefore starts with the user's circle of competence, preferred industries, selected securities, holdings, time horizon, and risk limits. Research and recommendations stay inside those boundaries. An unfamiliar business or an evidence-poor case should end in no action, not a forced opportunity.

Value investing does not mean buying once and refusing to sell. I want to build a position in stages when a strong business trades materially below intrinsic value. If the price keeps falling, the system must distinguish a wider margin of safety from a damaged thesis. When value is realized, expected return falls, the position grows too large, or the thesis breaks, I want a disciplined path to trim or exit.

The product is a long-horizon decision system: evidence can refresh every day, but action requires a meaningful change in the case.

### Core design: make independent roles challenge one another

A single Agent can anchor on its first conclusion. Once it becomes bullish, it may keep finding confirming evidence; after a price decline, it may mistake a cheaper quote for greater value. Inspired by TradingAgents, this Skill separates the work across roles. The design goes further than role-playing or majority voting: every role begins from the same timestamped evidence, forms an independent first view, and then has to address material conflicts directly.

The decision process has four layers:

1. **Independent research.** Business, Fundamental, Valuation, Industry/Cycle, and Thesis roles examine business quality, financial trends, value, industry structure, and thesis integrity. Their first reports are blind to the other roles' conclusions.
2. **Bull/Bear cross-examination.** Bull builds the strongest durable upside case. Bear tests for a value trap, fragile assumptions, and downside conditions. Each side must challenge specific claims with specific evidence.
3. **Independent risk review.** Thesis Risk tests for permanent impairment. Portfolio Risk checks concentration, limits, correlation, and liquidity. Position calculates the target weight, remaining capacity, and next tranche.
4. **Two-stage adjudication.** The Research Manager resolves evidence quality, duplicate sourcing, and research conflicts. The Portfolio Manager then applies the user's mandate, valuation discipline, risk gates, and portfolio capacity.

The system does not count votes. A confirmed thesis break or a hard portfolio breach can veto an addition. When a decision-critical disagreement remains unresolved, the output must fall back to Research, Hold, or Valuation Uncertain. It cannot manufacture a trade for the sake of closure. The purpose of multiple roles is to surface disconfirming evidence that one opinion would miss.

### Turning Alva data into a decision

Alva supplies continuously refreshed market and research inputs: price history, financial statements, earnings and cash flow, balance-sheet data, estimates, company events, news, industry evidence, and macro context. The Skill defines how those inputs should be judged; an Automation refreshes them and compares the current state with prior decisions.

Each security receives a shared evidence packet. Sourced facts, deterministic calculations, valuation assumptions, and Agent inference remain visibly separate. Decision-critical evidence carries a source, observation time, and relevant period. Valuation is expressed as Bear, Base, and Bull ranges instead of one falsely precise target price, with current price, margin of safety, major assumptions, and confidence shown alongside them.

A daily run does not mean a daily committee meeting:

- **No material change:** preserve the prior decision, show `NO_ACTION`, and send no repeated Alert.
- **A local evidence change:** refresh only the affected research roles and test whether the decision state should change.
- **A possible buy, trim, or exit:** run the full cross-examination, risk review, and Portfolio Manager adjudication.

Signals are not ranked by the day's largest price move. The order is: user mandate and circle of competence; evidence sufficiency and freshness; thesis integrity and hard risk gates; business quality and valuation; position capacity and tranche policy; unresolved conflicts; then expected return against risk and opportunity cost. This filters routine volatility and directs attention to evidence that can change long-term return or permanent-loss risk.

### The Playbook is the investor's decision Dashboard

When the user opens the Playbook, the first answer should be “What needs my attention today?” The interface should support that decision directly:

- **Decision Queue:** ranks securities that require review and explains why each one entered the queue.
- **Valuation Map:** shows current price, Bear/Base/Bull value ranges, margin of safety, and changed assumptions.
- **Thesis Monitor:** shows whether the thesis is intact, under pressure, or broken, with the evidence that changed.
- **Role Debate:** preserves the most important Bull, Bear, and specialist disagreements, including unresolved questions.
- **Position Plan:** shows current weight, target weight, position limit, next tranche, and proposed percentage change.
- **Risk Gates:** shows thesis, portfolio, and data-quality vetoes before any action.
- **Evidence Trail:** exposes sources, freshness, calculations, and assumptions behind the verdict instead of presenting an unsupported Agent opinion.

Alerts should fire only when the decision changes meaningfully: a security first enters an accumulation zone, thesis risk rises, a position breaches a limit, or an exit condition appears. Tapping the Alert should open the matching security and evidence, not a generic home screen. Silence on an unchanged day is a deliberate part of the product.

### How buy, hold, trim, and exit decisions work

A buy must pass business quality, thesis, valuation, margin-of-safety, risk, and portfolio-capacity gates. Even then, the position is built in stages, such as 10% or 15% of the planned allocation at a time. Every additional tranche requires a fresh check of the core assumptions, so repeated price declines never become automatic buy signals.

Hold is a first-class decision. When price and value offer no compelling gap, or the current position already matches its expected return, doing nothing can be the correct result.

Selling has three distinct causes. Exit when the thesis or business economics are impaired. Take profits in stages when price reaches the value range and future return compresses. Trim when position size or portfolio risk breaches policy. A lower price triggers review, not an automatic stop; if the decline confirms permanent impairment or a hard risk condition, capital protection takes priority.

### Why this answers the Portfolio Watch assignment

This is not a dashboard hard-coded for a demo watchlist. Any user can state their industries, tickers, holdings, and risk policy in natural language. The Skill converts those inputs into the same research, valuation, risk, and position decision contracts, so it can work on a portfolio it has never seen.

The Skill owns the methodology: what to monitor, what counts as noise, what qualifies as a meaningful signal, how independent roles cross-validate evidence, how simultaneous signals are prioritized, and when to buy, hold, trim, or exit. Alva turns the method into a continuous product: an Automation refreshes data and decision state, the Playbook provides the decision Dashboard, and Alerts deliver material changes to the user's phone with a direct path back to the supporting evidence.

The outcome I care about is fewer long-term mistakes: investing outside the user's understanding, abandoning discipline because of price volatility, and refusing to act after the thesis has changed. This Skill does not promise returns or perfect timing. It creates an auditable, repeatable process for making better-supported long-term portfolio decisions.
