# 《施工队 · 交付书》P0-268 首页总数与区域下钻

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-268-home-total-region（基线=main 现 HEAD，含 265 三笔修正；核验窗合并/部署）
- 交付引用：.monkeycode/specs/2026-11-28-P0-268-home-total-region/TASK.md

## 载荷（7 文件）
| 文件 | 动作 |
| --- | --- |
| OrderFilterBar/useTagCounts.ts | 新增 baseCount（基集合=标签筛选五要素外的去重订单数，与 tags 同 memo 源） |
| OrderFilterBar/OrderFilterBar.tsx | TagCloud 传 total={baseCount} |
| OrderFilterBar/TagCloud.tsx | 删 `tags.reduce` 求和；全部（N）改用 total props——一单一多标签不再虚增 |
| regionTreeModel.ts | 去省级：市→区县→乡镇三级聚合计数（乡镇解析依赖 extractAreaChain 中文镇名规则） |
| RegionTree.tsx | 三态下钻重写：市 chips → 点市显市总数+按区县分组列订单（单号·姓名·电话）→ 点区县显区县总数+按乡镇分组列订单；计数树聚合天然去重；最细到乡镇 |
| releaseNotes.ts / 本书 | — |

## 自查实证（对应 268 验收逐条）
1. 全部（N)=基集合去重长度：TagCloud 全仓唯一求和点已删（grep 实证），N 走 baseCount props
2. 多标签订单不虚增：baseCount=filterOrders 去重长度，与 tag.count 加总解耦（代码面）
3. 树下钻语义：runner 8 断言 FAILS=0——去省一级=市/下钻区县/最细乡镇（中文镇名）/路径过滤 3-2-1/未知区域特判/空路径全过
4. 订单计数去重：树聚合按单计数（一单一路径），分组列表取 ordersOf(path) 同源自滤
5. 展示：市视图/区县视图/乡镇视图三态 + 返回上级；订单行=单号·姓名·电话
6. build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`

## 复验指引（脱敏冒烟）
- 首页标签行：全部（N) 与基集合单数一致（注入一单挂两标签，N 只 +1）
- 区域树：市 chips 点安庆市 → 区县分组列单；点怀宁县 → 乡镇分组列单；地址含省不影响（省不参与层级）

## 教训/避坑
- extractAreaChain 乡镇级只认中文镇/乡/街道名（stripNonHanEdges 剥非汉字边缘）——runner 假数据须用真中文地名（本单两轮 FAIL 均测试地名不写实，代码零改）
