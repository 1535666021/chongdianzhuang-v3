# P0-241 交付（完工核算材料编辑态 · 四件）

基线：d6a4f46（main HEAD，含 P0-240 交付笔；任务书"基线=main 当前 HEAD"）　施工：施工队窗口　日期：2026-11-07

## 载荷（9 文件）
- 新增 src/features/order/components/AddMaterialsSheet.tsx（件2 添加材料半屏弹窗）
- 新增 src/features/settings/components/BindReconcilePanel.tsx（件3b 绑定对账）
- 修改 src/features/order/components/MaterialPicker.tsx（件1：漏保盒数量+删除/漏保器删除/行内改价/添加钮开弹窗；件2 挂载）
- 修改 src/features/order/hooks/useCompletion.ts（addMaterials 批量进单）
- 修改 src/features/order/pages/OrderComplete.tsx（onBatchAdd 接线）
- 修改 src/features/settings/pages/SettingsPage.tsx（绑定对账菜单项）
- 修改 src/features/material/components/UsageForm.tsx（件4 入库改价联动提示）
- 修改 src/shared/utils/costMaterialsResolver.ts（**覆盖层接通**，见下）
- 修改 src/constants/releaseNotes.ts（头插 1 条）

## 重大施工备注（必须核）
**接通 settingsStore 价覆盖层至 getAllCostMaterials**：诊断实证覆盖层（costPriceOverrides）此前写入后**零消费=死存储**，核算链（calcFullMaterialCost→findCostPrice→getAllCostMaterials=底表+custom）与匹配器（useCostMatcher）均不读覆盖层——即既有"设置页改价"对核算不生效。任务书验收 5「行内改价全局生效」要求核算链必须吃到，故在 resolver 出口统一应用覆盖层（map 替换 costPrice），orderCalc 零改动守住；全库所有成本读取方（核算/展示/匹配）自动生效。无循环依赖（settingsStore 不 import resolver，实证）。既有单无改价记录=无行为变化；有改价记录的单=首次真正生效（这正是验收 5 要的全局生效）。

## 自查实证清单（逐条对应任务书）
1. 验收1（件1 编辑态）：漏保盒"1个"硬编码→数量输入（0=本单没用）+删除钮（置 0）→ form.fixedAux.breakerCount=0 → buildMaterialItems 计 0 → 重算后账上 0；矩阵默认 1（useCompletion 初始化）零改动，新单照常。漏保器选项补「无（本单没用）」。所有增项行删除/数量编辑=存量既有
2. 验收2（件2 弹窗）：AddMaterialsSheet=成本表全量（getAllCostMaterials，R-5.3 同源）+顶部搜索+复选+每条就地改数量（默认1）+点价改（同改价口径）+绑定状态（getCostMapping→"绑定到 X"/同名命中/未绑定·就地绑）+顶部已选区件数+合计；确认一次全进单（useCompletion.addMaterials，行结构同 addMaterial 口径含 id/name/quantity/unit/costPrice/customerSubtotal=0）
3. 验收3（三入口）：a) CostItemsTable 橙警"预估偏低"行旁「绑定」钮=存量已有（P0-191-R2/R3 链），零改动实证（git diff 无此文件）；b) 设置页「绑定对账」=BindReconcilePanel，列未绑定（findCostPrice==null 且映射空）/模糊命中（无显式映射但出口命中，提示精确绑）/映射失效（映射目标不在成本表）三态，逐个 CostItemPicker 选绑后消行；c) 件2 弹窗每条绑定状态+就地绑=已含
4. 验收4（金额出口）：AddMaterialsSheet 合计=caleFullMaterialCost({电缆/PVC/漏保=0, extraItems:已选}).total 直接展示；runner 实证 total=10（漏保盒5×2），出口 items 含所选项；grep 实证弹窗代码零金额四则运算（仅数量钳制 Math.max(0,...)）
5. 验收5（改价全局生效）：runner 实证 setCostPrice('cost_1',999)→findCostPrice('C25')=999→恢复原值 26.8；写侧=settingsStore.setCostPrice（cdz 覆盖层，既有写入方式不变），读侧=resolver 出口应用（本单接通）；确认时 toast"以后所有单都按新价"（MaterialPicker/AddMaterialsSheet 两处同文案）
6. 验收6（绑定对账面板）：runner 实证无名+无映射→unbound 判定；增项表 514 名数据源就绪；面板三态着色（unbound 红/fuzzy 琥珀/stale 橙）
7. 验收7（构建+发版）：npm run build → [BUILD CHECK]前置通过+vite built+后置通过（tsc 0 错）；releaseNotes.ts 头插 P0-241 一条
8. 验收8（回归/口径）：orderCalc.ts 零改动（git diff 实证 0 行）；解析 20 条样例零改动；R-5.2/R-10.1 链零改动；脱敏假数据（runner 全部假名）；施工过程发现并修复「添加钮误插入京东增项表按钮 JSX 内」错位（git 逐字节对拍确认修复后结构合法）

## 双断言
- ① 载荷==任务书范围：git status 实证 9 文件
- ② sha256 回拉对拍：push 后 git show HEAD:<file> 回拉 sha256==本地（下方记录）

## 与 P0-239/P0-240 禁混令
基线 d6a4f46 已含 P0-240 交付笔 9b346c87；本单独立一笔提交，与 P0-239（早已交付）/P0-240 各自独立。
