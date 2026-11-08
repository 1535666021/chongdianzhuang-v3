# P0-241-R2 核验打回 · return-R2（件5 整改复验）

核验窗：基线 ee022d6（R1 打回令）→ 整改 HEAD 9991927
方法：双版本快照 diff + 逐条过秤 + tsc 0 + vite build 前后检查全过（复跑实证）

## 整改通过项

- 库存列表主源锁定：InventoryPage 8 处 allMaterials→costMaterials（L55/L75/L82/L106/L119/L247/L272），增项表材料不再进库存主数据 ✓
- 存量库存记录数据零改动（inventory store 未触）✓
- delivery 增补段已补五件清单 ✓

## FAIL 逐条实证

### FAIL-1：存量增项名条目「照常显示照常计数」被切断

**任务书要求**：存量历史遗留的增项名库存条目保留不动（甲方选 1）：照常显示照常计数。

**实证**（InventoryPage.tsx L55-71）：
```ts
const items = useMemo(() => {
  return costMaterials.map((m) => {          // ← 只遍历成本表 id
    const inv = inventory[m.id]                // ← 按 id 挂存量
```
存量增项名条目 id=custom_addon_*，不在 costMaterials 内 → inventory[custom_addon_*] 记录**整行掉出列表**，计数与显示全失。数据虽零改动（✓），但「照常显示照常计数」显示层被切断（✗）。
**修法**：列表遍历改为 `成本表 ∪ 有存量记录的存量条目`（存量附加区，照常计数；存量数据禁动）。

### FAIL-2：入库选择器未锁定，新入库仍可选增项表材料

**任务书要求**：列表/入库选择只认成本表全量条目——客户增项表材料一律不进库存列表与入库选择。

**实证**：整改 diff 面仅 InventoryPage.tsx 单文件；UsageForm.tsx（入库/领用选择器）**零改动**，L37 仍 `allMaterials.filter(...)`（allMaterials=成本表+增项表 584 项，useMaterial.ts L175 未动）→ 新登记入库仍可从增项表选入。
delivery 边界说明「UsageForm 维持既有口径」系误用「存量不动」条款——该条款保存量数据，不保新入口径。
**修法**：UsageForm 选择源 allMaterials→costMaterials；存量增项名条目若已有存量记录需可选（同 FAIL-1 附加区口径）。

## 整改令

1. 两处同修：InventoryPage 存量附加区 + UsageForm 选择源锁定（按 FAIL-1/2 口径）
2. runner 自查需覆盖两 FAIL 场景：存量 custom_addon_ 有条目时列表可见可计数；UsageForm 选择源零 custom_addon_
3. 单开一笔提交报 HEAD，禁混前笔载荷

## 通过项备忘（免重验）

tsc 0 / build 前后检查过 / 件1-4 载荷未动（9991927 diff 面仅 InventoryPage+delivery）。
