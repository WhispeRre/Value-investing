# Mag 7 Value Decisions

这个 Playbook 服务于低频、长期的价值投资决策。它只跟踪 Mag 7 的七家公司，并把 TSM、AVGO、AMD 放在 Learning Circle 中研究。页面每天更新证据，但不要求每天交易；只有价格进入估值区间、投资逻辑出现变化或风险闸门被触发，才把标的送入买入、减仓或退出复核。目标权重和分批信息是观察清单模型，不是个人交易金额，也不会自动下单。

## Four decision views

- **今日的决策**：用估值折价散点图、财报时间散点图和 Bear–Bull 区间图呈现 Core Circle 的买入、持有、减仓和退出复核；Learning Circle 使用空心标记，不给直接买入动作。
- **估值区间**：按标的用折线比较当前价格与 Bear / Base / Bull 情景，并用条形图显示价格距离买入、减仓和退出复核线的百分比。
- **逻辑风险的判断**：用雷达图展示商业模式、基本面、估值、行业周期、投资逻辑以及 Core Circle 的 Bull / Bear 角色置信度；文字只保留对抗结论和证据缺口，详细证据默认收起。
- **你遵循的方法**：把能力圈、共享证据、独立角色检查、安全边际、分批仓位和低频行动压缩成一条决策流程。

## Data sources & freshness

底层 Automation `mag7-value-decisions` 在工作日每天 13:00 UTC 刷新。每次运行读取 Alva Arrays 的公司资料、美国股票 1 小时 RTH 价格、市场指标（市值、P/E、1 年价格变化）、年度 EPS 共识预期和未来财报日期。页面在浏览器中直接读取最新一次 Automation 结果；刷新时间显示在“今日的决策”和“估值区间”中。EPS 取未来年度中分析师覆盖数最高的共识行；没有可用年度预期时回退到 EPS_TTM。

## How this playbook works

每家公司先进入同一个带时间戳的证据包，再经过 Business、Fundamental、Valuation、Industry/Cycle 和 Thesis 的规则化独立检查。Core Circle 额外生成 Bull 与 Bear 情景，用来暴露上行假设、下行风险和证据缺口。估值使用下一年度 EPS 乘以业务模型对应的 Bear / Base / Bull 政策倍数。买入上限是 Base 值乘以 75%；减仓复核从 Bull 值的 90% 开始；退出复核从 Bull 值的 105% 开始。动作只对 Core Circle 生效，Learning Circle 固定为 `RESEARCH_ONLY`。

当前模式是 `INDEPENDENT_RULE_BASED_PASSES`：多个角色在同一证据包上独立运行，并输出可核对的判断。它还不是开放式多 Agent 辩论，也没有 Research Manager 或 Portfolio Manager 让角色互相质询后自行改写结论。页面会明确显示这条边界；高重要性冲突应阻止加仓并进入人工复核。

## Position sizing

Core Circle 的模型目标仓位上限为单家公司 10%，默认目标为 8%，拆成 4 批。由于没有连接个人账户，当前仓位按观察清单处理为 0，不能推导个人下单金额。每一批加仓都要求重新通过论点和风险检查。价格触发只是复核入口，不是自动成交指令。

## Blind spots

- 估值倍数是策略假设，不是市场事实；Playbook 不提供单点内在价值。
- EPS 共识可能滞后、覆盖数量有限，也不等于公司的真实结果。
- 价格信号使用 RTH 1 小时数据，无法代表盘前或盘后价格。
- 未连接个人持仓、现金、成本、税务、流动性或相关性数据，因此仓位只表示模型上限。
- 角色判断来自确定性规则检查，不等同于具备独立信息搜索和开放式质询能力的完整多 Agent 委员会。
- 不包含完整现金流 DCF、管理层访谈、供应链实地验证或事件风险的人工复核。
- Learning Circle 的半导体公司只用于研究，不会生成直接买入建议。

## Legal disclaimer

这是基于公开数据和明确规则的研究工具，不构成个性化投资建议，也不保证收益。任何交易决定都应结合你的实际持仓、税务、流动性和风险承受能力，并由你本人确认。
