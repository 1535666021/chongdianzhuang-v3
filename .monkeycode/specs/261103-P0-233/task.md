# 《施工队 · 任务书》

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。环境上下文（仓库/构建/部署/技术栈）以 .monkeycode/CONTEXT.md 为准。

## 基线 HEAD
1a2857f（P0-232 销号顶；本书行号以此提交为基准，实证过）

## 任务编号
P0-233（本目录 specs/261103-P0-233/）

## 问题描述
甲方需求：每次更新后**首页弹出本次更新内容**（更新弹窗），且"我的"页可查看全部更新历史。

实现状（1a2857f 实证）：更新文案常量 `src/constants/releaseNotes.ts` 的 `RELEASE_NOTES: string[]` 一直在累积（现 9 条，施工队每书追加一行，新在头部），但**全库零消费点**——本任务=接通现有数据，新建弹窗组件+历史入口。

另：P0-231/P0-232 两单漏追加更新说明（PLAYBOOK §7 每书一行），本任务一并补登两条。

## 实现要求
1. **新建** `src/shared/components/ReleaseNotesDialog.tsx`（样式独立 css 或内联，仿仓库既有弹窗风格，白底简易卡片）：
   - 启动时读 localStorage `cdz_release_notes_seen`（已读条数，缺省 0）；`RELEASE_NOTES.length > 已读` → 弹窗，列出头部新增条目（新→旧）
   - 点"知道了"→ 写入当前 length → 关闭；此后启动不再弹，直到数组新增条目
   - 禁自动反复弹、禁阻断操作（可点遮罩关闭并视为已知）
2. **改** `src/App.tsx`：`:125-126` 行有孤儿注释 `{/* P0-146：新版本首次启动功能引导（按版本号一次） */}`（P0-232 删引导残留），删除该注释并在原位挂载 `<ReleaseNotesDialog />`（记得 import）
3. **改** `src/features/settings/pages/MinePage.tsx`（41 行，菜单数组见 :10 格式）：
   - 菜单数组加一项 `{ label: '更新记录', desc: '每次更新内容', Icon: 自选（如 Sparkles/History）, path: null }`
   - 点击不走路由，本页弹层列出**全部** RELEASE_NOTES（新在上），可关闭
   - 菜单现有项（材料领用/设置）渲染与跳转不受影响
4. **改** `src/constants/releaseNotes.ts`：头部补登两条（最新在前）：
   - `'已完成列表卡片显示完工时间'`（P0-231 漏登）
   - `'删除新手引导弹窗'`（P0-232 漏登）
   - 其余条目不动

## 禁改清单（超范围判返工）
- 不得恢复/新增任何新手引导（OnboardingGuide 已删，零残留须保持）
- 解析回归样本 19 条——不动
- 弹窗逻辑禁引入第三方库，手写轻量实现
- RELEASE_NOTES 既有 9 条文案不动（只加 2 条）

## 验收标准
1. 清缓存首启：弹窗显示头部新增条目（含本次补登两条）；"知道了"后重开不再弹
2. 向数组 mock 加一条再启动：再次弹窗且只列新增那条
3. "我的"页点"更新记录"：可见全部 11 条（新在上），现有菜单项功能无退化
4. `grep -rn "OnboardingGuide\|onboarding" src` 仍零残留
5. tsc 0 错误 + build-check 通过；git diff 仅 4 文件（1 新建 tsx[+css] + App.tsx + MinePage.tsx + releaseNotes.ts）
6. 回归 19/19（样本文件未动）

## 交付要求
- 交付写本目录 delivery.md，会话只报一行指针
- 单轮交付全链路一次性完成

施工队自行部署。

监理窗口 · 签发完毕