# P0-242 交付（智能分组地址胶囊行政层级化）

## 基线与载荷
- 基线：main fa18a56（代码同 c19516f，fa18a56 为纯文书笔）
- 载荷 5 文件：groupTags.ts（改）、useOrderList.ts（改）、OrderFilterBar/utils.ts（改）、OrderList.tsx（改）、releaseNotes.ts（改）
- diff 面核对：恰 5 src 文件，零超范围；orderCalc/parser/回归 20 条零改动

## 四件实证

1. **extractAreaChain 新立**（groupTags.ts）：省→市→区县→乡镇四级链；省市名剥除后提取+foldRepeats 同名折叠，「寿县安徽寿县」去重实证：C 地址（安徽省淮南市寿县安徽寿县寿春镇）→{安徽省，淮南市，寿县，寿春镇}；全 null 归 null=「其他」；正则前缀排「县/区」字防跨段吞同名
2. **胶囊层级化**（useOrderList.ts extractRegionTags）：一单计入链上各级=层级累计计数；排序=层级定序→同级单数降序→「其他」永远末位；3 单对拍：安徽省(3)/合肥市(2)/淮南市(1)/区县乡镇各(1) 全中
3. **点选=该级及下级全域**（useOrderList.ts L25）：matchAreaChain 链上任一级命中；点合肥市→2 单（含两区县）、点寿县→1 单、点其他仅解析不出单，runner 6 断言全过
4. **列表分组标题同步**（utils.ts areaGroupLabel + OrderList.tsx 传 filter.areaTag 含 useMemo 依赖）：点省按市分组/点市按区县/点区县按乡镇/点乡镇归自身；未点选按最细可用级（乡镇>区县>市>省），runner 4 断言全过

## 统一铁规矩自查
- extractAreaTag 旧导出零断链：改调新链取最细可用级（任务书验收5 允许），签名/导出不改；既有调用方 grep 仅 useTagCounts 注释提及（无功能调用被破）
- 回归 20/20 ALL GREEN（runner 内含）
- tsc 0 错 + vite build + [BUILD CHECK] 前置/后置全过
- 脱敏假数据（王某某/李某某/赵某某 + 13800000000-2）全程，真实订单零经手

## runner 汇总
18 项场景断言（T1 链提取 4 / T2 胶囊计数+定序 2 / T3 点选匹配 6 / T4 分组 4 / R extractAreaTag 2）+ 回归 20/20 = FAILS=0
