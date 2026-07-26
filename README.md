# Value Investing Portfolio Decisions

这是针对 Portfolio Watch assignment 的完整实现目录：一个受用户能力圈约束的长期价值投资决策 Skill，以及基于 Alva 数据运行的公开 Playbook Dashboard。

它不试图预测明天涨跌，也不要求用户每天交易。它每天刷新证据，只有估值、安全边际、投资逻辑、风险或模型仓位发生足以改变判断的变化时，才进入买入、持有、减仓或退出复核。

## 当前产物

- `skill/`：`value-investing-portfolio-decisions` Skill。定义能力圈、证据包、多角色交叉验证、Bull/Bear、风险闸门、分批仓位和决策状态；Alva 平台生命周期由 Alva Skill 负责。
- `one-pager/`：独立的中文和英文 One Pager，分别说明 Alva 产品思考、Skill 设计和价值投资作用。
- `playbook/`：Automation 脚本、Playbook HTML 和数据说明。
- `validation/`：Skill 测试提示和验证记录。

## 线上 Playbook

当前公开版本：`v1.3.5`
链接：[Mag 7 Value Decisions](https://alva.ai/u/1148973244/playbooks/mag7-value-investing)
四个 Tab 都读取同一批 Automation 输出：

1. **今日的决策**：估值位置、财报事件和 Bear/Base/Bull 区间图。
2. **估值区间**：当前价格与三种估值情景，以及买入、减仓、退出复核线。
3. **逻辑风险的判断**：角色证据置信度雷达、正负立场图、Bull/Bear 依据、冲突、证据缺口和逐角色证据账本。
4. **你遵循的方法**：能力圈、共享证据、角色检查、安全边际、分批仓位和低频行动。

## 数据与角色实现

当前示例观察范围是 Core Circle 的 AAPL、MSFT、GOOGL、AMZN、NVDA、META、TSLA，以及只用于研究的 Learning Circle：TSM、AVGO、AMD。价格、公司资料、市值、P/E、EPS 一致预期、财务指标、行业 ETF 回报和财报日期来自 Alva Arrays。

每个标的先形成同一时间批次的证据包，再执行 Business、Fundamental、Valuation、Industry/Cycle、Thesis、Bull、Bear、Thesis Risk、Portfolio Risk 和 Position 角色。当前线上模式是 `INDEPENDENT_RULE_BASED_PASSES`：角色分数是基于真实 Arrays 输入的透明规则推导，不是随机数，也不冒充开放式 LLM 辩论。角色立场分数和证据置信度分开显示；置信度表示证据质量，不是盈利概率。

估值区间使用未来四季度 EPS 中位数共识，必要时降级到下一财年或 `EPS_TTM`，再乘以业务模型的 Bear/Base/Bull 政策倍数。Core Circle 默认单标的模型上限为 10%、目标 8%、分 4 批；没有连接真实持仓、现金、成本、税务和相关性，因此页面只显示模型容量，不生成个人下单金额。

## 重要边界

- 规则角色检查不是具备独立信息搜索和开放式辩论能力的完整 LLM 多 Agent 委员会；实现边界在 Playbook 第三个 Tab 中公开展示。
- 行业角色以行业 ETF 相对回报作为周期代理，不替代同行经营数据、产业链研究或管理层访谈。
- 价格进入买入线只触发复核，不自动成交；价格下跌也不会单独构成止损理由。
- Learning Circle 只输出 `RESEARCH_ONLY`，不会生成直接买入动作。
- 这是研究和决策支持工具，不构成个性化投资建议，不保证收益或决策正确率。
