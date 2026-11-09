# P0-243 交付（订单卡片手写备注位 cardNote）

## 基线与载荷
- 基线：main 37c051c（签发 a679656）
- 载荷 3 文件：types/order.ts（Order 加 cardNote?: string）、OrderCard.tsx（CardNoteRow 组件+入口+同位渲染）、releaseNotes.ts（头追加）
- diff 面核对：恰 3 src 文件，零超范围；dist/node_modules 不入库

## 三件实证
1. **cardNote 新字段**：types/order.ts L66，与 remark 平级、rawText 之上；runner R1 写入实证
2. **就地编辑三态**：CardNoteRow 照 CardDoneDateRow 样板——显示态（备注行点击进编辑，空零渲染不占位）/编辑态（autoFocus input+✓✗，maxLength 50 硬钳）/保存 toast；✓/Enter/失焦保存、✗/Esc 取消；全状态可写（待办/待补/已预约/已完成）
3. **跟单显示**：有内容渲染备注行（StickyNote icon+文本，与订单备注同位 className）；无内容该行零渲染，操作区「跟单备注」icon 钮入口（不占总行位）；写通道=orderStore.updateOrder 唯一

## 任务书禁区自查
- 不回写订单备注 remark：runner R3 实证（写 cardNote 后 remark 原文不动；反向写 remark 不覆盖 cardNote=R2）
- 不动 rawText：grep 实证（OrderCard 内 rawText 出现位 L130/132/135/402 全为存量 RawTextModal，零改动）
- 真实订单数据零经手：runner 全脱敏（王某某/13800000000/某小区）

## runner 汇总
5 断言（cardNote 写入/remark 隔离/rawText 隔离/字段互不覆盖/清空可写）FAILS=0；tsc 0+vite build+[BUILD CHECK] 前置/后置全过

## 备注
三态走查（显示/编辑/保存 toast）为 UI 层，真机走查归核验窗复验项；数据层隔离已由 runner 全实证。
