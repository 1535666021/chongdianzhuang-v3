《核验窗 · 核验任务书》

编号：P0-236-V　签发：监理窗口　日期：2026-11-03　状态：**R1 已交付，转核验窗复验**（return-R1.md：useDailyBreakdown.ts:30 日结合计读存值，补改 calcActualProfitByPolicy(o)）

═══ 验哪 ═══
- 仓库：1535666021/chongdianzhuang-v3
- 被验单：P0-236（specs/261103-P0-236/task.md = 施工任务书原件）+ R1 补改（return-R1.md）
- 交付快照：specs/261103-P0-236/delivery.md + delivery-R1.md（R1，已交付）
- 基线 SHA：3019fe4　首交 HEAD：1a67eb9　R1 新 HEAD：**e0cf21e**（已补填）

═══ 监理预审（diff 面已核，供你快验）═══
监理已对 1a67eb9→e0cf21e 双版本 diff：恰 1 文件 useDailyBreakdown.ts 共 3 行——import 行补 calcActualProfitByPolicy（附 R1 注释）、:9 注释改述、:30 total 改 calcActualProfitByPolicy(o)。与打回令逐字相符，零越界。

═══ 验什么 ═══
首交轮（已跑条款，结论随 R1 一并出）：
1. verify.sh 3019fe4 1a67eb9 order.actualProfit——diff 面恰 4 文件（OrderDetail/MonthDetailSections/PlatformBreakdown/releaseNotes），不符=打回；
2. grep 显示/筛选/排序/聚合位读存值零残留（豁免=useCompletion:136/:353+OrderDetail 出差纠正段）；
3. 抽验 3 改动文件逐行：全传整个 order 给 calcActualProfitByPolicy；
4. 对拍 delivery 举证清单（抽查 1/3）；5. releaseNotes 恰 13 条；6. 回归样本零差异。
R1 轮（本轮主验）：
7. verify.sh 1a67eb9 e0cf21e——diff 恰 1 文件（useDailyBreakdown.ts）；:30 走实时口径；delivery-R1.md 场景 2 日结合计=-130 实证（与四显示一致）；回归/build 声明核举证清单。

═══ 报哪 ═══
结论按 VERIFY-ONBOARDING 五步法第 5 步格式，报监理窗口；通过=顺手销号刷新交接书（首交+R1 一并销），打回=写 return-R2.md 落本目录。
