《施工队 · 状态快照》
编号：P0-239　日期：2026-11-05　施工队窗口

═══ 甲方裁定执行（最高优先）═══
出不出差唯一判断=订单胶囊字段（order.isBusinessTrip===true）；false/undefined 一律
不出差；日期窗（POLICY_FIX_TRIP_START/END）与扣点启发式（absPlatformFee===0）
两条兜底全废。理由（甲方口径）：判定唯一化才能根除幽灵单。

═══ 改动清单（9 文件：7 改+2 新）═══
1. src/shared/utils/orderCalc.ts：
   a. isBusinessTripOrder 唯一化（L406-411）——签名收窄 {isBusinessTrip?: boolean}，
      函数体 return order.isBusinessTrip === true；日期窗+启发式删除；
   b. calcReconciliationProfit（L493-499）——补助改 calcTripSubsidy(order.isBusinessTrip
      === true) 实时判定；出差分支同改；order.tripSubsidy 存值直吃废止；
   c. calcActualProfitByPolicy（L510-520）——补助项实时同口径；tripSubsidy 存值
      参数保留签名（写入侧留痕不断链）但出口不再消费；入参类型补 isBusinessTrip?: boolean；
   d. getCompletedOrderFinancials（L133）——OrderFinancialSource 无胶囊字段=非出差，
      删 isBusinessTripOrder(order) 死调用（旧窗口启发式在此的残留），platformFee
      存值直取；
   e. calcFullMaterialCost 漏保兜底落空→unmatched.push 橙警（P0-238 待裁#1 并入）。
2. src/features/order/hooks/useCompletion.ts（L326-327）——profit memo 补助行改实时：
   calcTripSubsidy(order.isBusinessTrip === true)，不再存值优先（幽灵 30 根因②修复）。
3. src/features/finance/components/CostDetail.tsx——实际利润公式行补 tripSubsidy(补助)/
   laborCost(工资) 条件展示项（有值才显示），四则展示闭合（P0-238 待裁#2 并入）。
4. src/features/finance/types/finance.ts——OrderCostDetail 补 tripSubsidy?/laborCost?。
5. src/features/finance/hooks/useFinance.ts——getCostBreakdown 透传 o.tripSubsidy/
   o.laborCost（数值口径本就对，仅展示层补齐）。
6. src/shared/dataFix/tripSubsidyGhostFix.ts（新）——幽灵补助存量修正器（RULES §9：
   plan/run 分离+执行前备份+幂等+留痕 cdz_ghost_trip_p0239_run_at）；platformFee
   只列核对报告不动手（不出差单应=付费×10%，付费 0 单=0）。
7. src/features/settings/components/GhostTripFixTool.tsx（新）+ SettingsPage.tsx 注册
   （type union 'ghostTrip'+菜单项+renderSection case）——plan 预览清单→run 确认执行。
8. src/constants/releaseNotes.ts——头追加『出差判定改为唯一看胶囊开关，未点开关
   不再发补助』。

═══ 实证纠偏（与任务书锚点差异，以实码为准）═══
任务书第 4 点称"纠正为不出差入口只改 isBusinessTrip 开关未清 tripSubsidy 存值"——
实码 OrderDetail.correctTripMisjudge（约 L44-57）已连带 {isBusinessTrip:false,
tripSubsidy:0}+按新扣点重算 actualProfit，与任务书目标一致，未改动（delivery 注明
锚点过时）。胶囊 onTripToggle 连带两字段（L38-42）已是同通道，符合任务书要求。

═══ 验收实证 ═══
1. 新账本场景（验收书指定）：付费 0 + 未点胶囊单——isTrip=false、补助 0、
   actualProfit=−272、reconciliationProfit=300（旧代码会 +30 幽灵补助）✔；
2. 显式出差单仍 +30（对照）：actualProfit=−242、对账 330 ✔；
3. 幽灵存值单根治：tripSubsidy=30 存值 + 未点胶囊 → 补助 0、利润 −272 ✔
   （P0-238 账本 S4 超米单回归仍绿：actualProfit=52、对账 232.5 ✔）；
4. 日期窗废除实证：09-15 无开关 legacy 单 isTrip=false（旧码=true）✔；
   启发式废除实证：窗口外扣点 0 单 isTrip=false ✔；
5. P0-239 专项账本 6 断言 FAILS=0；
6. 回归 20/20 ALL GREEN；npm run build rc=0 + [BUILD CHECK] 后置检查通过 + tsc 零错误；
7. 修正器幂等：runGhostTripFix 重跑即空（归 0 后不再命中范围条件）✔。

═══ 增量纯净声明 ═══
diff 面=上列 7 改+2 新=9 文件；临时账本/runner 脚本已删除不入库；
getCompletedOrderFinancials 的改动=删死调用（原调用在窗口启发式下对无胶囊字段
的 OrderFinancialSource 永远走启发式分支=误判温床，P0-239 下语义恒 false，
删后语义等价且类型干净）。

═══ 更新说明 ═══
出差判定改为唯一看胶囊开关，未点开关不再发补助

═══ 自查实证清单 ═══
- 验收1（判定唯一化）：orderCalc.ts L406-411 return order.isBusinessTrip === true，
  日期窗/启发式零残留（POLICY_FIX_TRIP 仅剩 policy.ts 常量定义与 tripFeeZeroFix
  修正器自身的历史语义，不影响判定出口）；
- 验收2（两个出口实时）：calcReconciliationProfit L496/calcActualProfitByPolicy L519
  均 calcTripSubsidy(order.isBusinessTrip === true)，存值参数留签名不消费；
- 验收3（写入侧同口径）：useCompletion L326-327 实时；
- 验收4（纠偏通道）：correctTripMisjudge 实证已连带清 0（锚点过时，delivery 注明）；
- 验收5（存量修正器）：tripSubsidyGhostFix.ts plan/run 分离+备份前缀
  cdz_v3_ghost_trip_backup_+RUN_AT_KEY 留痕+GhostTripFixTool 设置页入口注册三处；
- 验收6（新场景）：付费 0 未点胶囊单账本断言全过（补助 0 不得 +30）；
- 验收7（build）：rc=0+tsc 零错误+后置检查通过；
- 验收8（回归）：20/20；
- 待裁 2 项并入：漏保兜底橙警 ✔、公式行补项 ✔。
