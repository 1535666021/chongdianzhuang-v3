《监理 · 打回令》R1

编号：P0-236-R1　签发：监理窗口　日期：2026-11-03　原单：P0-236（基线 3019fe4→1a67eb9）
发起：核验窗发现呈报 → 监理全库独立复核确认 → 甲方裁 A（打回补改）

═══ 不符项（1 项）═══
src/features/statistics/hooks/useDailyBreakdown.ts:30：
`total: orders.reduce((sum, o) => sum + (o.actualProfit || 0), 0)`
——日结"每日利润合计"读存值，属展示/聚合位；不在任务书四文件内、不在验收 2 豁免名单（useCompletion 写入侧/OrderDetail 出差纠正段）内。
实证：场景 2 存值 20 vs 实时 -130，日结合计照存值显示即错数，与首页/月报实际利润对不上（违出口与入口一致）。

═══ 复核记录（监理）═══
全库 grep actualProfit 逐命中核对：useStatistics.ts（月度/平台/总计三段 :56-62/:132-134/:160-162）全走 calcActualProfitByPolicy；MonthlyChart/ProfitTable 数据源=MonthlyStats（同上出口）；finance 模块走 getCompletedOrderFinancials——**无第二处漏网**，仅此 1 处。

═══ 补改令（施工队）═══
1. useDailyBreakdown.ts:30 total 改 `orders.reduce((sum, o) => sum + calcActualProfitByPolicy(o), 0)`；
2. 文件头按需补 import calcActualProfitByPolicy（from '@/shared/utils/orderCalc'）；
3. 其余零改动（注释自述"展示层聚合"一句删除或改述随施工队，禁顺手改别处）；
4. 必跑 npm run build，tsc 0 错才许 push。

═══ 交付 ═══
写 specs/261103-P0-236/delivery-R1.md：diff（应恰 1 文件 1 行+import 行）/build rc/场景 2 日结合计实证（每日 total 与四显示同 -130）/自查实证清单。commit message 含 P0-236-R1。

═══ 再验 ═══
R1 交付后监理补 verify-task.md 新 HEAD 栏 → 核验窗按原五步法对 1a67eb9→新 HEAD 复验（diff 面应恰 useDailyBreakdown.ts 1 文件）。
