# 《施工队 · 任务书》P0-251

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

基线：main 069bf1a（V3 代码基线 9fb2b75，末笔仅交接书文书）

## 问题
30m 套餐订单，勘测选择「套包外线缆敷设 ZC-YJV-3*6mm²（含线缆、套管、辅材、人工及2年质保）」仅 3m/8m，客户侧仍按 ¥45/m 计费；截图链路落出 3m×¥45。甲方口径：套餐内不得问客户收费；该线是电缆/线缆敷设费，不是 PVC 费，PVC 客户侧恒 0。

## 实证结论
1. 数据行：src/constants/addonMaterialData_batch7_比亚迪_part2.ts 的 addon_312，settlementPrice=45，freeQuota=30，但 categoryCode='PVC'/category='管材'。
2. src/features/order/hooks/useSurvey.ts 的 isCableMat 对“有 categoryCode”的材料只认 categoryCode === 'CABLE'，不按名字兜底；addon_312 被判非电缆。
3. src/features/order/components/SurveyModal.tsx 本地 isCableMat 仍是旧正则 /电缆敷设 | 线缆敷设/（含空格字面量），与 useSurvey 不一致；材料行 displayFee、totalEstimatedCost、reportText 同口径把它全量计入。
4. 抵扣出口在 src/shared/utils/orderCalc.ts 的 calcPackageSplit/calcOverFee；问题是该行没进入出口。

## 实现要求
A. 判定唯一出口放 orderCalc.ts：新增/导出电缆免费额度行判定，例如 isCableLikeSurveyCharge(mat)：categoryCode==='CABLE' 或 (mat.freeQuota ?? 0)>0 或（无 categoryCode 时）去空格 /电缆敷设|线缆敷设/ 命中。禁各组件第二份判定。
B. useSurvey.ts 改接唯一出口；calcCableCost 对命中行 quota=(mat.freeQuota>0?mat.freeQuota:resolveOrderPackageMeters(order))，再 calcOverFee(distance, quota, unitPrice)。电缆行不得进 nonCableTotal。
C. SurveyModal.tsx 删除本地 isCableMat 旧正则，displayFee/同步电缆距离/billedMaterials/detailLines/预估费用全部同一出口；单位按 mat.unit 显示，非米禁硬显 /m。
D. 0元支持：套餐内电缆行材料金额可 ¥0.00；预估费用合计可 ¥0.00；报告不打 subtotal<=0 收费行或写「套餐内含 X 米，不另收费」；保存/复制不拦截。不得顺手改 P0-114：实收框仍要求正数，空=按预估；预估=0 时实收留空即不收费。
E. 不改成本绑定口径：成本侧 isFreeQuotaMaterial/PVC/YJV/电缆免费额度逻辑不得绕过或双计；calcFullMaterialCost 出口禁同一材料既免费额度又增项成本。
F. 禁超范围：不改套餐定义、安装费分档、品牌默认 packageMeters 来源、历史修正器、V4/老系统。

## 影响半径
- Material.freeQuota：常量/批次值不改；本单新增客户收费侧读取；成本侧若已读不得双计。
- isCableMat/calcCableCost/totalEstimatedCost/reportText：必须改。
- SurveyProfitPreview/SurveyProfitConclusion：只消费 estimatedCost/receivable，禁自算。
- validateSurveyActualReceive/commitAdd/commitPrice：不改 0/正数规则。
- addon_310/311（3*10/3*16，freeQuota=0）：不擅自纳入 30m 免费；保持现状，除非另开。

## 验收标准
1) BYD 30m 套餐，addon_312 数量=3：材料行 ¥0.00，预估费用 ¥0.00，报告客户增项 ¥0.00 或不列收费；不弹客户收费话术。
2) 数量=8：仍 ¥0.00。
3) 数量=35：客户只收超出 5m×¥45=¥225；报告体现「超5米」，不得 35m 全量收。
4) 套餐米数取 order.packageMeters 优先，无则品牌默认；禁组件按品牌硬编码。
5) 既有 CABLE 行、安装服务套包、套包内升级、PVC/漏保/漏保盒回归不新增客户收费；PVC 客户侧恒 0。
6) npm run build 通过；附最小 runner/stub 实测 A/B/C 数字与报告字符串。

## 交付要求
单轮完成：编码→验证→Build→API推送→回拉核验→delivery.md 落 `.monkeycode/specs/2026-11-25-P0-251/delivery.md`。会话只报一行：P0-251+commit+delivery.md 路径。禁真实订单/客户数据；状态快照含自查实证清单。

施工队自行部署
监理窗口 · 签发完毕
