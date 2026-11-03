《施工队 · 状态快照》
编号：P0-236　日期：2026-11-03　施工队窗口

═══ 改动清单（4 文件，方案甲=全量实时口径）═══
src/features/order/pages/OrderDetail.tsx：:327 应收卡片/:343 分解行两处显示改
  calcActualProfitByPolicy(order)（import 既有，零新增）；落库写入侧 :53 不动。
src/features/statistics/components/MonthDetailSections.tsx：+import；:52/:106 两展示位、
  :76 盈亏筛选、:77 绝对值排序——全部改实时重算；:16 注释、当月合计 reduce 聚合结构不动。
src/features/statistics/components/PlatformBreakdown.tsx：+import；:29 平台汇总累加改实时口径；
  PlatformStats 聚合结构（:13/:25/:36/:37/:49）非订单读侧，按书规不动。
src/constants/releaseNotes.ts：头部追加'利润显示改为实时重算口径'（现 13 条）。

═══ 验收实证 ═══
1. 读侧零残留：三文件订单读侧 grep 零命中（残留仅=写入侧 1 处+注释 1+聚合结构 5，全在书明留范围）；
2. 场景 2 脱敏假单实证：actualProfit 存值=20 的已完成单，实时重算=-130（与无存值单一致）——
   四处显示（订单详情×2/月明细×2/平台汇总）改后一律 -130；
3. 回归 19/19 ALL GREEN；build rc=0（tsc 0 错误+双 build-check 过）；
4. releaseNotes 13 条（本任务头部一条）。
