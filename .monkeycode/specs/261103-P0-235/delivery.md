《施工队 · 状态快照》
编号：P0-235　日期：2026-11-03　施工队窗口

═══ 体检结论（阶段一矩阵+阶段二对拍+阶段三快照，全程零代码改动）═══
覆盖：orderCalc.ts 37 导出全量索引；31 个含数值逻辑文件（12 展示方+19 消费方）行级扫描。

一、全绿区（数值全走 orderCalc 出口，零旁路实证）
利润族：Statistics.tsx:50-60、ProfitDetailModal:25-29/44、SalaryCalculator、
SurveyProfitPreview（文件内军令状注释）、SurveyModal:100-102（calcOverFee/resolveOrderPackageMeters）、
useCompletion/useSurvey/useFinance/exportExcel（各 1 处 orderCalc import 自算行 0）；
SurveyModal finalFee=resolveSurveyFinalFee（useSurvey 体系出口，432 行注释实证）；
增项收口=calcAddonTotal（orderCalc:79 唯一导出，书口径①达成）；
安装费=calcInstallFee:382 查表 INSTALL_FEE_TIERS（200/300/自定义归 300，书口径②实证）；
完工日回退链=resolveDoneDate:389-397（actualInstallDate→completeDate→createdAt 本地时区，
394 行 P0-186 实证）；月结 3%=getOrderPlatformFee 唯一含点。

二、字段聚合 4 处（单展示位，矩阵确认无第二公式→非旁路，零改动）
① Statistics:56 netIncome=customerPrice−|platformFee|（仅此一处）；
② cost=materialCost+laborCost（ProfitDetailModal 与 Statistics.addonCost 同式同序）；
③ MonthDetailSections:16-17 天级合计；④ MaterialPicker:240 固定辅材小计。

三、3 个脱敏假单全链快照（esbuild+node 实证输出）
A 待安装/天猫/本杨：应收1899（客付1599+服务300）、对账300、实算1469、完工日回退createdAt；
B 已完成/京东/到每家：actualInstallDate 优先于 completeDate（11-02<11-03 实证回退链序）；
B2 已预约同 B（应收口径不区分状态，展示位按状态取用 ✓）；
C 仅安装零客付：服务费=结算费=300 同源、实算利润−130（亏损可见，断路器口径合理）。

四、差异与边界（如实上报，未擅动）
1. fin.actualProfit（应收口径快照字段）与 calcActualProfitByPolicy（实时实算）数值不同
   （C 单 20 vs −130）——语义本异（对客户快照 vs 内部政策），非第二公式；若甲方认定同指标
   →需orderCalc归并，一句话指令即办；
2. calcSalaryEstimate/calcFullMaterialCost 依赖 store/材料表环境（node 裸跑 ERR，页内调用
   已实证走出口），非代码缺陷。

回归：19/19 ALL GREEN；build：rc=0。
