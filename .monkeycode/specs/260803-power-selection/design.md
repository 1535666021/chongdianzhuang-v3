# 功率人工选择

Feature Name: power-selection
Updated: 2026-08-03

## Description

在订单卡片的功率位置为异常历史订单提供下拉选择，选择后立即写入现有订单存储。

## Architecture

`OrderCard` 读取 `Order.powerKw`，空值时渲染选择控件；选择事件通过 `useOrderStore.updateOrder` 持久化功率数值。

## Components and Interfaces

- `OrderCard`：渲染功率标签或功率选择控件。
- `OrderStore.updateOrder(id, { powerKw })`：更新订单并同步 localStorage。

## Data Models

`Order.powerKw` 继续使用数值字符串，例如 `3.5`、`7`、`11`、`22`。

## Correctness Properties

- 卡片显示的功率单位固定为一次 `kW`。
- 选择操作仅更新目标订单的 `powerKw` 与更新时间。

## Error Handling

订单不存在时，Zustand 更新操作保持当前订单集合。

## Test Strategy

- 验证空功率订单显示四个选项。
- 验证选择 7kW 后卡片显示 7kW。
- 验证已有功率订单继续显示标准标签。

## References

[^1]: `src/features/order/components/OrderCard.tsx`
[^2]: `src/stores/orderStore.ts`
