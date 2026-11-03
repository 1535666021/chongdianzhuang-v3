《施工队 · 任务书》

编号：P0-235　日期：2026-11-03　监理窗口签发

开工前必读：.monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，环境上下文统一读 .monkeycode/CONTEXT.md（不重复抄写）。

═══ 基线 ═══
代码 HEAD=a6a7c49，P0-234 已销号，在途无前置）。
监理已盘点盘面（实证于 a6a7c49，可直接引用）：
- 公式唯一入口 src/shared/utils/orderCalc.ts，37 个导出（套餐/超米费/增项/平台费/服务费/材料成本/勘测合计/工资估算/空开成本/对账利润/政策利润/业务日期等）。
- orderCalc 消费方 12 处：MaterialPicker、OrderCard、SurveyModal、SurveyProfitPreview、OrderComplete、OrderDetail、ProfitAuditTool、SalaryCalculator、ProfitDetailModal、Statistics、CostItemsTable 等。
- 已知旁路风险点：Statistics.tsx:50 自建 reduce 汇总（不经过 orderCalc）；exportExcel.ts 独立导出链；SalaryCalculator/ProfitAuditTool/PolicyFixTool 各带金额逻辑。

═══ 需求 ═══
甲方裁定唯一准则：**所有数据必须对得上，出口与入口必须一致**。现况是多处置数不一致，本单全量体检+修到全对。真相源唯一=orderCalc.ts（架构铁律：计算唯一入口，禁止另起旁路公式）。

═══ 改动清单 ═══
1. **全量对拍**（先查）：逐个指标建"指标×展示位"矩阵，覆盖全部金额/数值出口——订单卡片、详情页、完成页、利润预览弹窗（ProfitPreview/SurveyProfitPreview）、勘测报告弹窗（SurveyReportModal）、统计页（Statistics.tsx 含其自建 reduce）、利润明细弹窗（ProfitDetailModal）、Excel 导出（exportExcel.ts）、工资估算（SalaryCalculator）、利润审计/政策工具（ProfitAuditTool/PolicyFixTool）、预约/批量预约弹窗内出现的数值。每格写明取值来源函数+当前是否与其他格一致。
2. **修到一致**（后修）：凡矩阵中不一致的格，统一改走 orderCalc 对应函数取值；旁路计算（Statistics 自建 reduce、导出链自算）改调 orderCalc，禁止复制公式。修复逐条记录：文件:行、原取值逻辑、改后取值、依据。
3. **口径歧义不自裁**：若 orderCalc 内部同一指标存在两种算法（业务口径级歧义，如"扣点后收入"定义），不得私自裁定——列入"待甲方裁定"清单附 delivery.md，该处保持原样。
4. **数值出口含弹窗**：带数值的弹窗逐个开查，弹窗内数字必须与源订单经 orderCalc 计算值一致。

═══ 验收 ═══
1. 对拍矩阵落 delivery.md：每个指标一行，全部展示位标注 一致/已修复，无"不一致"残留。
2. 构造 ≥3 个脱敏假数据订单（普通单/含增项单/差旅单各一），给出全链数值快照：入口原始值 → 各出口展示值，逐一相等。
3. 修复清单逐条可溯（文件:行+前后逻辑）；口径歧义清单单列。
4. grep 实证：金额类展示位无旁路 toFixed/自算（一切计算调用 orderCalc）。
5. tsc 0 错误 + npm run build 过 + 回归 19/19。
6. 数据红线：全程脱敏假数据，真实订单/客户数据禁入仓库禁经手。

═══ 交付 ═══
push 后写 .monkeycode/specs/261103-P0-235/delivery.md（状态快照格式，含矩阵+快照+修复清单+歧义清单），会话只报一行指针。
