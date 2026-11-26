# 《施工队 · 任务书》P0-260

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），每轮结束重读最新版，再按本任务书施工。

## 问题
订单详情 → 修改结算，需要支持改「客户验收/客户实收」。场景：系统按材料报价算应收 ¥700，客户实际只给 ¥650；若仍按系统结算，平台扣点和实际利润都会错。

## 目标
在完工结算编辑态增加客户实收覆盖：不改材料明细和单价，只覆盖最终 `customerPrice`，并重算不出差扣点与实际利润；保留留痕。

## 实现要求
A. `CompletionFormData` 新增 `customerReceivableOverride?: number`；OrderComplete 费用区新增「客户实收/验收金额」输入，placeholder=系统应收，留空=按系统。
B. `useCompletion.profit`：若 override 非空，`customerReceivable=override`；否则现口径。材料明细、套餐米数、成本逻辑不动。
C. 平台扣点：不出差单自动按覆盖后应收 × `PLATFORM_FEE_RATE` 重算；若用户又手动覆盖 platformFeeOverride，以手动为准；出差单仍扣点 0、补助按既有胶囊口径。
D. 保存：`buildSettlementBase` 写回 `customerPrice=覆盖后金额`、新增 `isCustomerPriceOverridden`、留痕 `customerPriceOverrideBefore/After` 或 editCount/lastEditedAt 已有则补充；OrderDetail 费用明细显示“客户实收已改”小标。
E. 统计/对账读保存后的 `customerPrice`，不得另起一套展示口径；P0-257 对账以保存值为准。
F. 禁改勘测弹窗 P0-114 的实收校验；本入口是完工结算编辑态。

## 验收
1) 脱敏单：材料应收 700，客户实收填 650，保存后客户应收=650；不出差扣点=65；实际利润按650重算。  
2) 出差单覆盖实收后扣点仍为0，补助口径不变。  
3) 不填实收时行为与旧版一致；材料明细金额不被改写。  
4) npm run build 通过；交付 `.monkeycode/specs/2026-11-26-P0-260-customer-accept/delivery.md`。

施工队自行部署
监理窗口 · 签发完毕
