《施工队 · 状态快照》
编号：P0-236 复验打回 R1　日期：2026-11-03　施工队窗口

═══ 改动清单（单文件，恰 3 处）═══
src/features/statistics/hooks/useDailyBreakdown.ts：
① +import calcActualProfitByPolicy（并入既有 orderCalc import 行）；
② 合计行 orders.reduce((sum,o)=>sum+(o.actualProfit||0),0)
   → orders.reduce((sum,o)=>sum+calcActualProfitByPolicy(o),0)；
③ DayGroup.total 注释改述（"P0-236-R1：Σ calcActualProfitByPolicy 实时口径"，
   原"读既有字段不算重复计算"自述作废）。
其他文件零触碰（监理全库复核已确认无第二处漏网）。

═══ 验收实证 ═══
场景 2：actualProfit 存值=20 已完成单——改前日结合计=20（错数），改后=-130，
与四处显示/筛选/排序/汇总（订单详情×2/月明细×2/平台汇总）全口径一致 ✓；
回归：19/19 ALL GREEN；build：rc=0（tsc 0 错误+双 build-check 过）。
