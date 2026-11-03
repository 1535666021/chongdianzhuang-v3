《施工队 · 任务书》

编号：P0-236　日期：2026-11-03　监理窗口签发

开工前必读：.monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，环境上下文统一读 .monkeycode/CONTEXT.md（不重复抄写）。

═══ 基线 ═══
代码 HEAD=3019fe4（P0-235 销号，在途无前置）。
甲方裁定（P0-235 遗留项）：实际利润展示源统一，**裁方案甲——全部展示位统一走实时 calcActualProfitByPolicy**，与卡片/统计/利润明细同源。
实证锚点（已逐字核对，src 自 a6a7c49 起零改动）：
- OrderDetail.tsx:1 已 import calcActualProfitByPolicy；:327 头部 `{formatCurrency(order.actualProfit || 0)}`；:343 "= 实际利润"行同式。
- MonthDetailSections.tsx:52/:106 逐单利润显示 `{fmt(o.actualProfit || 0)}`；:76 盈亏筛选 `(o.actualProfit || 0) > 0/< 0`；:77 榜排序 `Math.abs(b.actualProfit || 0)`。未 import orderCalc。
- PlatformBreakdown.tsx:29 聚合 `s.actualProfit += o.actualProfit || 0`。未 import orderCalc。

═══ 需求 ═══
"实际利润"唯一展示源=orderCalc 的 calcActualProfitByPolicy（实时，入参=订单存值字段，与 P0-177-A 卡片口径一致）。全部展示/筛选/排序/聚合位改走该函数，消灭存值快照分叉（历史单旧算法快照是"数据对不上"的根源）。

═══ 改动清单 ═══
1. OrderDetail.tsx：:327 与 :343 两处 `order.actualProfit` 改 `calcActualProfitByPolicy(order)`（import 已有）。头部值必须等于下方明细行（客户应收/扣点/安装费/补助/材料/工资）逐项加减结果——该函数入参即这些存值字段，天然相等；:343 注释由"禁自算"改为"P0-236：统一实时口径"。
2. MonthDetailSections.tsx：add import；:52/:106 显示、:76 筛选、:77 排序的 `o.actualProfit` 全部改 `calcActualProfitByPolicy(o)`（筛选/排序也走同一函数，禁混用存值）。
3. PlatformBreakdown.tsx：add import；:29 聚合改 `s.actualProfit += calcActualProfitByPolicy(o)`。
4. 不动：order.actualProfit 存值字段本身（完工写入/出差纠正/备份链保留原样，仅展示不再读它）；卡片 OrderCard:56、Statistics.tsx:59、ProfitDetailModal 已走实时，零改动。
5. releaseNotes.ts 头部追加一条 '实际利润全站统一实时口径，各页数字一致'（共 13 条，旧 12 条逐字不动）。

═══ 验收 ═══
1. grep 实证：除 useCompletion/OrderDetail 纠正段（写入侧）外，src 内所有读 `order.actualProfit`/`o.actualProfit` 做**显示/筛选/排序/聚合**的位置均为零残留（写入侧三处允许保留）。
2. 历史单场景：构造一笔"存值 actualProfit=20 但字段重算=-130"的脱敏假单，验证详情页/按天明细/盈亏榜/平台分布四处全部显示 -130 且筛选排序按 -130 行为。
3. 明细行加总=头部数字（详情页展开）。
4. tsc 0 错误 + npm run build 过 + 回归 19/19。
5. diff 范围限：OrderDetail.tsx、MonthDetailSections.tsx、PlatformBreakdown.tsx、releaseNotes.ts 四个文件；回归样本零差异。

═══ 交付 ═══
push 后写 .monkeycode/specs/261103-P0-236/delivery.md（状态快照格式），会话只报一行指针。
