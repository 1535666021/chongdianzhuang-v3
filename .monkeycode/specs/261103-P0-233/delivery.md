《施工队 · 状态快照》
编号：P0-233　日期：2026-11-03　施工队窗口

═══ 改动清单（1 新建 + 3 修改，全部最小 diff）═══
新建 src/shared/components/ReleaseNotesDialog.tsx（47 行，零依赖）：启动比对
localStorage cdz_release_notes_seen 已读条数，有新增则列新增条目（新→旧）；
"知道了"或点遮罩=已知并写回当前条数，此后启动不弹直到数组新增；禁自动反复弹、禁阻断。
src/App.tsx：18 行 import + ToastContainer 后挂载（P0-146 孤儿注释连行删除）。
src/features/settings/pages/MinePage.tsx：菜单加"更新记录"（path=null 弹层不走路由），
弹层列全部 RELEASE_NOTES（新在上），点遮罩/关闭键退出。
src/constants/releaseNotes.ts：头部补登两条（11-03 本任务上一条=已完成卡片完工时间、
再上一条=删除新手引导弹窗），旧九条逐字不动。

═══ 实证 ═══
书基线 1a2857f 行号与 HEAD 实证一致；onboarding 零残留保持（P0-232 未回潮）；
RELEASE_NOTES 11 条。回归：19/19 ALL GREEN；build：rc=0（tsc 0 错误+双 build-check 过）。
（注：本件交付前 /tmp 工作区被环境清理，重建后按同锚点重放全部 patch 并复验通过。）
