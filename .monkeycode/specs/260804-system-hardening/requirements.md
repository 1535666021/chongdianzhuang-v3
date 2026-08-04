# 系统硬编码清理与优化需求

## Introduction

集中管理订单平台、品牌和功率配置，并减少订单卡片重复渲染与样式硬编码。

## Glossary

- **显示标签**：订单卡片、统计页和水印中面向用户显示的平台、品牌或功率文本。
- **配置词表**：`src/constants` 中定义的可识别平台、品牌和功率值。

## Requirements

### Requirement 1

**User Story:** AS 安装人员, I want 平台、品牌和功率使用统一配置, so that 新增识别项只维护一个位置。

#### Acceptance Criteria

1. WHEN 批量解析订单文本, 系统 SHALL 使用 constants 中的平台与品牌词表识别字段。
2. WHEN 订单卡片显示平台、品牌或功率, 系统 SHALL 使用对应标签函数生成显示文本。
3. WHEN 用户复制订单水印, 系统 SHALL 使用与平台标签相同的平台显示文本。

### Requirement 2

**User Story:** AS 财务人员, I want 统计页面明确分类数据状态, so that 分类指标含义清晰。

#### Acceptance Criteria

1. WHILE 订单缺少安装、维修与勘测分类数据, 系统 SHALL 显示“待数据支撑”占位文本。
2. 系统 SHALL 在财务对账汇总中展示订单数、增项费用、服务费、客户应付、平台扣点、实际到账、材料成本与实际利润。

### Requirement 3

**User Story:** AS 维护人员, I want 订单卡片使用可复用标签组件和设计令牌, so that 卡片代码与样式易于维护。

#### Acceptance Criteria

1. 系统 SHALL 将订单卡片标签渲染放入独立组件。
2. 系统 SHALL 在 OrderCard.css 中使用全局 CSS 颜色变量。
3. 系统 SHALL 保持 OrderCard.tsx 文件行数小于 350 行。
