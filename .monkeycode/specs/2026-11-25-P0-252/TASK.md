# 《施工队 · 任务书》P0-252

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

基线：main 069bf1a（V3 代码基线 9fb2b75，末笔仅交接书文书）

## 问题
数据统计页顶部月份选择器需支持“全部”；选“全部”后，当前公司 Tab（全部/本杨/到每家/未分）不按月份过滤，指标、按天明细、导出 Excel 对账单均按该范围联动。默认仍为当前月，下拉首项加“全部”；不新增下载中心，沿用现有前端统计/导出。

## 实证结论
1. src/features/statistics/pages/Statistics.tsx：months 来自 [currentMonth, ...orders.map(getOrderMonth)]，无 __ALL__；selectedOrders=orders.filter(getOrderMonth(order)===selectedMonth)。
2. 导出按钮 onClick={() => exportReconciliationCsv(selectedOrders, selectedMonth)}；src/shared/utils/exportExcel.ts 的 exportReconciliationCsv 不截断传入 orders，文件名 `对账单_${month}.xlsx`。卡点在筛选范围只有具体月份。
3. MonthDetailSections/ProfitDetailModal 跟随 completedOrders/month 文案；月份变“全部”时需显示范围文案同步。

## 实现要求
A. Statistics.tsx 增加常量 ALL_MONTHS='__ALL__'；months 下拉首项插入 {value:ALL_MONTHS,label:'全部'}；默认 selectedMonth 仍 currentMonth。
B. selectedOrders=selectedMonth===ALL_MONTHS ? orders : orders.filter(getOrderMonth(order)===selectedMonth)。
C. 导出传同一 selectedOrders；month 参数对 ALL 传'全部'，文件名 `对账单_全部.xlsx`；非 ALL 保持原文件名。
D. ProfitDetailModal 的月份副标题、DailyBreakdownSection/ProfitBoardSection 的空态与合计文案，ALL 时显示“全部/当前范围”，不要写死“该月”。
E. 不动 CompanyFilter、不动已完成状态口径、不引入异步/下载中心、不改导出列。
F. 另发现不改：导出现在传 selectedOrders，未按 companyHit/status='已完成' 过滤，与统计卡 completedOrders 不一致；本单只加“全部”范围，不擅自改该口径。若要导出=当前公司已完成，另开任务书。

## 验收标准
1) 选择器首项为“全部”，默认当前月；切到“全部”后不再按月份过滤。
2) 公司 Tab 切到本杨/到每家/未分时，“全部”统计与导出范围跟随当前 CompanyFilter 数据源 orders/activeOrders，但不新增公司过滤逻辑。
3) 选“全部”点导出：文件含当前范围全部传入订单，文件名 `对账单_全部.xlsx`；选具体月仍 `对账单_YYYY-MM.xlsx`。
4) 按天明细/逐单盈亏榜/利润明细空态文案在 ALL 下不显示“该月”硬文案。
5) npm run build 通过；附最小 stub 验证 ALL 时 selectedOrders 长度=orders 长度，非 ALL 时仍按月过滤。

## 交付要求
单轮完成：编码→验证→Build→API推送→回拉核验→delivery.md 落 `.monkeycode/specs/2026-11-25-P0-252/delivery.md`。会话只报一行：P0-252+commit+delivery.md 路径。禁真实订单/客户数据；状态快照含自查实证清单。

施工队自行部署
监理窗口 · 签发完毕
