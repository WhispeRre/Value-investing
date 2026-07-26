# Value Investing Portfolio Decisions
## 中文版

### 我想解决的，不是“明天涨不涨”

我是一名价值投资者。我不需要系统每天猜单日涨跌，也不希望它为了显得有用而每天制造交易。我真正需要知道的是：这家公司是否仍在我的认知范围内，长期价值有没有改变，当前价格是否留下足够的安全边际，以及这份预期回报是否值得承担现有风险。

我相信“人没有办法赚到自己认知以外的钱”。所以 Skill 的第一步不是扫描全市场，而是让用户明确能力圈、偏好行业、自选标的、投资期限、持仓和风险边界。系统只能在这个范围里研究。无法解释的商业模式、超出能力圈的行业或证据不足的标的，应该得到“继续研究”或“不行动”，而不是被包装成机会。

价值投资也不是买入后永远不卖。低于长期价值时，我希望按目标仓位分批建仓；价格继续下跌时，先判断安全边际是否扩大，还是商业逻辑已经受损；当价值被重新定价、预期回报下降、仓位过重或逻辑被证伪时，纪律性地减仓或退出。

### 核心设计：让角色互相挑战，而不是重复同一个观点

我借鉴 TradingAgents 的角色拆分思路，但不把多个角色的结论简单投票。每个标的先生成一份带时间戳的共享证据包，角色在第一次判断时彼此隔离，再把最重要的冲突交给 Bull 和 Bear 进行对抗检查。

当前实现包含十类角色：Business、Fundamental、Valuation、Industry/Cycle、Thesis、Bull、Bear、Thesis Risk、Portfolio Risk 和 Position。它们分别检查商业质量、盈利与现金流、估值、行业周期、投资逻辑、上行与下行情景、永久性损伤、组合边界和分批仓位。

线上 Playbook 当前使用 `INDEPENDENT_RULE_BASED_PASSES`：每个角色都基于同一批真实 Alva Arrays 数据执行独立、可解释的规则计算；角色分数不是市场事实，雷达图的置信度也不是收益概率。这个实现保留了交叉验证的结构，同时诚实标注了当前 Alva 运行环境尚未接入开放式 LLM Agent 提供方的边界。

### Alva 数据如何变成决策

价格、公司资料、市值、P/E、EPS 一致预期、ROIC、营收和 EPS 增长、利润率、杠杆、流动性、行业 ETF 回报以及财报日期由 Alva Arrays 提供。每个标的的事实、计算值、政策假设、缺失证据和角色报告分开保存，Playbook 的四个 Tab 读取同一批 Automation 输出。

估值使用未来四季度 EPS 中位数共识；覆盖不足时回退到下一财年，再不足时回退 `EPS_TTM`，并相应降低置信度。Bear/Base/Bull 估值倍数是投资政策假设，不是市场直接给出的内在价值。最终置信度由数据覆盖、新鲜度、最弱关键角色和角色一致度加权，并受估值方法、最弱角色和组合数据缺失上限约束。

### Playbook Dashboard

当前公开 Playbook `Mag 7 Value Decisions` 用四个 Tab 把结论压缩成可扫描的图表界面：

- **今日的决策**：估值位置散点图、财报时间散点图和 Bear/Base/Bull 区间图。
- **估值区间**：当前价格、三种估值情景和买入、减仓、退出复核线。
- **逻辑风险的判断**：证据置信度雷达、角色立场条形图、为什么今天是这个动作、决定性与相反证据、Bull/Bear、冲突、缺口和逐角色证据账本。
- **你遵循的方法**：能力圈、共享证据、角色检查、安全边际、四批仓位和低频行动。

这套 Dashboard 服务的是“今天是否需要处理”，而不是“今天必须交易”。Core Circle 默认单标的模型上限 10%、目标 8%、分 4 批；Learning Circle 只做 `RESEARCH_ONLY`。因为当前没有连接真实账户，仓位是模型容量，不是个人下单金额。

### 买入、持有和卖出

买入必须同时通过商业质量、投资逻辑、估值、安全边际、风险和模型容量检查，并按 10% 或 15% 的计划比例分批验证。持有是正式结论：当价格与价值没有足够差距，或现有仓位已经匹配预期回报时，不行动可能是最合理的决定。

卖出分为三类：逻辑或公司经济性永久受损时退出；价格进入合理价值区间、未来回报压缩时分批止盈；仓位过重或组合风险升高时减仓。单纯下跌只触发复核，不自动止损；如果下跌确认了永久性价值损失或硬风险条件，保护本金优先。

### 为什么适合 Portfolio Watch assignment

Skill 定义方法：只研究用户确认的范围，如何构建共享证据，如何让角色交叉验证，如何识别风险，如何计算分批仓位，以及何时买入、持有、减仓或退出。Alva 把方法运行成 Automation 和 Playbook，让用户每天看到同一套证据、角色分歧和决策边界。

我希望减少的不是某一天的波动，而是三种长期错误：在认知以外下注，把价格下跌机械地当成便宜，以及在投资逻辑已经变化后仍然拒绝行动。这个产品不承诺收益或正确率；它提供的是一套可追溯、可复核、能长期坚持的决策过程。

## English Version

### The problem is not tomorrow's price move

I am a value investor. I do not need a system to guess the next day's direction or manufacture a trade every morning. I need to know whether I still understand the business, whether its long-term value has changed, whether the price offers enough margin of safety, and whether the expected return justifies the risk already carried by the portfolio.

I believe people cannot reliably make money outside what they understand. The Skill therefore starts with a confirmed circle of competence, preferred industries, selected securities, holdings, time horizon, and risk limits. It researches only inside that scope. An unfamiliar business or evidence-poor case should end in research or no action, not a forced opportunity.

Value investing does not mean buying once and refusing to sell. I want to build a position in stages when price is materially below long-term value. If price keeps falling, the system must distinguish a wider margin of safety from a damaged thesis. When value is recognized, expected return compresses, the position becomes too large, or the thesis breaks, I want a disciplined path to trim or exit.

### Core design: independent roles that challenge one another

The design borrows TradingAgents' role separation without reducing the process to a vote. Each security first receives one timestamped evidence packet. Roles form their first views independently, then Bull and Bear examine the most important opposing claims from that same packet.

The current implementation has ten roles: Business, Fundamental, Valuation, Industry/Cycle, Thesis, Bull, Bear, Thesis Risk, Portfolio Risk, and Position. They examine business quality, earnings and cash flow, valuation, industry conditions, thesis integrity, upside and downside cases, permanent impairment, portfolio limits, and staged capacity.

The live Playbook runs `INDEPENDENT_RULE_BASED_PASSES`. Each role applies a transparent rule calculation to real Alva Arrays inputs. Role scores are analysis, not market facts; the radar measures evidence confidence, not probability of profit. This preserves the cross-validation structure while making clear that the current Alva runtime is not an open-ended LLM Agent debate.

### Turning Alva data into decisions

Alva Arrays supplies price, company identity, market cap, P/E, EPS consensus, ROIC, growth, margins, leverage, liquidity, sector ETF performance, and earnings dates. Facts, calculations, policy assumptions, missing evidence, and role reports are stored separately. All four Playbook tabs read the same Automation batch.

Valuation uses the next four quarterly EPS consensus medians, falling back to the next annual estimate and then `EPS_TTM` when coverage is insufficient. Bear, Base, and Bull multiples are policy assumptions, not sourced intrinsic values. Final confidence combines coverage, freshness, the weakest critical role, and role agreement, then applies caps for estimate method, weakest role, and missing portfolio data.

### The Playbook Dashboard

The public `Mag 7 Value Decisions` Playbook is organized around “what needs attention today,” not “what must be traded today”:

- **Today's Decision**: valuation-position scatter, earnings-event scatter, and Bear/Base/Bull range chart.
- **Valuation Range**: current price, three scenarios, and buy, trim, and exit review lines.
- **Logic Risk**: evidence-confidence radar, positive/negative role stance bars, action rationale, decisive and contrary evidence, Bull/Bear cases, conflicts, evidence gaps, and an expandable role ledger.
- **Method**: circle of competence, shared evidence, role checks, margin of safety, four tranches, and low-frequency action.

Core Circle has a 10% model position cap, an 8% default target, and four tranches. Learning Circle symbols are `RESEARCH_ONLY`. Because no brokerage holdings are connected, these are model capacities rather than personal order sizes.

### Buy, hold, trim, and exit

An addition must pass business quality, thesis, valuation, margin-of-safety, risk, and model-capacity gates, then be built in stages such as 10% or 15% of the planned allocation. Hold is a first-class decision when price and value offer no compelling gap or the existing weight already matches expected return.

Selling has three causes: exit after permanent thesis or business impairment; take profits in stages when price reaches the value range and future return compresses; and trim when position or portfolio risk becomes too high. A lower price triggers review, not an automatic stop. If it confirms permanent loss of value or a hard risk condition, capital protection comes first.

### Why this answers the Portfolio Watch assignment

The Skill owns the method: stay inside the user's scope, build a shared evidence packet, cross-validate with independent roles, expose risk, size positions in stages, and define when to buy, hold, trim, or exit. Alva runs that method as an Automation and a Playbook so the user sees the same evidence, disagreement, and decision boundary each day.

The goal is fewer long-term mistakes: investing outside one's understanding, treating every price decline as cheapness, and refusing to act after the thesis changes. This product does not promise returns or perfect accuracy. It provides an auditable, repeatable process for long-term portfolio decisions.
