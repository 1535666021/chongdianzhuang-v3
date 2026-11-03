《施工队 · 状态快照》
编号：P0-232　日期：2026-11-03　施工队窗口

═══ 改动清单（2 文件删除 + App.tsx 少 2 行）═══
删 src/shared/components/OnboardingGuide.tsx（50 行，四步引导数据+SEEN_KEY 全删）；
删 src/shared/components/OnboardingGuide.css（.onboarding-* 七个类孤儿样式全删）；
src/App.tsx：17 行 import 删、127 行 <OnboardingGuide /> 挂载删，其余字节零动
（启动维护链/路由/其他挂载未碰）。
localStorage 已读标记残留按书规不清理。

═══ 实证 ═══
删前全量 grep（ts/tsx/css）：引用仅 4 处=2 文件自身 + App.tsx import/挂载，行号 17/127 与书实证一致；
删后 grep "OnboardingGuide"/"onboarding" 零残留（书验收 1 达成）。
回归：19/19 ALL GREEN；build：rc=0（tsc 0 错误+双 build-check 过）。
禁改清单核对：解析/样本 19 条零动，无新增替代引导。
