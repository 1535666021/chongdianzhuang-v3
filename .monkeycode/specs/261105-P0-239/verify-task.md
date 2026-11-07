《核验窗 · 核验任务书》P0-239（出差判定唯一化）

编号：P0-239-V　签发：监理窗口　日期：2026-11-06　交付基线：f1923b435c76500555d390ea0a62424078c27e08
核验对象：该单 delivery.md 对应全部改动（基线 cef61e2 → f1923b43）

═══ 一、验收逐条（源=同目录 task.md 第四节）═══
1. isBusinessTripOrder 废除日期窗+启发式，boolean 优先、undefined/false=不出差（读 orderCalc.ts 实证）
2. calcActualProfitByPolicy/calcReconciliationProfit 补助项实时=calcTripSubsidy(order.isBusinessTrip===true)，不吃存值
3. useCompletion 写入侧同口径；"纠正为不出差"改与胶囊同通道并连带清 tripSubsidy
4. 存量修正器：isBusinessTrip!==true && tripSubsidy>0 批量归 0（plan/run 分离+备份+幂等，只报不跑）
5. 并入两项：漏保兜底落空入橙警、CostDetail 公式行补 tripSubsidy/laborCost
6. 账本对拍六断言+回归 20/20+新场景"客户付费 0 未点胶囊单不得 +30"（幽灵 30 根因场景，必验）
7. build tsc 0+[BUILD CHECK]；delivery.md 自查清单逐条复核，虚报一处记 FAIL

═══ 二、纪律 ═══
双版本快照 diff 法（cef61e2 vs f1923b43）；测试脱敏假数据（王某某/13800000000/某小区），真实订单数据禁经手；修正器只验 plan 输出+幂等性，禁真跑写库。
结论送达：通过=V3 仓库 .monkeycode/SUPERVISOR-HANDOVER.md 第二节加销号行（沿用既有格式）；打回本目录 return-R*.md 逐条列 FAIL 实证。会话只报一行指针，文书落库即送达。
