# 《核验窗 · 核验任务书》P0-243

- 单号：P0-243（订单卡片手写备注位 cardNote）
- 核验窗角色进场必读：.monkeycode/SUPERVISOR-HANDOVER.md 全文 → 本单 task.md → delivery.md → 本任务书
- 分支锁：main；基线 37c051c → 交付 5a59567（四笔：2442409/6c31158/da08d54/5a59567）
- 测试一律脱敏假数据（王某某/13800000000/某小区），真实订单数据禁经手
- 回执二选一：通过=SUPERVISOR-HANDOVER.md 第二节加销号行；打回=本目录 return-R*.md 逐条列 FAIL 实证

## 验收逐条（按 task.md 第四节过秤）

1. **cardNote 新字段**：types/order.ts Order 加 cardNote?: string（与 remark 平级）
2. **三态可写**：CardNoteRow 照 CardDoneDateRow 样板——显示态（备注行点击进编辑，空不渲染该行，入口=操作区「跟单备注」icon 钮经自定义事件 cardnote-edit 联动）/编辑态（autoFocus input+✓/✗，maxLength 50 硬钳）/✓/Enter/失焦保存+toast、✗/Esc 取消；全状态可写（待办/待补/已预约/已完成）；stopPropagation 防卡片跳转
3. **跟单显示**：有内容=备注行（StickyNote icon+文本，与订单备注同位 className=order-card__remark）；无内容=该行零渲染；操作区入口仅无内容时显示
4. **字段隔离**：写 cardNote 不回写 remark、不动 rawText；反向写 remark 不覆盖 cardNote（runner 实证+grep 实证）
5. **写通道唯一**：CardNoteRow 内写 cardNote 仅 orderStore.updateOrder 一处
6. **空态零渲染**：无内容时备注行不渲染不占位（runner 不可验 UI 层，真机走查或 DOM 层 grep 实证）
7. **零超范围**：diff 面恰 3 src 文件（types/order.ts、OrderCard.tsx、releaseNotes.ts）+delivery；orderCalc/parser/回归 20 条零改动
8. **实跑**：runner 5 断言（写入/remark 隔离/rawText 隔离/字段互不覆盖/清空可写）+tsc 0+vite build+[BUILD CHECK] 前后
9. **双版本快照 diff 法**：37c051c vs 5a59567 快照对拍，实证贴文件:行/命令/输出
