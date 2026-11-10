# 《核验窗 · 核验任务书》P0-245

- 单号：P0-245（手写备注行显眼色）
- 核验窗进场必读：SUPERVISOR-HANDOVER.md 全文 → task.md → delivery.md → 本任务书
- 基线 a149ec5 → 交付 HEAD（三笔：8d6f744/f3bb9af/835fb3c）
- 回执二选一：通过=交接书第二节加销号行；打回=本目录 return-R*.md 列 FAIL 实证
- 脱敏假数据测试（真实订单零经手）

## 验收逐条（task.md 第四节）
1. OrderCard.tsx 显示态块新立修饰类 order-card__cardnote（恰 2 行：外层 div+内层 span）
2. CSS 新立 .order-card__cardnote 橙红 #ea580c+600（只加新类不改正类）
3. 零误伤：解析备注块 remark 类未动/空态占位未动/编辑态行未叠修饰类
4. 橙红与待办橙区分（#d97706 vs #ea580c）
5. diff 面恰 3 文件（tsx/css/releaseNotes），orderCalc/parser/Order.ts 零改动
6. tsc 0+build 全过（建议复跑）
7. 双版本 diff：a149ec5 vs HEAD 快照对拍
