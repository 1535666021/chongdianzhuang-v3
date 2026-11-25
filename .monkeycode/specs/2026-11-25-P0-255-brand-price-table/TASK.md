# 《施工队 · 任务书》P0-255
> 施工队：别队（非253原班）。与 P0-253 系列并行但不得改同一批材料/进单文件；如冲突以本任务书为准。


施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

基线：main HEAD 以接单时为准

## 问题
甲方确认：修改完工结算/勘测材料入口里，画圈「添加材料（全量·批量）」现在吃的是成本表且混品牌；必须改成**当前订单品牌对应的客户价表**，只按客户价收费，成本另走成本绑定；下拉排序按使用频率；不要成本表、不要其他品牌杂项。

## 实证
- `src/features/order/components/AddMaterialsSheet.tsx`：数据源 `getAllCostMaterials()`，标题「添加材料（成本表全量）」，确认后进 `useCompletion.addMaterials()`。
- `src/features/order/hooks/useCompletion.ts`：`addMaterials` 用 `it.costPrice` 进单，`settlementPrice: 0`，客户价未进入。
- `src/features/order/components/MaterialPicker.tsx`：候选 `catalog = getAllAddonMaterials()` 后直接 `slice(0,20)` / 搜索后 `slice(0,30)`；未接 `useMaterialFrequency/sortMaterialsByFrequency`，所以不按使用频率；也未按当前品牌过滤，易混品牌。

## 实现要求
A. 批量添加入口改数据源：用 `getAllAddonMaterials()`，按当前订单有效品牌过滤（`order.brandName` 优先，勘测/完工上下文用各自有效品牌；京东专项模板保留，但通用入口不得用成本表兜底）。标题改「添加材料（品牌客户价表）」。
B. 品牌未配置/为空：候选为空并提示「未配置当前品牌价表」；禁止把成本表或其他品牌材料混进来。
C. 进单字段：`settlementPrice` 用客户价表价格；`costPrice` 通过既有成本绑定/`findCostPrice` 解析；`customerSubtotal = settlementPrice × quantity`，成本字段只用于利润，不参与客户收费。
D. 排序：候选列表在 slice 前统一 `sortMaterialsByFrequency(catalog, frequency)`；搜索过滤后也按频率排，再截断。频率工具从 `useMaterialFrequency` 取，禁止新写一套频率逻辑。
E. 影响范围：只改材料选择/添加与进单映射；不动套餐米数抵扣、安装费分档、成本绑定规则、统计口径；不改真实订单数据。
F. 数据红线：测试/截图一律脱敏假数据；任务书、delivery、日志不得出现真实客户信息。

## 验收标准
1) 当前品牌=比亚迪时，批量添加只出现比亚迪客户价表材料；客户价 ¥45/米那条进单后客户金额按客户价算，成本列仍按绑定成本显示。
2) 切到无品牌/未配置品牌，批量添加为空并提示，不显示成本表杂项。
3) 连续添加多个候选时，高频材料排在低频前；搜索后仍按频率排序。
4) P0-251 的 30m 套包内 ¥0 逻辑不回退；超出仍只对超出米数收费。
5) npm run build 通过；交付 `.monkeycode/specs/2026-11-25-P0-255-brand-price-table/delivery.md`，附脱敏自查清单与改动文件清单。

施工队自行部署
监理窗口 · 签发完毕
