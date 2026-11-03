# CONTEXT.md — 项目环境上下文（固定不变，任务书不再重复此段）

- 仓库：github.com/1535666021/chongdianzhuang-v3（main 分支）
- 部署：1535666021.github.io/chongdianzhuang-v3/（推送 main 后部署 gh-pages，回拉核验）
- 构建：本地 `npm run build`（node build-check.cjs && tsc --noEmit && vite build && node build-check.cjs --check-dist），tsc 0 错误 + build-check 通过才允许推送
- 技术栈：React18 + TS strict + Vite + Zustand + React Router + PWA
- 目录：src 永久锁定（assets/constants/types/shared/stores/features/routes），计算唯一入口 src/shared/utils/orderCalc.ts
- 交付：specs/<日期-编号>/delivery.md（交付方式 v2），会话只报一行指针
- 数据红线：真实订单/客户数据禁止进仓库，开发测试一律脱敏假数据
