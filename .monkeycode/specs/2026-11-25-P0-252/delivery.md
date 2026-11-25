# P0-252 交付：统计月份选择器「全部」范围

- 基线：main dad9b17d → 新 HEAD 见提交（单 commit 载荷 4 文件）
- 单号：P0-252　日期：2026-11-25

## 改动清单（diff 恰 3 src 文件 + 本书）

1. `src/features/statistics/pages/Statistics.tsx`：新立 `ALL_MONTHS='__ALL__'` 哨兵；下拉首项插「全部」；
   selectedOrders 按 ALL 短路为 orders（零拷贝）；exportMonth=ALL?'全部':selectedMonth，导出与 ProfitDetailModal 同变量；
   DailyBreakdownSection/ProfitBoardSection 传 rangeLabel（ALL=「当前范围」）。
2. `src/features/statistics/components/MonthDetailSections.tsx`：两组件加可选 prop rangeLabel（默认'该月'），
   空态文案 `{rangeLabel}暂无完成订单`，ALL 下不再写死「该月」。
3. `src/constants/releaseNotes.ts`：头部追加 1 条。

## 自查实证（runner 9/9 PASS，脱敏假数据）

- ALL：selectedOrders 长度=orders（5=5，含无日期单走 createdAt 兜底）；返回原数组引用；
- 具体月：2026-11 过滤得 3 单（actualInstallDate 链 2 单+createdAt 兜底 1 单）、10 月 1 单、9 月 1 单；
- 导出参数：ALL→'全部'（文件名对账单_全部.xlsx）、具体月原值；空集合 ALL=0；哨兵值不在真实月份集合。

## 构建

npm run build：build-check 前置/后置通过，tsc 0 错误。

## 影响半径对拍

- CompanyFilter：未动 ✔　已完成状态口径：未动 ✔　导出列：未动 ✔　exportReconciliationCsv 函数体：未动（仅传参变化）✔
- 任务书 F 条「另发现不改」：导出未按 companyHit/已完成过滤的口径保持原样，未顺手改 ✔

更新说明：数据统计支持按「全部」范围查看和导出对账单
