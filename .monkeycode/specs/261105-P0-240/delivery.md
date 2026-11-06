# P0-240 交付（品牌自定义库）

基线：9a29cce（签发 P0-240 之 HEAD；任务书所标 cef61e2 为签发前基线，本单以 main HEAD 为工作基线）
施工：施工队窗口　日期：2026-11-06

## 载荷（7 文件，与任务书范围一致）
- 新增 src/shared/storage/customBrandStorage.ts（键 cdz_custom_brands_v1，仿 platformStorage 模式）
- 新增 src/features/settings/components/BrandManager.tsx（设置页「品牌管理」面板）
- 修改 src/constants/brands.ts（import 置顶；+getAllVehicleBrands/+isHardcodedVehicleBrand；BRAND_MAP 本体零改动）
- 修改 src/features/order/hooks/useSurvey.ts（brandList 运行时合并自定义库；通用分支空且非硬编码品牌→兜底 addonMaterialsData 全量）
- 修改 src/features/order/components/SurveyModal.tsx（下拉「➕ 手动输入品牌」+手输模式+写回订单 brandName 只补空缺）
- 修改 src/features/settings/pages/SettingsPage.tsx（菜单项「品牌管理」+renderSection case）
- 修改 src/constants/releaseNotes.ts（头部追加 1 条）

## 自查实证清单（逐条对应任务书验收，文件:行/命令/输出摘要）
1. 手输「智己」→写库+下拉再现+刷新重开仍在：runner1 实证 `addCustomBrand('  智己 ')`→`getCustomBrands()=["智己"]`（去空格），重复 add 去重仍 1 个；`getAllVehicleBrands()` 含「智己」。命令：`npx esbuild p0-240-t1.ts --bundle --platform=node && node` → PASS×8。落点：customBrandStorage.ts:18-24 / useSurvey.ts（brandList useMemo）/ SurveyModal.tsx（CUSTOM_BRAND_OPTION 哨兵+handleCustomBrandConfirm）
2. getBrandLabel 不显示「未知」：`getBrandLabel('智己')==='智己'` PASS（brands.ts 原名回显分支）；OrderCardTags.tsx:41→BrandTag→:182 getBrandLabel 链路零改动；写回订单 brandName 后水印/胶囊照常（SurveyModal.tsx handleSave 只补空缺分支）
3. 辅材兜底=全部增项：runner2 实证「智己」filtered=0 → 兜底源=addonMaterialsData 全量 590 项（与 useSurvey.ts 通用分支逐字同逻辑）；选件进成本走既有 toggleAddon→calcFullMaterialCost 链（orderCalc 零改动）；未绑定材料橙警 R-5.2 机制不动
4. 漏保免配零报错：runner3 实证 `needBreakerCost('智己','7')=false`、`('智己','3.5')=false`（自定义品牌全功率走「其余品牌=免配0成本」既有分支）；对照 `领克/7=true`、`五菱/3.5=true` 矩阵零扰动；orderCalc.ts 零改动
5. 品牌管理：BrandManager.tsx 列 getCustomBrands()+删除钮（硬编码 20 不在此列表，天然无删除钮）；runner1 验收5：removeCustomBrand 后 `getCustomBrands()=[]`、大名单不再含「智己」；删除仅动自定义库（customBrandStorage.ts:32-34），订单 brandName 字段零触碰（R-11.2）
6. 硬编码 20 品牌零回归：runner2 验收6 `brandList.length=20`；「比亚迪」filtered=33>0（兜底不触发）；needBreakerCost 对照组=true；既有单勘测流程代码路径零改动
7. build+releaseNotes：`npm run build` → [BUILD CHECK]前置通过 + vite built in 3.57s + 后置通过（tsc 0 错）；releaseNotes.ts 头部第 3 行新增 P0-240 一条（当前共≤30 条）

## 禁区自查
- orderCalc.ts 零改动（git diff 实证）；漏保矩阵判定口径未动（runner3 对照组）
- 解析回归 20 条样例零改动（本单未触 parser 链）
- 解析不滤除实证：parser-engines.ts:194/472 两处仅「桩名称兜底识别」，`if(matched.length>0)` 才赋值、无 else 清空分支——自定义品牌 brandName 原样保留
- 零打断式弹窗：手输为用户主动点选「➕ 手动输入品牌」入口（199 教训合规）；禁空仅 toast 提示不拦截流程
- 真实数据零入库：runner 全部用「智己」脱敏假词

## 双断言
- ① 载荷==任务书范围：git status 实证，除上述 7 文件 0 差异
- ② sha256 对拍：push 后 `git show HEAD:<file>` 回拉 sha256==本地（见下方回拉记录）

## 备注
- 任务书「BRAND_MAP 44 个」系签发笔误，实测 39 键；BRAND_MAP 本体零改动由 git diff 实证（删除行=0），代码注释已标实测值
- 本单独立一笔提交，与 P0-239 禁混令合规（specs/261105-P0-239/delivery.md 已存在，两单各自独立）
