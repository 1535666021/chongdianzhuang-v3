《施工队 · 任务书》

编号：P0-238　签发：监理窗口　日期：2026-11-04　状态：待施工
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。本单为大单，交付前逐节自查，禁漏项。

═══ 背景（甲方令 2026-11-04 原意）═══
"全局全量，把每个核算细节公式结果都找出来……客服应付价没问题，就是核算有问题，是成本——赚了多少赔了多少……必须全面，每个细节找清楚核对清楚，逐个核对，每个弹窗包括成本明细，全部核算清楚，查找问题然后解决问题。"甲方三点裁定：**bug 直接修**（口径歧义除外）／**一本大书不拆，一点不能漏**／**存量落库值错→批量对齐修正器**。

═══ 范围（四大块，一块不能少）═══
A. **orderCalc 全导出**：src/shared/utils/orderCalc.ts 全部 37 个导出，逐个列出：公式→输入字段→输出→全部消费点（grep 实证）→与 RULES.md 对应口径条款对拍（R-1.x 费项/R-2.x 利润/R-3 出差/R-5 材料/R-10 库存），凡公式与口径条款不符=问题。
B. **成本链**：calcFullMaterialCost 逐项（电缆/PVC/漏保盒/漏保器矩阵/增项）× findCostPrice 成本绑定（未绑定橙警）× 库存出入库（adjustStock：完工扣减/手动领用/缺口 shortfall/批次幂等/名称归一）× 三消费链（勘测预估/完工核算/工资估算）全对拍。
C. **利润链+写入侧**：calcReconciliationProfit/calcActualProfitByPolicy/calcTripSubsidy/扣点/安装费/漏保矩阵各出口 + useCompletion.ts 落库组（serviceFee/platformFee/reconciliationProfit/actualProfit/materialCost/laborCost/tripSubsidy，:136/:353）+ 出差单 platformFee 归 0 链 + OrderComplete/OrderForm 预估链——写入值与实时口径一致性逐字段核。
D. **弹窗与展示全量**：完工弹窗 ProfitPreview 每行 BreakdownLine、成本明细 CostDetail（含 :136 公式行）、统计页三格/按天明细/月报、PlatformBreakdown、日结 useDailyBreakdown、finance 页——每个字段标注"数据源→公式链路→显示值"，展示与出口不一致=问题。R1 补改（useDailyBreakdown:30）若在途已合入以合入后为准。

═══ 方法（手工账本对拍，结果级）═══
1. 造 8 个脱敏场景假单（全走 RULES 口径）：①不出差奇瑞30米基线 ②出差单（补助30+扣点0） ③增项单（客户付费含增项） ④超米单 ⑤五菱3.5kW（漏保C25矩阵） ⑥免配品牌+漏保盒必含 ⑦未绑定成本材料（橙警路径） ⑧补桩发货单；每场景**人工先算全量期望账本**（每个数字手写推导），再跑程序输出对拍，逐项列"期望 vs 实际 vs 判定"。
2. 全库 grep 实证每个导出消费点（禁凭印象）；弹窗字段链路逐字段落表。
3. 修复纪律：代码 bug **直接修**（最小改动、只增不改、既有风格照抄）；**口径歧义**（算法与 RULES 条款理解有争议）写入 delivery"待裁清单"上报监理转甲方，禁自裁；禁顺手改范围外任何东西。
4. **存量批量对齐**：发现落库存值与新口径不一致的字段→做/扩修正器（走 RULES §9 口径：plan/run 分离+执行前 localStorage 备份+幂等+留痕 lastProfitAuditAt 同类机制，挂 App.tsx runStartupMaintenance phase，try/catch+禁首屏前同步）；存量对齐范围只限本单发现的问题字段，禁扩大。

═══ 验收（核验窗逐条验，漏项=退件）═══
1. A 块：37 导出矩阵表（公式/输入/输出/消费点数/口径条款号/判定），一个不缺；
2. B+C 块：8 场景手工账本对拍表全绿（每项期望=实际）；写入侧 7 字段逐字段一致性实证；
3. D 块：弹窗/展示字段链路表全覆盖（字段数=实际渲染字段数，grep 渲染实证）；
4. 修正器：plan 输出/备份实证/幂等实证（二次运行零变更）/回滚路径；
5. 口径歧义待裁清单（如有）单列；
6. npm run build tsc 0 错；回归 20/20（若 P0-237 未合入按 19/19，书中注明）；
7. delivery.md 末尾自查实证清单（每验收一项一行证据），虚报一处全单退件；
8. releaseNotes 头追加一条。

═══ 交付 ═══
一单一次提交（message 含 P0-238）+ specs/261104-P0-238/delivery.md，会话只报一行指针。
基线 HEAD：以开工时 main 为准（P0-236-R1/P0-237 可能先合入；diff 面=A-D 块实际改动文件，与本书范围不符=打回）。数据红线：真实订单禁入仓库，场景一律脱敏。
