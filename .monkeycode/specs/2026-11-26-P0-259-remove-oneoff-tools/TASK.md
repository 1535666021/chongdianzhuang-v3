# 《施工队 · 任务书》P0-259

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），每轮结束重读最新版，再按本任务书施工。

## 目标
删除设置页中已确认一次性/不再使用的维护工具入口与对应功能。只删下列 5 个，触感反馈不是一次性工具，保留。

## 删除清单
设置页 `SettingsPage.tsx` 中：
- 9-10月旧账修正 / `PolicyFixTool`
- 出差扣点归0 / `TripFeeZeroTool`
- 漏保成本回填 / `BreakerCostBackfillTool`
- 利润一致性巡检 / `ProfitAuditTool`
- 幽灵补助纠正 / `GhostTripFixTool`

## 实现要求
A. 删除上述 5 个菜单项、import、id 类型、子面板 render 分支；保留 `haptics` 触感反馈行内开关。
B. 删除对应组件文件；删除组件专属且确认无其他引用的私有工具函数。公共计算/订单 store/成本绑定函数禁删。
C. 删除后全局搜索确认无残留 import/路由/文案；设置页不出现这 5 项。
D. 禁删恢复出厂设置、工资计算器、253 系列未完成工具、P0-257 对账相关入口（如已存在）。

## 验收
1) 设置页截图/代码检查：5 个一次性工具入口消失，触感反馈仍在。
2) `npm run build` 通过，无残留引用。
3) 交付分支 `task/P0-259-remove-oneoff-tools`；核验窗口合并。
4) delivery.md 附删除文件清单与全局搜索截图/输出。

施工队自行部署
监理窗口 · 签发完毕
