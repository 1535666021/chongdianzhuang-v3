《施工队 · 任务书》P0-244

编号：P0-244　签发：监理窗口　日期：2026-11-08　状态：待施工
基线：仓库 main 当前 HEAD=a679656（含 P0-243 签发笔；与 243 同队列，可先后交付禁混提交）
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 一、问题（甲方报障 2026-11-08，截图实拍+口述定案）═══
勘测弹窗「选择辅材」清单（截图：材料名+价格+复选+完成钮）现状=**硬编码只读**——某品牌缺材料只能干瞪眼。
甲方裁定（原话）：「某个品牌中的某一个材料没有，我就需要添加进去，添加进去参与正常的计算，只添加到当前这个品牌里面」。
配套能力（甲方首述）：**可添加、可删除、可编辑价格**，三者都写入对应品牌的价表，参与计算。
细节甲方授权监理定（原话「剩下的你看着干，但是不能与现在的系统冲突，如果有冲突，你想办法解决」）。

═══ 二、实证锚点（行号与 HEAD=a679656 逐字核对）═══
- src/features/order/components/SurveyModal.tsx：
  L5 `import { addonMaterialsData } from '@/constants/materialData'`
  L57 `sortMaterialsByFrequency(brandAddons, getMaterialFrequency())`（brandAddons 来自 useSurvey）
  L66/L119/L123 `addonMaterialsData.find((a) => a.name === name)`——**计费链按名查表**
  L232 `options={sortedBrandAddons.map((mat) => ({ value: mat.name, label: mat.name, cost: mat.settlementPrice }))}`——弹窗显示价=settlementPrice（结算/客户价）
- src/shared/utils/orderCalc.ts L351 `addonNonCable = nonCable.reduce((s, m) => s + m.quantity * m.settlementPrice, 0)`——辅材费计费出口；L123 超米费 calcOverFee 同表同价
- src/constants/materialData.ts：14 批 `addonMaterialData_batch*` 硬编码 flat 成 `addonMaterialsData` 全量；`Material` 类型（types/material.ts）含 `brand?`/`settlementPrice`/`customerPrice?`/`source:'cost'|'addon'`

═══ 三、施工三件（冲突解法=覆盖层，禁动常量）═══
1. **品牌辅材自定义层**（新增模块，仿 P0-240 custom_brands 存储模式）：localStorage 键 `cdz_brand_addon_overrides_v1`，结构 `{ [brand]: { added: Material[]; priceOverrides: Record<string, number>; deleted: string[] } }`——added=新增材料（含 name/unit/category/settlementPrice/brand）、priceOverrides=改价（名字→新结算价）、deleted=删除（名字清单，隐藏不真删）。读写函数集中一处（禁散落）。
2. **唯一合并点**：新增 `getBrandAddonsWithOverrides(brand)`（放自定义层模块）：硬编码批次中该品牌条目 ⊕ 覆盖层（applied priceOverrides → 替换 settlementPrice；deleted → 滤除；added → 追加）。useSurvey 的 brandAddons、弹窗选项源、一切按名查表消费点全走此合并出口；**addonMaterialsData 常量本体与 14 批文件零改动**（git diff 实证），orderCalc.ts 零改动。
3. **弹窗管理入口**（就地，生态化不打断）：「选择辅材」弹窗内——顶部一行「➕ 添加辅材」（名称+单位+价格三项，名称去空格禁空禁与现有重名）；已有条目行尾/长按出「改价」「删除」（改价=行内输入新价✓/✗；删除=轻确认后写 deleted 标记）。**一切入当前订单品牌**（读弹窗当前生效品牌），其它品牌零触碰。空列表品牌（自定义品牌，P0-240 兜底=全量增项）维持原兜底不动，添加后进入其专属清单。

═══ 四、铁规矩 ═══
- 参与计算=走既有出口：添加/改价后选入订单，金额经 calcFullMaterialCost/SurveyProfitPreview 既有出口算（弹窗零自算）；按名查表消费点（含 isCableMat/L119/L123）必须查到新增项与新价
- 三层账不动：改价只影响之后新选入的预估/计算；**已存订单的 materials/survey 存值零重算**（存的是名字+数量，价格实时查表属既有口径，禁改）
- 删除=显示层隐藏（deleted 标记），计算链按名查表滤除；**存量已选该材料的订单不受影响**（单内已存行照常）
- 禁改 orderCalc 出口与匹配顺序；禁动漏保矩阵；禁改解析回归 20 条样例；真实订单/客户数据禁入仓库，测试脱敏

═══ 五、验收（核验窗过秤）═══
1. 添加：某品牌（如脱敏假品牌）清单无「打吊丝」→添加（¥25）→弹窗清单再现→选中→预估金额含 25×数量（对拍出口）→刷新/重开弹窗仍在（localStorage 实证）
2. 删除：删除某条目→该品牌清单消失→其它品牌清单完好→已有存量单选过该材料的重开仍显示（存值不受扰）
3. 改价：改 150→120→弹窗显 120→新单计算按 120；硬编码常量文件 diff=0
4. 品牌隔离：A 品牌添加的材料，B 品牌清单不出现（覆盖层按 brand 键隔离实证）
5. 合并点唯一：grep 覆盖层消费方=本单模块+useSurvey 接线两处；orderCalc 零改动；addonMaterialsData/14 批文件零改动
6. 计费链全绿：isCableMat/超米费/辅材费三处按名查表对拍新价生效
7. npm run build tsc 0 错 + [BUILD CHECK] 前后置过；回归 20/20；releaseNotes.ts 头追加 P0-244

═══ 六、交付方式 ═══
push 一笔（message 含 P0-244）+ specs/261108-P0-244/delivery.md（自查实证清单：文件:行/命令/输出摘要，虚报一处全单退件），会话只报一行指针。
