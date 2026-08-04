# 开发者指南

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run format
```

`npm run build` 依次执行构建前检查、TypeScript 类型检查、Vite 生产构建和构建产物检查。每次代码修改后需要以该命令完成验证。

## 代码组织

- 页面、组件、Hook、Repository 和类型优先放入所属 `features` 业务模块。
- 跨模块可复用逻辑放入 `shared`。
- 平台、品牌、功率、物料等稳定业务词表放入 `constants`。
- 新增金额或日期规则时，先检查 `src/shared/utils/orderCalc.ts` 是否已有统一入口。

## 质量要求

- 保持源码文件小于 400 行；纯数据文件可拆为分片并由稳定聚合入口导出。
- 完工订单的财务页面应读取完成时保存的金额快照。
- 复制操作应处理浏览器剪贴板权限失败并反馈用户。
- 运行 `npm run build` 后出现 0 个错误才可提交。

## 提交流程

提交前检查工作区状态、变更差异和近期提交历史。提交后根据项目协作规则提供本轮 GitHub token 完成推送；令牌只用于本次推送，且不写入项目文件。
