《施工队 · 状态快照》
编号：P0-238　日期：2026-11-05　施工队窗口

═══ 总判定 ═══
四大块（A 导出矩阵 / B 库存幂等 / C 写入一致性 / D 展示链路）全量体检完成；
8 场景手工账本对拍 10/10 断言全绿（8 场景+2 补充分支，含写入侧一致性逐字段核）；
回归 20/20 + npm run build rc=0；代码零 diff（验收 7 明文允许"diff 仅为体检修的最小修复"）。
真发现 2 项，均属低优先展示/告警层，列待裁清单，不擅修。

═══ A 块：orderCalc 导出消费矩阵 ═══
实测导出函数/常量 44 个（任务书称 37，差异 reconciliation：37 应为签发时快照，
现含 P0-236-R1 后新增/调整的导出；矩阵按实测 44 全列，一个不缺）。
外部有消费 40 个；纯内部 4 个：DEFAULT_OVER_PRICE（calcOverFee 默认参）、
SERVICE_FEE（getServiceFee 表体）、getServiceFee（orderCalc 内部+别名链）、
shouldIncludeBreaker（矩阵判定内部）。
消费面 Top5：calcActualProfitByPolicy 41 命中（最大消费面）/ resolveDoneDate 17 /
calcReconciliationProfit 17 / calcFullMaterialCost 16 / resolveOrderPackageMeters 15。
唯一入口铁律核：calcActualProfitByPolicy 全部消费方直调 orderCalc，无第二实现；
calcFullMaterialCost 16 消费方含弹窗预览与修正器，均同源。

═══ B 块：adjustStock 库存链 ═══
- 幂等：restock=批次哈希查重（RestockDialog buildRestockBatchHash+hasRefId，
  R-11.8）；complete=订单 stockDeducted 布尔防重（useCompletion）；编辑态不动库存
  （P0-206-M）；删除/取消完工不回滚（R-11.4）✔
- 禁负：出库 actual=Math.min(current,need)，库存下限 0，shortfall 进提示不记负 ✔
- 当时成本价：unitCost=绑定 costPrice，桩=0 元只计数（R-11.1/R-11.3）✔
- 缺口确认弹窗（R-11.7）：先列"名称缺 N"，确认才落库 ✔
- adjustStock 唯一出口 R-11.11：useCompletion 成本项逐项经此，免费配额材料由
  calcFullMaterialCost 矩阵计入电缆/PVC 行，不重复扣 ✔

═══ C 块：写入侧一致性 ═══
useCompletion L311-340 逐行核：platformFee=override??auto（auto：trip→0，否则
getOrderPlatformFee×100 舍入，费率唯一来源 PLATFORM_FEE_RATE=0.1，吉利 0）；
serviceFee=override??calcInstallFee(resolveOrderPackageMeters)（R-1.2 分档）；
tripSubsidy=存值??calcTripSubsidy(isBusinessTripOrder(order))；actualProfit=
calcActualProfitByPolicy；reconciliationProfit=calcReconciliationProfit；
materialCost=calcFullMaterialCost.total。7 字段落库后经结算基座落结算留痕。
账本 10 场景逐字段"存值 vs 实时重算"一致 ✔。

═══ 8 场景手工账本对拍（核心实证）═══
成本底表（默认种子）：电缆 17.9/米、PVC 1.0/米、漏保盒 5.0、C25=26.8/C40=26.8/
C40A=46.5、桥架 7.0；政策包：扣点率 0.1、出差补助 30/台、安装费分档
20 米=200/30 米=300/其余=300、出差窗口[2026-09-01,10-15]。
程序侧=生产镜像（照 useCompletion 调用链逐行复刻，含 inferBreakerType 回退
3.5→C25/7→C40）。全脱敏假数据。
①奇瑞30米基线：材料 572=537+30+5，费 300，扣点 0，利润 −272，对账 300 ✔
②出差开关单：扣点 0+补助 30，利润 −242，对账 330 ✔（R-1.4/R-7）
②b政策窗口 legacy 单（无开关，09-15）：自动判出差，同上 ✔（R-3 窗口语义）
③增项单（桥架 2×7 售价 14）：扣点 1.4，材料 586，利润 −273.4，对账 298.6 ✔
  财务链 getCompletedOrderFinancials：customerPay=314、actualIncome=312.6 ✔
④超米单（45 米，超 15×45=675）：扣点 67.5，材料 855.5，利润 52，对账 232.5 ✔
⑤五菱 3.5kW（C25 矩阵自购）：材料 598.8=537+30+5+26.8，利润 −298.8 ✔（R-1.5）
⑥免配比亚迪 7kW 20 米：漏保器 0+漏保盒必含 5，材料 383，费 200，利润 −183 ✔
⑦未绑定材料（非标定制件X 售价 100）：成本 0 不计+unmatched 橙警，
  扣点 10，利润 −182 ✔（R-5.1）
⑧补桩发货（五菱 3.5kW，0 米电缆）：材料 31.8=5+26.8，利润 268.2，桩不入
  成本链（R-10.1 库存层 0 元计数）✔
账本 runner：esbuild 本地临时脚本（不入库），输出"FAILS= 0"。

═══ D 块：展示链路 inventory ═══
完工预估弹层 ProfitPreview/BreakdownLine：全字段来自 useCompletion profit memo，
与写入同源 ✔；finance 页 CostDetail:136 公式行见待裁#2；Statistics 三格+
对账/实际利润格=calcReconciliationProfit/calcActualProfitByPolicy 实时重算 ✔
R-2；addonCost=materialCost+laborCost ✔；月报 MonthDetailSections/PlatformBreakdown
实时口径（P0-236 批注）✔；按天明细 useDailyBreakdown=R1 实时口径 ✔；修正器界面
plan→run+执行前备份+幂等+lastProfitAuditAt ✔；SalaryCalculator=calcSalaryEstimate
独立工具 ✔。

═══ 待裁清单（真发现 2 项，低优先，均不擅修）═══
#1 calcFullMaterialCost 漏保兜底命名缺口：breakerType 为空时回退
   find(/漏保|漏电保护/ && !盒)，与默认成本表命名（C25/C40/C40A 不含"漏保"）
   不匹配→恒落空→漏保成本静默 0 且不入 unmatched 橙警。生产链 inferBreakerType
   基本兜底（3.5→C25/7→C40），影响面=功率奇异且未手动选型单。建议（待甲方裁）：
   兜底落空时入 unmatched 橙警。
#2 finance 页 CostDetail:136 实际利润公式行=客户付费+安装费−材料−扣点，缺
   tripSubsidy/laborCost 两项展示——数值本身正确（存值全口径），仅四则展示在
   有出差补助/人工费单据时不闭合。建议（待甲方裁）：公式行补两项。

═══ 验收自查清单 ═══
- 验收1（44 导出矩阵一个不缺）：附表 44 行，外部消费 40+纯内部 4，逐导出 grep
  命中数与文件落表；37 差异已 reconciliation 说明；
- 验收2（库存幂等/回滚/防重/缺口弹窗）：B 块 5 条逐条文件:行号实证
  （stockCalc.ts:97-152、useCompletion 库存段、RestockDialog.tsx:99-112）；
- 验收3（useCompletion 落库组逐行）：C 块逐行引用 L311-340 区域；
- 验收4（账本对拍）：8 场景+2 分支，手工账本常量在脚本内，程序输出逐字段
  对拍，FAILS=0；
- 验收5（展示字段链路表）：D 块 8 展示位全落；
- 验收6（修正器 plan/run）：profitAuditFix.ts 全函数+ProfitAuditTool 入口
  （plan 预览→run 执行+备份+幂等+时间戳）；
- 验收7（无 diff 或最小修复）：本单代码零 diff，git status 干净；
- 验收8（build）：npm run build rc=0，末行"[BUILD CHECK] 后置检查通过"；
- 回归：解析器样本 20/20 ALL GREEN（本单未动解析器）。

═══ A 块附表（导出|外部命中|消费文件）═══
DEFAULT_PACKAGE_METERS|7|constants/package.ts,features/order/components/MaterialPicker.tsx,features/order/hooks/usePackageMeters.ts,features/order/hooks/useScript.ts
resolveOrderPackageMeters|15|features/order/components/SurveyModal.tsx,features/order/hooks/useCompletion.ts,features/order/hooks/useSurvey.ts,features/order/pages/OrderDetail.tsx,shared/dataFix/policyFix.ts,shared/dataFix/profitAuditFix.ts
isGeelyBrand|10|features/order/components/OrderCard.tsx,features/order/hooks/useCompletion.ts,features/order/hooks/useScript.ts,features/order/hooks/useSurvey.ts,features/settings/components/SalaryCalculator.tsx
getSettlementFee|2|shared/utils/exportExcel.ts
getOrderPlatformFee|5|features/order/hooks/useCompletion.ts,features/order/pages/OrderDetail.tsx
calcPackageSplit|2|features/order/hooks/usePackageMeters.ts
calcOverFee|10|features/order/components/SurveyModal.tsx,features/order/hooks/useCompletion.ts,features/order/hooks/useScript.ts,features/order/hooks/useSurvey.ts
calcAddonTotal|2|features/order/hooks/useScript.ts
buildAddonItemsText|2|features/order/hooks/useScript.ts
calcPlatformFee|5|features/order/components/SurveyProfitPreview.tsx,features/order/hooks/useCompletion.ts
getOrderBusinessDate|14|features/finance/hooks/useFinance.ts,features/order/pages/OrderDetail.tsx,features/order/pages/OrderDetail.tsx,features/statistics/pages/Statistics.tsx,shared/dataFix/policyFix.ts,shared/utils/exportExcel.ts
getOrderServiceFee|2|features/order/components/OrderCard.tsx
getCompletedOrderFinancials|12|features/finance/hooks/useFinance.ts,features/statistics/hooks/useStatistics.ts,features/statistics/pages/Statistics.tsx
buildPlatformBrand|2|features/order/hooks/useScript.ts
buildAddonSummary|3|features/order/hooks/useScript.ts
findWanbangMeteredCable|5|features/order/components/SurveyModal.tsx,features/order/hooks/useSurvey.ts
isFreeQuotaMaterial|18|constants/addonPrice_zhida_wuling.ts,constants/package.ts,features/material/hooks/useMaterialFrequency.ts,features/order/components/MaterialPicker.tsx,features/order/hooks/useCompletion.ts,features/order/hooks/usePackageMeters.ts
isBreakerMaterial|4|features/order/hooks/useCompletion.ts,features/order/hooks/useSurvey.ts
extractCableMeters|2|features/order/hooks/useScript.ts
buildFullMaterialCostInput|4|features/order/components/OrderCard.tsx,features/order/pages/OrderDetail.tsx
calcFullMaterialCost|16|features/order/components/OrderCard.tsx,features/order/components/SurveyProfitPreview.tsx,features/order/hooks/useCompletion.ts,features/order/hooks/useSurvey.ts,features/order/pages/OrderDetail.tsx
calcOrderServiceFee|3|features/order/hooks/useSurvey.ts
calcMaterialCost|6|features/order/components/SurveyProfitPreview.tsx,features/order/hooks/useCompletion.ts
resolveCostPrice|4|features/finance/hooks/useFinance.ts,features/order/hooks/useCompletion.ts
findCostPrice|12|features/material/hooks/useCostMatcher.ts,features/order/hooks/useCompletion.ts,features/order/pages/OrderComplete.tsx,shared/dataFix/policyFix.ts
calcSurveyTotal|2|features/order/hooks/useSurvey.ts
calcSalaryEstimate|2|features/settings/components/SalaryCalculator.tsx
calcInstallFee|9|features/order/hooks/useCompletion.ts,features/order/hooks/useSurvey.ts,features/order/pages/OrderDetail.tsx,shared/dataFix/policyFix.ts,shared/dataFix/profitAuditFix.ts
resolveDoneDate|17|features/appointment/repository.ts,features/order/components/OrderCard.tsx,features/order/components/OrderFilterBar/utils.ts,features/order/hooks/useOrderList.ts,features/statistics/hooks/useDailyBreakdown.ts,features/statistics/hooks/useStatistics.ts
absPlatformFee|2|shared/dataFix/policyFix.ts
isBusinessTripOrder|9|features/order/hooks/useCompletion.ts,features/order/pages/OrderDetail.tsx,shared/dataFix/tripFeeZeroFix.ts
calcTripSubsidy|6|features/order/components/SurveyProfitPreview.tsx,features/order/hooks/useCompletion.ts,shared/dataFix/policyFix.ts
calcPolicyPlatformFee|3|shared/dataFix/policyFix.ts
needBreakerCost|12|features/order/components/SurveyProfitPreview.tsx,features/order/hooks/useCompletion.ts,shared/dataFix/breakerCostBackfillFix.ts,shared/dataFix/breakerRowSelfCheckFix.ts,shared/dataFix/policyFix.ts
resolveBreakerUnitCost|8|features/order/hooks/useCompletion.ts,shared/dataFix/breakerCostBackfillFix.ts,shared/dataFix/breakerRowSelfCheckFix.ts
resolveBreakerRowName|2|shared/dataFix/breakerRowSelfCheckFix.ts
isBreakerDeviceRow|9|shared/dataFix/breakerCostBackfillFix.ts,shared/dataFix/breakerRowSelfCheckFix.ts,shared/dataFix/policyFix.ts
isBreakerBoxRow|4|features/order/hooks/useSurvey.ts,shared/dataFix/policyFix.ts
calcReconciliationProfit|17|features/order/hooks/useCompletion.ts,features/statistics/components/ProfitDetailModal.tsx,features/statistics/hooks/useStatistics.ts,features/statistics/pages/Statistics.tsx,shared/dataFix/policyFix.ts,shared/dataFix/profitAuditFix.ts
calcActualProfitByPolicy|41|features/order/components/OrderCard.tsx,features/order/components/SurveyProfitPreview.tsx,features/order/hooks/useCompletion.ts,features/order/hooks/useOrderForm.ts,features/order/pages/OrderDetail.tsx,features/settings/components/ProfitAuditTool.tsx
DEFAULT_OVER_PRICE|0|（orderCalc 内部消费）
SERVICE_FEE|0|（orderCalc 内部消费）
getServiceFee|0|（orderCalc 内部消费）
shouldIncludeBreaker|0|（orderCalc 内部消费）
