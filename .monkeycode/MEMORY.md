# 用户指令记忆

本文件记录了用户的指令、偏好和教导，用于在未来的交互中提供参考。

## 格式

### 用户指令条目
用户指令条目应遵循以下格式：

[用户指令摘要]
- Date: [YYYY-MM-DD]
- Context: [提及的场景或时间]
- Instructions:
  - [用户教导或指示的内容，逐行描述]

### 项目知识条目
Agent 在任务执行过程中发现的条目应遵循以下格式：

[项目知识摘要]
- Date: [YYYY-MM-DD]
- Context: Agent 在执行 [具体任务描述] 时发现
- Category: [运维部署|构建方法|测试方法|排错调试|工作流协作|环境配置]
- Instructions:
  - [具体的知识点，逐行描述]

## 去重策略
- 添加新条目前，检查是否存在相似或相同的指令
- 若发现重复，跳过新条目或与已有条目合并
- 合并时，更新上下文或日期信息
- 这有助于避免冗余条目，保持记忆文件整洁

## 条目

### Git Push 流程
- Date: 2026-07-28
- Context: GitHub credential helper 始终返回 500，每次提交后需用户提供 token 推送
- Instructions:
  - 所有 commit 完成后，在状态快照中展示待推送的 commit 列表并主动索要 GitHub token
  - 不等待用户先提供 token，主动在任务收尾阶段询问
  - token 用后即焚，不存储

### Build 要求
- Date: 2026-07-28
- Context: 每次代码修改完成后必须验证
- Instructions:
  - 每次代码改动后必须运行 `npm run build`（tsc --noEmit + vite build + build-check.cjs）
  - 0 错误才算通过

### V3 架构目录锁定
- Date: 2026-07-28
- Context: 项目执行严格的 features/ 模块化架构，每次新建或修改代码前必须对照
- Instructions:
  - 新增模块必须按 `src/features/xxx/` 模式扩展（含 types/repository/hooks/components/pages 子目录）
  - 禁止随意变更目录层级
  - v3 架构优先于老系统 `src/lib` 分层约定
  - 目录结构：
    ```
    src/
    ├── assets/              ← 静态资源
    ├── constants/           ← 常量枚举
    ├── types/               ← 实体类型
    ├── shared/
    │   ├── components/      ← 共享组件
    │   ├── hooks/           ← 共享Hooks
    │   ├── utils/           ← 共享工具
    │   └── storage/         ← 存储抽象
    ├── stores/              ← Zustand分模块
    ├── features/            ← 业务模块
    │   ├── order/
    │   ├── batchParser/
    │   ├── material/
    │   ├── statistics/
    │   ├── finance/
    │   └── settings/
    ├── routes/              ← 懒加载路由
    ├── App.tsx
    └── main.tsx
    ```

### 完工书
- Date: 2026-07-28
- Context: 用户要求每次任务完成后输出标准化的完工书
- Instructions:
  - 每个任务完成并推送后，必须输出标准「完工书」
  - 格式包含：任务编号、任务名称、涉及文件、自检结果（tsc/build）、commit 列表
  - 示例格式：
    ```text
    ═══════════════════════════════════════════════════
    《施工队窗口 · 完工书》
    ═══════════════════════════════════════════════════
    任务编号：P0-XXX
    任务名称：XXX
    涉及文件：XXX
    自检结果：tsc 0错误 / vite build 通过
    提交记录：
      abc1234 fix: XXX
      def5678 fix: XXX
    推送状态：已推送 main
    ═══════════════════════════════════════════════════
    ```
