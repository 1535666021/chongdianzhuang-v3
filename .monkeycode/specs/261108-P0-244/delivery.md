# P0-244 交付（品牌辅材可增删改·自定义覆盖层）

## 基线与载荷
- 基线：main 8e24e3a（签发笔）
- 载荷 4 文件（1 新+3 改）：src/shared/storage/brandAddonOverrides.ts（新）、useSurvey.ts、SurveyModal.tsx、releaseNotes.ts
- 禁区实证：orderCalc/materialData/parser/parserRegressionSamples 四文件 vs 基线逐字 ZERO（回归 20 条零改动、常量表零改动）

## 三件实证
1. **覆盖层存储**：brandAddonOverrides.ts——localStorage key=cdz_brand_addon_overrides_v1，按品牌 {added, priceOverrides, hidden}；三操作 addBrandAddonMaterial/setBrandAddonPrice/hideBrandAddonMaterial；**唯一合并点 getBrandAddonsWithOverrides(brand, base)**=hidden 过滤→priceOverrides 套价→added 追加；brand 空直通零扰动
2. **全链唯一消费源**：useSurvey.mergedAddonCatalog（全集 catalog=合并点）→isCableMat L68/calcCableCost L87 两 find 换 merged；brandAddons 出口前过合并点（deps+ovVersion）；return 加 addonCatalog+refreshBrandOverrides；ovVersion bump 联动 fullCost/totalEstimatedCost/brandAddons 全链重算。SurveyModal 解构三新出口；L66/L119/L123 三处 addonMaterialsData.find 换 addonCatalog（含新增项/改价）
3. **弹窗管理入口**：辅材区顶部「➕ 添加辅材」钮+表单（名称/单位/结算价+正数校验+**同名校验**=与 addonCatalog 查重，重复 toast 拒）+「管理辅材改价/删除（N）」列表（行内改价照 CardDoneDateRow 样板：✓/✗；删除=hideBrandAddonMaterial 本品牌不再显示，基础表与新增项一致）；每操作后 refreshBrandOverrides() 全链重算

## 统一铁规矩自查
- 零改常量：materialData.ts vs 基线 ZERO（runner T5 双证：本地 filter 对象仍含被删项+常量价未动）
- orderCalc.ts 零改动：vs 基线 ZERO（新价生效靠 calcCableCost 读合并 catalog 既有查表口径，非改出口）
- 已存订单零重算：estimatedMaterials 存 unitPrice 快照（既有口径），改价不溯及已选行；新选/超米费实时生效
- 空品牌直通：getBrandAddonsWithOverrides(null/undefined)=base 原引用（runner T1 三断言）
- BottomSheetSelect/AddMaterialsSheet 零改动（选项源=merged brandAddons，复选窗口天然含新增项）

## runner 汇总（脱敏假数据：比亚迪 33 条基础表）
9 断言：空品牌直通×2/干净品牌直通/添加进合并点（length+1）/改价生效（基础表同名 999）/删新增项/删基础表项/常量表零污染双证——**FAILS=0**；tsc 0+vite build+[BUILD CHECK] 前置/后置全过

## 备注
- 管理列表上限 maxHeight 200px 滚动，N 大不撑爆弹窗
- 改价后：弹窗内选=新价快照（toggle 时 unitPrice=settlementPrice）/超米费实时生效（calcCableCost 读 merged）/完工核算价同表同源（storedMaterials 快照+名字查表既有口径）
