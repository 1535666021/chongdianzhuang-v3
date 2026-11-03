《施工队 · 任务书》

编号：P0-234　日期：2026-11-03　监理窗口签发

开工前必读：.monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，环境上下文统一读 .monkeycode/CONTEXT.md（不重复抄写）。

═══ 基线 ═══
代码 HEAD=a24e0e8（P0-233 已销号，在途无前置）。
实证锚点（已逐字核对）：
- src/App.tsx:18 `import ReleaseNotesDialog from '@/shared/components/ReleaseNotesDialog' // P0-233：更新弹窗`；:125-126 `{/* P0-233：更新弹窗（已读条数比对，增量提示） */}` + `<ReleaseNotesDialog />`（ToastContainer 之后）。
- src/constants/releaseNotes.ts 现 11 条，头部第一条='已完成列表卡片显示完工时间'。
- src/shared/components/ReleaseNotesDialog.tsx（47 行，将整删）。

═══ 需求 ═══
P0-233 的更新通知是阻断式全屏弹窗，甲方裁定形态不合理：每次清缓存/换设备首启都被迫先吃弹窗才能进 app。改为**顶部滑下非遮罩横幅**，通知必达、不挡操作。

═══ 改动清单 ═══
1. **删** src/shared/components/ReleaseNotesDialog.tsx（整删，含零引用残留检查）。
2. **新建** src/shared/components/ReleaseNotesBanner.tsx，要求：
   - 已读条数机制原样保留：SEEN_KEY='cdz_release_notes_seen'，仅当 RELEASE_NOTES.length > 已读条数时渲染，否则返回 null。
   - 横幅形态：顶部 fixed（top:0，左右贴边，高约48px），**非遮罩**，下方页面可正常滚动点击；白底卡片样式（圆角、轻阴影），左侧主色竖条，内容="已更新：{RELEASE_NOTES[0]}"（只显示最新一条，超长省略号截断），右侧 ✕ 关闭钮。
   - 滑入动画（CSS transform transition，挂载即滑入）。
   - 两条记已读路径，均写回 localStorage 当前条数并卸载横幅：① 点 ✕；② 挂载 4 秒后自动滑出（setTimeout 清理）。
   - 点横幅本体（非 ✕）→ 拉起明细层：半屏白卡列本次新增全部条目（新→旧，即 RELEASE_NOTES.slice(0, length-已读条数)），底部"知道了"按钮，点它/遮罩均记已读关闭。此层为用户主动点开，允许覆盖页面。
   - 禁：全屏阻断遮罩、禁反复弹（机制不变）。
3. **改** src/App.tsx：:18 import 与 :125-126 注释+挂载换成 ReleaseNotesBanner（位置不动，注释改为 P0-234）。
4. **改** src/constants/releaseNotes.ts：头部追加一条 '更新通知改顶部横幅，不挡操作'（共 12 条，旧 11 条逐字不动）。
5. MinePage.tsx 不动（更新记录历史页保留原样）。

═══ 验收 ═══
1. 清缓存首启（已读<条数）：顶部横幅滑入，下方列表可正常点击滚动，无遮罩。
2. 不点它 4 秒后自动滑走；重启 app 不再出现（已读已写回）。
3. 点 ✕ 同效记已读；重启不弹。
4. 点横幅→明细层列出全部新增条目（新→旧），"知道了"/点遮罩关闭且记已读。
5. releaseNotes.ts 恰 12 条，新增在头，旧条逐字未动。
6. grep -r "ReleaseNotesDialog" src/ 零命中。
7. tsc 0 错误 + npm run build 过。
8. diff 范围限：删 1（ReleaseNotesDialog.tsx）+新建 1（ReleaseNotesBanner.tsx）+改 2（App.tsx、releaseNotes.ts）；回归样本文件 parserRegressionSamples.ts 零差异。

═══ 交付 ═══
push 后写 .monkeycode/specs/261103-P0-234/delivery.md（状态快照格式），会话只报一行指针。
