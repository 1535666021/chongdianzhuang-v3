《施工队 · 任务书》
编号：P0-230　日期：2026-11-03　签发：监理窗口

【先读 MEMORY.md → RULES.md → PLAYBOOK.md（R-0.7 影响半径/R-0.8 开工强制），再读本任务书全文。】

## 背景与甲方口径（2026-11-03 甲方裁定）
1. 现有"平台名含京东→自动归到每家"的写死规则去除，废除平台自动判公司。
2. 公司归属一律以订单显式 company 字段为准（P0-216 卡片胶囊人工点选，已完成冻结），以后每单自己选。
3. 存量已完成的京东老单一次性回填归位（甲方口径"订单归位"）：
   - 完成时间在 2026-10-01 ~ 2026-11-02（含首尾）→ company='daomei'（到每家）
   - 完成时间早于 2026-10-01 → company='benyang'（本杨）
   - 2026-11-03 及以后的新单不填，挂"未分"等用户自己选
4. 时间基准=完成时间，回退链用 orderCalc.ts 的 resolveDoneDate（actualInstallDate→completeDate→createdAt），不得自写。

## R1：去除京东自动归位规则（src/shared/utils/company.ts）
- 第 18 行 `if (/京东/.test(p)) return 'daomei'` → 改为 `return 'unassigned'`（京东与速家同路径：挂未分等人工选）。
- `isDaomeiOrder`（第 2-3 行）改为只认显式字段：`o.company === 'daomei'`，不再测平台名——显式字段是唯一真相，平台规则整体退役。
- 注释同步更新（P0-220"京东→到每家"口径作废说明）。

## R2：存量回填钩子（订单归位）
- 新函数归 repository.ts（如 backfillCompanyByDoneDate()），App.tsx 启动修复链 phases 挂载于 purgeLegacyAppointmentDates 之后。
- 处理条件：订单平台（platformName||platform）含"京东" 且 无显式 company 字段 且 status==='已完成'。
- 回填值按上表三段口径；完成时间取 resolveDoneDate 回退链。
- 幂等：已有 company 字段即跳过；零命中零写入。
- console.log 留痕回填单数。

## R3：影响半径全输出走查（R-0.7 强制）
company.ts 两出口的消费点全量走查一遍（不得跳读）：
- OrderComplete.tsx:35（完工页公司标签）、useCompletion.ts:227、useSurvey.ts:89、OrderCard.tsx:172、companyHit（统计/财务/对账过滤）、CompanyFilter/OrderList 公司档位
- 走查结论写进快照：每个消费点在新口径下的显示是否符合甲方口径（未分单显示"未分"胶囊可点选；已完成单冻结）。

## 验收门
- 回归 19/19 全绿 + build 过（rc=0）
- 快照含：完整 diff、R3 走查表、回填钩子口径复述
- 禁超范围：不动解析器、不动 P0-229 任何件、不改胶囊交互
- 单轮交付，直接 push main
