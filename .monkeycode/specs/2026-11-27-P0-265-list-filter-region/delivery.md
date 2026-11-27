# 《施工队 · 交付书》P0-265 合并订单筛选/计数/区域树

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-265-list-filter-region（基线=main 现 HEAD；核验窗合并/部署）
- 交付引用：.monkeycode/specs/2026-11-27-P0-265-list-filter-region/TASK.md

## 三件落地
| 项 | 落点 | 要点 |
| --- | --- | --- |
| A 默认全部+手动筛选+提示 | OrderList.tsx | `currentCompany` 改本地 useState（默认 'all'，**不读不写 cdz_current_company_v1**，会话态）；三 Tab 同口径 companyHit 过滤（all=不滤）；档位 chips（全部/本杨/到每家/未分公司）常驻筛条上方；非默认档琥珀横幅「当前仅显示已选公司·一键全部」 |
| B 计数同源+首页徽章 | OrderList.tsx + App.tsx | `companyOrders`=allOrders×companyHit memo **单一数据源**：OrderFilterBar orders 改传 companyOrders（筛选/计数/列表同源）；App badgeMap 增 `首页`=companyHit(currentCompany) 计数（统计页公司口径，不读列表页会话态） |
| C 区域层级树 | RegionTree.tsx + regionTreeModel.ts | 纯模型三件套（buildRegionTree 沿 extractAreaChain 省/市/区县/乡镇四级聚合计数；nodesAtPath 下钻 count 降序；matchRegionPath 路径过滤+**未知区域特判**）；组件逐级下钻 chips+计数，面包屑可回任意上级/收起=只显当前层级不强制展开整树；首页挂载（pathname='/'），选中路径叠加过滤列表 |

## 载荷（6 文件）
OrderList.tsx / RegionTree.tsx（新增）/ regionTreeModel.ts（新增）/ App.tsx / releaseNotes.ts / 本书

## 自查实证
1. 默认全部：companyHit('all')=true runner 实证；companyOrders 过滤后 ≤ allOrders
2. 手动筛选会话级：useState 不触 uiStore.setCompany（代码面）；横幅一键全部复位
3. 计数同源：companyOrders 单 memo 双消费（OrderFilterBar + 区域树数据源 + 列表）代码面
4. 首页徽章：badgeMap['首页'] 定义在 App，companyHit 口径 runner 实证
5. 区域树：runner 8 断言 FAILS=0（聚合根4/浙3/未知1、降序、逐级下钻、叶子收起=空数组、路径过滤 2/1、未知区域特判可点）
6. build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`
7. 边界：统计页公司筛选/P0-261 虚拟逻辑/P0-222 companyHit 语义零改动；旧 CompanyFilter 挂载点移除（防双筛选 UI）

## 复验指引（脱敏冒烟）
- 真机注入跨公司订单（Console setOrders）→ 三 Tab 默认全见；点「本杨」→ 横幅出现、列表/筛选计数同步缩；点「一键全部」复位
- 底部「首页」气泡数=统计页当前公司口径单数
- 首页区域树：点 浙江省→杭州市→西湖区 逐级缩列表；面包屑点回上级=父级收起；地址不可识别的单进「未知区域」组且可点

## 教训/避坑
- 「未知区域」是树内标签非地址子串——matchRegionPath 必须特判（首版设计缺陷 runner 揪出）
- 徽章与列表的 company 源分离是任务书明文口径（徽章=统计页 uiStore，列表=会话态），交付书写明防误解
