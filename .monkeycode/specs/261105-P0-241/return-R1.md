# P0-241 核验打回 · return-R1

核验窗：基线 d6a4f46 → 交付 eadb053（两笔：a34f5c9 载荷 9 文件 + eadb053 纯文书笔）
方法：双版本快照 diff + 逐条过秤 + 脱敏假数据实跑（esbuild+node 断言、tsc、vite build 前后检查）

## 通过项（实证要点，供复验免重）

1. **件1 编辑态** ✓ MaterialPicker 漏保盒删除钮+数量输入（L271-274）、漏保器「无（本单没用）」（L286）、行内改价→settingsStore 覆盖层+轻提示（L53-64）
2. **件2 添加弹窗** ✓ AddMaterialsSheet 零金额四则 grep 空、合计读 calcFullMaterialCost 出口 total（L72-78）、useCompletion.addMaterials 与 addMaterial 同口径（L189-205）、OrderComplete L289 接线
3. **件3 三入口绑定** ✓ 橙警绑定钮=存量零改动、SettingsPage 绑定对账注册、BindReconcilePanel 三态=findCostPrice 出口（L24-27）
4. **件4 入库改价联动** ✓ UsageForm 非阻断提示+「同步到成本表」钮+toast（L56-71/L167-173）
5. **件5 库存数据源锁定** — 见 FAIL-1
6. **runner 实跑** ✓ 改价 999→findCostPrice 出口吃到→还原成功；弹窗出口合计=10；未绑定判定=null；回归 20/20；FAILS=0
7. **tsc 0 错 + [BUILD CHECK] 前置/后置全过**
8. **统一铁规矩** ✓ orderCalc.ts 零改动、回归 20 条零改动、resolver 覆盖层出口接通（L21-28）、releaseNotes L3

## FAIL 逐条实证

### FAIL-1（唯一阻塞项）：件5 库存管理列表数据源锁定=代码零实现

**任务书要求**：列表/入库选择只认成本表全量条目（cdz_cost_*=唯一库存主数据）；客户增项表（售价体系）材料一律不进库存列表与入库选择；存量历史遗留增项名条目保留不动（照常显示照常计数）；禁归一合并、禁动存量。

**实证**（交付版 eadb053 逐环对拍）：
- eadb053 commit（「增补件5」）经 GitHub API 核实**仅改 task.md（+16/-12），代码文件零增量**——首笔 a34f5c9 载荷 9 文件亦不含任何库存列表/入库选择组件
- `useMaterial.ts` **不在 diff 面**=零改动；L175 `allMaterials = [...costMaterials, ...addonMaterials]` 仍合并增项表
- `InventoryPage.tsx` **不在 diff 面**=零改动；L54 `allMaterials.map(...)` 库存列表仍渲染客户增项表 572 项
- `UsageForm.tsx` 入库选择器 materialOptions 仍源于 allMaterials（diff 仅显示件4 改价联动，未锁选择源）
- 结论方向：新条目仍可从客户增项表选入库存，「新入库只认成本表」未实现；存量保留条款虽天然满足（inventory 存储零改动），但核心要求未落地

**两种可能**：①件5 系 eadb053 时刻追加进任务书、施工未做；②做了但漏 `git add`。**两种情形 HEAD 均无代码，FAIL 成立**。

## 整改令

1. 补件5 代码：useMaterial 提供「库存视角」列表（成本表 ∪ 有存量的存量增项名条目），InventoryPage 列表与 UsageForm 入库选择切换为该视角；存量数据禁动
2. delivery.md 更新为五件清单（现标题仍「四件」、全文 0 处提件5），附件5 自查实证
3. 整改后单开一笔提交（禁混 P0-241 已交付件1-4 载荷），报新 HEAD 供复验

## 备注（非 FAIL）

- MaterialPicker L298 小计预览存在既有四则表达式（基线 d6a4f46 同位置既有，非本单引入）——建议后续顺手改读 orderCalc 出口或给豁免，本单不计 FAIL
- 一笔一交付纪律：本单两笔提交（a34f5c9+eadb053），第二笔为纯文书笔，记备注不记 FAIL
