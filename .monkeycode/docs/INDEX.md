# 充电桩订单管理 V3 文档

本项目是面向充电桩安装业务的本地优先 React 应用。文档覆盖模块边界、订单数据、财务汇总和开发验证流程。

## 核心文档

- [架构](./ARCHITECTURE.md)：应用结构、数据流和业务模块。
- [接口](./INTERFACES.md)：核心类型、Store 与共享计算函数。
- [开发者指南](./DEVELOPER_GUIDE.md)：构建、检查与代码约定。

## 核心概念

- [订单](./专有概念/订单.md)：订单生命周期、业务日期和完成快照。
- [财务对账](./专有概念/财务对账.md)：月度归集和财务字段定义。

## 模块

| 模块 | 职责 |
|---|---|
| `src/features/order/` | 订单录入、勘测、预约、完工和展示 |
| `src/features/batchParser/` | 文本订单批量解析和重复识别 |
| `src/features/material/` | 物料、库存、成本映射和使用频率 |
| `src/features/statistics/` | 月度统计、平台拆分与对账导出 |
| `src/features/finance/` | 已完成订单的对账、回款和成本明细 |
| `src/shared/` | 共享组件、存储抽象、Hooks 与计算工具 |
