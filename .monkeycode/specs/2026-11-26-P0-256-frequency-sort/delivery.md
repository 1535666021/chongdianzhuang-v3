# 《施工队 · 交付书》P0-256 材料使用频率修复

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-256-frequency-sort（本分支基线=main 当前 HEAD；核验窗合并/部署，施工队不直推 main）
- 范围：只做 frequency 计算链三修（任务书铁令：root cause 不在录入组件入口，禁在录入侧打补丁）

## 根因与修法
| 功能点 | 根因 | 修法 |
| --- | --- | --- |
| A 入频去跳过 | init/update 两处 `if (isFreeQuotaMaterial(m.name)) continue` 把 30m 免配额线材等高频辅材排除在频率外 | 删两处跳过（useMaterialFrequency.ts L49/L68 区域），删 orderCalc 导入；`isFreeQuotaMaterial` 在 orderCalc L172/L237/L365 及 useCompletion/usePackageMeters/MaterialPicker 计费链**零改动**（grep 实证），P0-251 30m 抵扣不受影响 |
| B 全品牌统计 | 频率模型本就全局按 name 统计（MaterialFrequency 无品牌维度），无当前品牌过滤 | 无需改码；runner 双断言实证（无品牌维度/仅非当前品牌使用的材料同样入频） |
| C 空缓存懒重算 | 排序时若 localStorage 频率键缺失/为空，全部按 0 频排序 | `sortMaterialsByFrequency` 第二参改可选；空且已注册 provider 时 `initMaterialFrequency(ordersProvider())` 重算再排；provider 由 orderStore 在 `initMaterialFrequency(merged)` 后注册（`registerFrequencyOrdersProvider(() => merged)`），**规避 orderStore↔hook 循环依赖** |

## 载荷（3 文件，对 main diff +21-6 行）
- src/features/material/hooks/useMaterialFrequency.ts（三修主体）
- src/stores/orderStore.ts（导入并注册 provider，2 行）
- src/constants/releaseNotes.ts（头部 1 条）

## 自查实证清单
1. 30m 线材进入频率：runner `30m 免配额线材入频（跨品牌 2 单计 2）PASS`（修复前为 0）
2. 全部已完成订单的辅材/增项材料按全局品牌统计：runner 四连 PASS（普通入频/仅已完成/无品牌维度/仅非当前品牌材料入频）
3. 频率缓存缺失/为空先重算再排序：runner `C 空缓存懒重算后按频率降序 PASS`+`懒重算已持久化 PASS`+`显式传频率不触发重算 PASS`（不重复计数）
4. 打频率标记在录入侧禁改：本次 diff 零录入组件文件（git diff --stat 实证 3 文件全在 frequency 链+releaseNotes）
5. 持久化/幂等/回归：显式传频率不触发重算 PASS；`3*6` 特殊名优先级规则回归 PASS；update 未完成跳过 PASS
6. build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`（esbuild runner 11 断言 FAILS=0，bundle 直跑零 store 依赖零 shim）

## 复验指引
- 渲染入口：不涉 UI 新组件；行为面=MaterialPicker/AddMaterialsSheet/SurveyModal 三处 `sortMaterialsByFrequency(materials, getMaterialFrequency())` 调用自动获益（第二参改可选，旧调用兼容）
- 关键行：useMaterialFrequency.ts（两处去跳过注释 P0-256-A / provider 注册 / sort 空缓存分支 P0-256-C）；orderStore.ts（registerFrequencyOrdersProvider 调用行）
- 功能冒烟：老数据机上打开材料选择页→空缓存懒重算触发→30m 线材按真实使用频率排前；新增一单含 30m 线材并完成→update 入频生效

## 教训/避坑
- runner 断言失败先疑测试自身：本轮两 FAIL 均测试编排错（接口无 brand 字段/init 会重置缓存），代码零改动即转绿——断言前须先读被测接口真实形状
- orderStore↔useMaterialFrequency 若直接互相 import 会构成 ESM 循环（store 构造即调 init），provider 注册模式解耦
