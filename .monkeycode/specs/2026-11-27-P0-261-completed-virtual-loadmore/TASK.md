# 《施工队 · 任务书》P0-261

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），每轮结束重读最新版，再按本任务书施工。

## 问题
已完成订单超过虚拟阈值后，列表同时启用“虚拟滚动 + 加载更多分页”，导致：点加载更多不能正常展示；全部加载后刷新又回到 50 条并再次出现加载更多。

## 根因（已实证）
`OrderList.tsx`：
- `displayOrders = (...).slice(0, showCount)` 在虚拟模式下仍只截前 50；
- `virtualEnabled = orders.length > VIRTUAL_THRESHOLD` 时本应交给虚拟滚动渲染全量过滤结果；
- 分页按钮仍按 `orders.length > showCount` 显示。
即：虚拟滚动与 showCount 分页冲突。

## 修法
A. 计算 `virtualEnabled` 后，`displayOrders` 在虚拟模式下不再 `slice(0, showCount)`，直接使用公司过滤后的完整 `orders`；非虚拟模式保留原 showCount 分页。
B. `加载更多` 按钮仅在非虚拟模式渲染；虚拟模式不出现“加载更多/剩余 N 条”。
C. 滚动记忆/分组/筛选逻辑不动；已完成页公司过滤仍为唯一出口。
D. 验收重点：脱敏构造 165 条已完成单，进入已完成页应直接可滚动浏览全量，无加载更多按钮，刷新后仍可直接浏览全量；DOM 节点仍受虚拟滚动窗口约束。

## 交付
分支 `task/P0-261-completed-virtual-loadmore`；核验窗合并；delivery.md 附 165 条用例、刷新前后录屏/截图、DOM 节点数自查。

施工队自行部署
监理窗口 · 签发完毕
