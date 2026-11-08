# P0-241 核验任务书（R2 整改复验 · 全单终验）

监理窗口　2026-11-08　基线 HEAD=2870d4d（R2 整改笔，施工队报）
前置：return-R1.md / return-R2.md / delivery.md 已读本目录。

## 焦点（R2 整改两处 FAIL 复验）
1. **禁混笔实证**：2870d4d diff 面仅 InventoryPage.tsx + UsageForm.tsx + delivery.md 三文件（对 9991927 逐文件对拍）；件1-4 载荷（AddMaterialsSheet/BindReconcilePanel/MaterialPicker/useCompletion/OrderComplete/SettingsPage/costMaterialsResolver）零触碰
2. **FAIL-1 复验**：存量附加区=成本表条目 ∪ 有库存记录的存量条目——造脱敏存量记录（custom_addon_* 有条目）→ 列表照常显示照常计数；其 id/unit/category 反查只读；存量数据零改动（inventory store 未触）
3. **FAIL-2 复验**：UsageForm 新入库/领用选择源= costMaterials ∪ 存量附加区；无存量记录的增项表材料（custom_addon_*）不可新选入；新入库登记零增项表材料
4. delivery 增补段「R2 整改追加」声明与 HEAD 逐条对拍（存量计数 7/名反查/无存量零增项/存量可选四断言）

## 全单终验（任务书第四节九条，重点回归项）
5. 件1-4 主体验收回扫：a34f5c9 载荷未被 R1/R2 两笔碰（R1 笔 ee022d6 只落 return 文书；R2 面=3 文件）
6. 统一化铁规矩 grep 复检：AddMaterialsSheet/MaterialPicker 零金额四则运算（仅 Math.max 钳制）；改价写侧=settingsStore.setCostPrice 唯一；orderCalc.ts 零改动（git log -p 实证）；漏保矩阵口径未动
7. 三层账抽查：已完成老单材料价冻结不被改价影响（runner 或构造对拍）；库存现金按入库单价
8. 解析回归 20 条基线零改动；releaseNotes 头有 P0-241 条
9. npm run build tsc 0 错 + [BUILD CHECK] 前后置过

## 结论文书（二选一，落库即送达）
- 通过=SUPERVISOR-HANDOVER 交接书刷新（〇/一节 241 销号 + 第二节补 P0-241 销号行；同步把 239/240 状态节修正回已销号——c19516f 状态回写失误已在监理侧立案）
- 打回=本目录 return-R3.md（FAIL 逐条实证+整改令）
