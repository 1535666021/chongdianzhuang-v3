# 《施工队 · 交付书》P0-260 客户验收实收覆盖

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-260-customer-accept（基线=main cd600d18；核验窗合并/部署）
- 范围：只做完工结算侧客户实收手改（任务书明令）；核算/利润相关主链路不改；材料/辅材/平台扣点/服务费口径零改

## 载荷（6 文件）
| 文件 | 动作 |
| --- | --- |
| src/features/order/types/completion.ts | CompletionFormData 增 `customerPriceOverride?: number` |
| src/shared/utils/orderCalc.ts | 新增纯函数 `resolveCustomerReceivable(override, 增项应收, 电缆应收)`：override（含 0）优先于政策输出，round2dp；政策=增项+电缆 |
| src/features/order/hooks/useCompletion.ts | profit memo 的 customerReceivable 改调纯函数（政策链路一字未动）；导入补 resolveCustomerReceivable |
| src/features/order/pages/OrderComplete.tsx | 完成信息区顶部加「客户实收（元）」输入：value=override ?? 政策应收（profit 实时重算展示），onChange 写 override，placeholder「留空=政策应收」 |
| src/constants/releaseNotes.ts | 头部 1 条 |
| 本书 | — |

## 自查实证清单（对应验收逐条）
1. 录入并保存后客户实收以手改值为准：runner 7 断言 FAILS=0——`override 优先 PASS` / `0 是合法覆盖值 PASS`；落库链贯通（save 载荷 L78 `customerReceivable: profit.customerReceivable` → buildSettlementBase L138-139 快照 customerPrice 同源 profit → OrderDetail 费用明细 badge 读 order.customerPrice **零改动**实证）
2. 未手改走政策应收：runner `undefined/null 走政策 PASS`（增项+电缆）
3. 只改客户实收，不动材料/辅材/平台扣点/服务费：getOrderPlatformFee/calcPlatformFee/服务费链零触碰（diff 面 6 文件实证）；扣点自动档仍按费率×customerReceivable 计算（费率口径不变，金额随实收属自然结果）
4. npm run build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`
5. 交付本书 ✓
6. 边界：材料区/完工区其他入口不动；summary 读 order.customerPrice 快照=覆盖值一致

## 复验指引
- 渲染入口：订单完成页 OrderComplete 完成信息区第一行「客户实收（元）」；订单详情费用明细 badge 显示覆盖后实收
- 关键行：orderCalc resolveCustomerReceivable；useCompletion memo 调用行；OrderComplete 💵 输入块
- 功能冒烟（脱敏）：一单增项 500+电缆 100 → 政策 600；输入 800 → profit/落库/badge 全链 800；清空输入 → 回政策 600

## 教训/避坑
- 纯函数下沉计算层（orderCalc）是 hook 类逻辑 runner 可测的正道——memo 里只留一行调用
- 字符串拼接改 import 行须用整行替换锚点（本单拼接 splice 曾写坏导入行，build 拦回）
