《核验窗 · 核验任务书》

编号：P0-236-V　签发：监理窗口　日期：2026-11-03　状态：**施工队已交付，核验进行中**（新 HEAD 已补，按本单开工）

═══ 验哪 ═══
- 仓库：1535666021/chongdianzhuang-v3
- 被验单：P0-236（specs/261103-P0-236/task.md = 施工任务书原件，验收标准以它为准）
- 交付快照：specs/261103-P0-236/delivery.md（施工队已交付，含举证清单）
- 基线 SHA：3019fe4　新 HEAD：**1a67eb9**（施工队交付 commit，已补填）

═══ 验什么（对照 P0-236 任务书验收条款）═══
1. 跑：GH_TOKEN=... bash .monkeycode/verify.sh 3019fe4 1a67eb9 order.actualProfit——diff 面必须恰 4 文件：OrderDetail.tsx / MonthDetailSections.tsx / PlatformBreakdown.tsx / releaseNotes.ts，不符=打回；
2. grep 实证：除 useCompletion（useCompletion.ts:136/:353 写入侧）与 OrderDetail 出差纠正段外，显示/筛选/排序/聚合位读存值 actualProfit 零残留；
3. 抽验：上述 3 个改动文件逐行核——显示/筛选/排序/聚合均传整个 order 给 calcActualProfitByPolicy（禁只改显示漏改筛选）；
4. 对拍 delivery 举证清单（抽查 1/3 起）；
5. releaseNotes 恰 13 条，新增在头；
6. 回归样本零差异（verify.sh 第⑤步自动给）。

═══ 报哪 ═══
结论按 VERIFY-ONBOARDING 五步法第 5 步格式，报监理窗口；通过=顺手销号刷新交接书，打回=写 return-R1.md 落本目录。
