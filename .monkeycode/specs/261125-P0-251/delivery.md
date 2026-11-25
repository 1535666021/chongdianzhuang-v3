# P0-251 交付：套包外线缆敷设套餐内不另收费（客户侧免费额度唯一出口）

- 基线：main 069bf1a → 新 HEAD 见提交（单 commit 载荷 5 文件）
- 单号：P0-251　日期：2026-11-25　施工：施工队窗口

## 一、改动清单（diff 面恰 4 src 文件 + 本书，零超范围）

1. `src/shared/utils/orderCalc.ts`：新立唯一出口 `isCableLikeSurveyCharge(mat, name?)`——
   ① categoryCode==='CABLE'；② (freeQuota ?? 0)>0；③ 无码去空格 /电缆敷设|线缆敷设/ 兜底；
   查无行按名兜底（含万帮表）。全库仅此一份判定。
2. `src/features/order/hooks/useSurvey.ts`：`isCableMat` 改接唯一出口；`calcCableCost` 门槛
   `quota = freeQuota>0 ? freeQuota : resolveOrderPackageMeters(order)`（packageMeters 优先、品牌默认兜底，禁组件硬编码）；
   `toggleAddon` 电缆行移除判定同步改接。
3. `src/features/order/components/SurveyModal.tsx`：删本地旧正则 `/电缆敷设 | 线缆敷设/`（字面空格版）；
   材料行/报告 billedMaterials/detailLines/displayFee 全改接唯一出口；报告电缆行 quota 同 B；
   单位展示 `¥{unitPrice}/{mat.unit}`（非米材料不再硬显示 /m）。
4. `src/constants/releaseNotes.ts`：头部追加 1 条（P0-251）。

## 二、runner 自查实证（esbuild 本地脚本，脱敏假数据，FAILS=0，25 断言）

判定矩阵（8）：
- addon_312（PVC 码+freeQuota=30）=true；addon_310/311（PVC 码+freeQuota=0）=false 不纳入 30m 免费；
- addon_253（SERVICE/套）=false；既有 CABLE 行=true；普通 PVC 行=false；
- 查无行名字兜底「套包外 电缆敷设」=true；万帮按米线缆=true。

验收组（17）：
- A组 qty=3：客户收费 ¥0、预估合计 ¥0（calcSurveyTotal 电缆行不进 nonCableTotal）；
- B组 qty=8：¥0 / ¥0；
- C组 qty=35：overMeters=5、客户收费 5×45=¥225、预估合计 ¥225、报告行「35米（超5米）× ¥45 = 225.00」；
- D组：3m 报告 subtotal<=0 不打客户收费行；0 元预估/合计可保存（validateSurveyActualReceive 未改，空=按预估）；
- 回退组：无 freeQuota 的 CABLE 行走 resolveOrderPackageMeters（订单 30 → 超 5）；
- E组：isFreeQuotaMaterial(addon_312)=true 未受影响；calcFullMaterialCost(cableMeters=3, extraItems 不含 312) 无 312 增项行=无双计；
- 回归：310/311 全量计费（150/195）、253 套包 1350、PVC 客户侧恒 0 口径未动。

## 三、构建

- `npm run build`：build-check 前置通过 → tsc --noEmit 0 错误 → vite build 成功 → [BUILD CHECK] 后置检查通过。

## 四、影响半径清单对拍（逐项）

- Material.freeQuota / types / 批次数值：不改 ✔（只新增客户侧读取）
- isCableMat / calcCableCost / totalEstimatedCost / reportText：必须改 ✔（唯一出口+quota 门槛）
- SurveyProfitPreview / SurveyProfitConclusion：只消费 estimatedCost/receivable，未动 ✔
- validateSurveyActualReceive / commitAdd / commitPrice：未动 ✔（0/正数规则不变）
- addon_310/311：保持现状（freeQuota=0 不纳入免费），除非监理另书 ✔
- calcFullMaterialCost / isFreeQuotaMaterial / 成本绑定：零改动，无免费额度+增项双计 ✔
- 套餐定义 / 安装费分档 / 品牌默认 packageMeters 来源 / 历史修正器 / V4：零触碰 ✔

## 五、双断言

- 载荷文件清单 = 任务书范围（4 src + 本书），diff -r 基线其余 0 差异；
- 推送后回拉 sha256 对拍见监理复验（提交信息含 P0-251）。

更新说明：套包外线缆敷设套餐内含 30 米不另收费，只收超出米数
