# 功率人工选择需求

## Introduction

为缺少可确认功率来源的历史订单提供人工选择入口。

## Glossary

- **异常功率订单**：`powerKw` 为空的历史订单。
- **功率选项**：3.5kW、7kW、11kW、22kW。

## Requirements

### Requirement 1

**User Story:** AS 安装人员, I want 为异常功率订单选择功率, so that 订单卡片显示准确功率。

#### Acceptance Criteria

1. WHEN 订单功率为空, 系统 SHALL 在订单标签行显示功率下拉选择。
2. WHEN 安装人员选择功率选项, 系统 SHALL 将对应数值保存到订单 `powerKw` 字段。
3. WHILE 订单功率有值, 系统 SHALL 显示标准功率标签。
4. 系统 SHALL 提供 3.5kW、7kW、11kW、22kW 四个功率选项。
