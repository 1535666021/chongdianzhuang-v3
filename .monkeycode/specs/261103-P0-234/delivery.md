《施工队 · 状态快照》
编号：P0-234　日期：2026-11-03　施工队窗口

═══ 改动清单（1 新建 + 1 删除 + 2 修改）═══
新建 src/shared/components/ReleaseNotesBanner.tsx（83 行，零依赖）：顶部横幅、顶部圆角、
蓝色左侧色条、阴影轻浮层；滑入 0.3s；✕ 关闭与 4 秒自动滑出双路径记已读（SEEN_KEY 写回
当前条数）；点横幅本体（非 ✕）拉起明细层列本次新增全部条目（用户主动点开允许覆盖）；
明细层"知道了"/点遮罩关闭且记已读。非遮罩：下方页面正常滚动点击。
删 src/shared/components/ReleaseNotesDialog.tsx（P0-233 弹窗，断操作不合口径，整删）。
src/App.tsx：import 与挂载换横幅（ToastContainer 后原位，行为体仅组件引用替换）。
src/constants/releaseNotes.ts：头部追加'更新通知改顶部横幅，不挡操作'（现 12 条）。

═══ 实证 ═══
P0-233 已读机制与'我的页'更新记录入口不受影响（仍走同一 SEEN_KEY 与数组，本页零改动）；
ReleaseNotesDialog 引用全仓零残留；启动链/解析/样本零触碰。
回归：19/19 ALL GREEN；build：rc=0（tsc 0 错误+双 build-check 过）。
