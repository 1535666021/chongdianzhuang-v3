# 《施工队 · 任务书》P0-256
> 状态：复验打回（2026-11-26 15:22）。原因：main 当前仍含 `isCable36` 强制置顶且频率统计跳过 `isFreeQuotaMaterial`，线上仍按旧顺序；施工队必须补 branch/commit/delivery/部署实证，核验窗复验后才算完成。



施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），每轮结束重读最新版，再按本任务书施工。

## 问题
勘测记录/选择辅材仍看似按比亚迪底表排序。甲方确认：必须按**全部已完成订单**中的辅材使用频率排序，频率越高越靠前；不按比亚迪、不按 3*6 置顶。

## 根因（已实证）
- `src/features/order/components/MaterialPicker.tsx` 已接 `getMaterialFrequency/sortMaterialsByFrequency`，所以问题不在入口。
- `src/features/material/hooks/useMaterialFrequency.ts` 的 `sortMaterialsByFrequency()` 有隐藏规则：材料名含 `3*6 / 3×6 / 3x6 / 3X6` 直接 `return -1` 置顶，导致截图里 `3*6升3*16`、`3*6升3*10`、`安装服务套包...3*6`、`套包外...3*6` 全部压到前面，频率失效。
- 同文件 `initMaterialFrequency/updateMaterialFrequency` 跳过 `isFreeQuotaMaterial`，电缆/YJV/PVC 等大量辅材不计数，频率为 0。

## 实现要求
A. 删除 `sortMaterialsByFrequency()` 中的 `isCable36` 强制置顶分支；任何规格词不得优先于频率。
B. 频率统计范围改为全部已完成订单里的辅材/增项材料，按全局品牌统计，不按当前品牌过滤；至少不得再排除 `isFreeQuotaMaterial` 导致电缆类恒 0。
C. 排序规则：频率降序；同频率按名称稳定排序或原表顺序；频率缓存缺失/为空时先基于已完成订单重算一次再排序。
D. 只改频率统计与排序，不动 P0-251 的 30m 抵扣、P0-255 的品牌客户价表、成本绑定、统计口径。
E. 交付分支：`task/P0-256-frequency-sort`；核验窗口合并/部署，施工队不直推 main。

## 验收
1) 脱敏假数据：构造 3*6 低频材料与 5*10 高频材料，高频必须排在 3*6 前。
2) 搜索前后都按频率降序，不能只排第一页。
3) 比亚迪/五菱/吉利订单进入同一候选时，顺序只由全局频率决定，不按品牌分区。
4) 老缓存升级后无需清空 localStorage 也能重算。
5) npm run build 通过；交付 `.monkeycode/specs/2026-11-26-P0-256-frequency-sort/delivery.md`，附自查清单。

施工队自行部署
监理窗口 · 签发完毕
