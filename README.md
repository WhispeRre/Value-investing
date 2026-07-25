# Value Investing Portfolio Decisions - Multi-Agent Version

本文件夹汇总了 multi-agent 版本的完整提交产物：投资决策 Skill、双语 One Pager、Alva Automation 与 Playbook 源码，以及验证材料。

与基础 submission 版本相比，本版本增加了独立 Specialist 研究、Bull/Bear 交叉质询、Research Manager 研究裁决、独立风险复核和 Portfolio Manager 最终决策。系统不按角色投票，而是通过共享证据、冲突记录、风险否决和置信度上限形成可追溯结论。

## 目录

- `skill/`：可安装的 `value-investing-portfolio-decisions` Skill 及其 ZIP 包。
- `one-pager/`：中文与英文独立成篇的多 Agent 设计说明。
- `playbook/`：Mag 7 示例 Automation 脚本、Playbook HTML 和使用说明。
- `validation/`：Skill 测试提示与本地验证记录。

## 产品边界

当前 Playbook 使用 AAPL、MSFT、AMZN、NVDA、GOOGL、META 和 TSLA 作为 Core Circle 示例观察名单，并将 TSM、AVGO 和 AMD 作为 Learning Circle 研究对象。账户未连接真实券商持仓，因此页面中的仓位只代表模型目标，不是实际持仓、个性化订单金额或自动交易指令。

这套方法可以每天更新证据，但只在状态或建议动作发生实质变化时提醒。多 Agent 讨论用于暴露反证和关键分歧，不代表结论一定正确，也不替代用户对投资范围、风险规则和最终交易的确认。
