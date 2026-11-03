《施工队 · 状态快照》
编号：P0-231　日期：2026-11-03　施工队窗口

═══ 改动清单（唯一文件 OrderCard.tsx，单点最小 diff）═══
小字区（290-296 行）由纯"导入 MM/DD"改为条件两段：
· 已完成（复用 45 行 isCompleted 判定）且 actualInstallDate 非空 →
  "完工 MM/DD · 导入 MM/DD"（同一 div 内追加，不新增行）；
· actualInstallDate 为空 → 无完工段无分隔符，退化为原样"导入 MM/DD"；
· 非已完成状态（已预约/回收站等）→ 条件短路，渲染输出与改动前逐字节一致。
取值：order.actualInstallDate 原样字符串 slice(5,7)/slice(8,10) 得 MM/DD；
禁走 resolveDoneDate，禁回退 completeDate/createdAt（书规）。
样式与导入小字完全一致：fontSize 11、color #9ca3af、marginTop 4。

═══ 禁改清单核对 ═══
写入侧（useCompletion/orderStore）、排序分组统计（useOrderList/OrderFilterBar/orderCalc）、
既有展示位（MonthDetailSections/DupQuarantinePage/seedOrders）、回归样本 19 条——全部零触碰，
git diff 仅 OrderCard.tsx 一个文件。

═══ 验证 ═══
回归：19/19 ALL GREEN；build：rc=0（tsc 0 错误+双 build-check 过）。
书基线 0bc15da 行号 290-292 与 HEAD 实证一致（其间 .monkeycode 交接书提交未动 src）。
