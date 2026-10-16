# 系统硬编码清理与优化

Feature Name: system-hardening
Updated: 2026-08-04

## Description

本设计通过 constants 统一业务词表与显示标签，通过独立订单标签组件缩小卡片职责，并使用 CSS 设计令牌消除卡片样式中的直接颜色值。

## Components and Interfaces

- `constants/platforms.ts`：平台别名映射、平台词表和 `getPlatformLabel`。
- `constants/brands.ts`：品牌词表和 `getBrandLabel`。
- `constants/power.ts`：功率选项和 `getPowerLabel`。
- `OrderCardTags`：展示平台、品牌、功率、套餐米数与安装类型。
- `calcOrderFinancials`：集中生成订单平台扣点和实际利润。

## Correctness Properties

- 平台标签和复制水印使用同一个规范化平台名称。
- 空平台、品牌或功率字段保持订单数据空值，显示层在需要时生成“未知”。
- 批量解析保留动态平台存储，并与常量平台词表共同参与平台选择。

## Error Handling

未知平台、品牌和功率保留原始文本，保证解析内容可见。

## Test Strategy

- 验证“西安领充”标签和水印文本一致。
- 验证空功率订单可选择常量功率选项。
- 运行 `npm run build` 验证 TypeScript 和生产构建。

## References

[^1]: `src/constants/platforms.ts`
[^2]: `src/constants/brands.ts`
[^3]: `src/constants/power.ts`
[^4]: `src/features/order/components/OrderCardTags.tsx`
