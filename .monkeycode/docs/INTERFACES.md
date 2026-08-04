# 核心接口

## Order

定义位置：`src/types/order.ts`

`Order` 是订单主实体，包含客户信息、订单状态、预约信息、勘测信息、材料及完成后的财务快照。

| 字段 | 说明 |
|---|---|
| `status` | 订单状态，用于筛选已完成订单 |
| `actualInstallDate` | 实际安装日期，月度业务归集的最高优先级日期 |
| `customerPrice` | 客户应收的订单金额 |
| `serviceFee` | 完工时保存的服务费快照 |
| `platformFee` | 完工时保存的平台扣点快照 |
| `materialCost` | 完工时保存的材料成本快照 |
| `actualProfit` | 完工时保存的实际利润快照 |

## 订单计算函数

定义位置：`src/shared/utils/orderCalc.ts`

| 函数 | 用途 |
|---|---|
| `calcOverFee` | 计算超套餐米数和费用 |
| `calcOrderFinancials` | 根据应收、成本、扣点比例和服务费计算扣点与利润 |
| `getOrderBusinessDate` | 按实际安装、预约、完成、创建日期顺序获取业务日期 |
| `getOrderServiceFee` | 优先读取订单服务费快照，兼容旧订单备注推断 |
| `getCompletedOrderFinancials` | 读取完成订单的统一财务快照 |

## Store 接口

### 订单 Store

定义位置：`src/stores/orderStore.ts`

订单 Store 提供订单查询、创建、更新、删除和完成操作。页面通过 selector 订阅所需状态，业务 Hook 负责组合表单、设置和库存操作。

### 设置 Store

定义位置：`src/stores/settingsStore.ts`

设置 Store 提供平台扣点比例、工程师信息及物料使用频率等配置。

## CSV 对账导出

定义位置：`src/shared/utils/exportExcel.ts`

`exportReconciliationCsv` 接收订单数组和月份，输出包含客户、平台、金额、材料成本、平台扣点、利润及业务日期的 UTF-8 CSV 文件。
