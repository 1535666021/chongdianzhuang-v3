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

