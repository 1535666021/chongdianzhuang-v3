《核验窗 · 核验任务书》

编号：P0-236-V　签发：监理窗口　日期：2026-11-03　状态：**监理裁 A 打回 R1**（return-R1.md：useDailyBreakdown.ts:30 日结合计读存值，补改 calcActualProfitByPolicy(o)）——R1 交付后监理补新 HEAD 栏再验

═══ 验哪 ═══
- 仓库：1535666021/chongdianzhuang-v3
- 被验单：P0-236（specs/261103-P0-236/task.md = 施工任务书原件，验收标准以它为准）+ R1 补改（return-R1.md）
- 交付快照：specs/261103-P0-236/delivery.md + delivery-R1.md（R1 后）
- 基线 SHA：3019fe4　新 HEAD：1a67eb9（首交）／________（R1 commit，监理转派时补填）

═══ 验什么 ═══
首交轮（已完成）：
1. 跑：bash .monkeycode/verify.sh 3019fe4 1a67eb9 order.actualProfit——diff 面恰 4 文件：OrderDetail.tsx / MonthDetailSections.tsx / PlatformBreakdown.tsx / releaseNotes.ts，不符=打回；
2. grep：显示/筛选/排序/聚合位读存值 actualProfit 零残留（豁免=useCompletion:136/:353 写入侧+OrderDetail 出差纠正段）；
3. 抽验 3 改动文件逐行：显示/筛选/排序/聚合全传整个 order 给 calcActualProfitByPolicy；
4. 对拍 delivery 举证清单（抽查 1/3 起）；5. releaseNotes 恰 13 条新增在头；6. 回归样本零差异。
R1 轮（待施工队交付）：
7. verify.sh 1a67eb9 <R1新HEAD>——diff 面恰 1 文件（useDailyBreakdown.ts）；:30 total 走 calcActualProfitByPolicy(o)；delivery-R1.md 场景 2 日结合计=-130 实证。

═══ 报哪 ═══
结论按 VERIFY-ONBOARDING 五步法第 5 步格式，报监理窗口；通过=顺手销号刷新交接书，打回=写 return-R2.md 落本目录。
