《施工队 · 任务书》P0-247（v4 · 甲方三次裁示：勘测填入即同步 + 存量自动修零手工）

编号：P0-247　签发：监理窗口　日期：2026-11-11　状态：待施工
基线：仓库 main 当前 HEAD=083c9f8
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 一、问题（甲方两轮报障，同一病根）═══
11-10（v3 已录）：已完成单费用明细记「…×18米」，材料成本只有 ¥5.00。
11-11（截图实证·勘测弹窗）：辅材行「套包外线缆敷设… ¥45/m × 20 = ¥900.00」，同屏「电缆距离(米)」框=0。甲方裁示（原话实录）：
①「这两个数字不同步，所以导致不计算」
②「不是保存时自动对齐，是填入数字的时候自动对齐」
③「只要电缆同步，其他的不管，只要线缆的数字改变下面就要同步改变，别的其他什么都不动」

═══ 二、根因实证（监理逐行读死，两环断点同属「米数两数不一致」）═══
【环A·完工侧】v3 已定案：完工落库那一刻账上米数=0（先完工后补勘测），存值锁死漏保盒兜底 5 元，三层账冻结事后进不去。→ 件2/件3/件4 兜。
【环B·勘测侧】v4 新实证断点（截图单即此形态）：
1. useSurvey.ts L216-236 `updateQuantity` **已有电缆联动分支**（L227-233：isCableMat → cableDistance=q + estimatedCableCost 重算），但门槛 `isCableMat(name)` 必须为 true。
2. useSurvey.ts L74-77 `isCableMat`：`mat.categoryCode==='CABLE'` 优先；无 CABLE 时走文本兜底正则 `/电缆敷设 | 线缆敷设/`。
3. **正则字面 bug（监理实测铁证）**：该正则竖线两侧带空格=「电缆敷设␣」或「␣线缆敷设」。实测：`套包外电缆敷设3*10mm²`→false；`套包外线缆敷设`→false；`线缆敷设 ZR-YJV 3*10mm²`→false；仅「电缆敷设」后恰好带空格才 true。几乎全灭。
4. **244 新增辅材不带 categoryCode**（SurveyModal.tsx L84-90 commitAdd 只写 id/name/unit/settlementPrice/brand）→ 甲方自加行必然落入正则分支 → false。
5. 判定 false → 填数量只记 quantity 不动 cableDistance → **两数并存（20 vs 0）** → save（useSurvey L238-244）落库 cableDistance=0 → orderCalc.ts L216 cableMeters=0 → meterCost quantity<=0 直接 return → 电缆/PVC 成本整段漏记。与甲方截图、与 247 原单 ¥5 现象完全同族。

═══ 三、施工四件 ═══
**件1（v4 新增·源头同步·最优先）**：修 isCableMat 判定链——
① 有 categoryCode 的行：**短路以 categoryCode 为准**（==='CABLE' true，其余 false，正则不看）；
② 无 categoryCode 的行（244 新增）：文本兜底正则去空格 `/电缆敷设|线缆敷设/`；
③ 修后 updateQuantity 既有联动分支自然生效：填电缆行数量**那一刻** cableDistance+estimatedCableCost 实时同改，不等保存、不弹窗；UI 电缆距离框同一 form state 即时刷新；
④ 施工自查：全量核对基础表（category==='线缆' 而 categoryCode!=='CABLE' 的行列表），漏标电缆行→按既有数据文件批次补标 'CABLE'（常量补丁，禁碰计算链），自查结果写进 delivery.md。
**件2（原 v3 件1）**：完工/修改结算保存校验·米数不一致拦截弹窗（`cableMeters===0 && survey.cableDistance>0`→弹「勘测已记 N 米…确定按 0 保存？」，带入重算/坚持按 0 留痕）。
**件3（原 v3 件2）**：未绑定=弹窗绑定。calcFullMaterialCost 后 unmatched 非空→绑定窗（cdz_cost_mapping_v1 链，P0-241 件3 入口复用），绑定完成重算再落库，绑定前禁静默保存。
**件4（原 v3 件3 扩充·判定加形态B）**：存量错单全自动修正器·部署后首次进入自动执行一次+toast「已自动修正 N 单成本」。判定（三层账铁规内收窄）：
　形态A（v3 原判）：已完成 ∧ completionCableMeters 空/0 ∧ survey.cableDistance>0 ∧ 存值≠实时出口值；
　**形态B（v4 新增·兜截图类存量）**：已完成 ∧ survey.cableDistance 空/0 ∧ estimatedMaterials 含 isCableMat 行且其数量>0 ∧ 存值≠**以该行数量为米数**的出口值；
　归正=按实据米数（形态A 取 survey.cableDistance / 形态B 取电缆行数量）过 `calcFullMaterialCost(buildFullMaterialCostInput(order))` 出口值自动落 materialCost/actualProfit/reconciliationProfit；RULES §9 同款：执行前 localStorage 备份+幂等+留痕日志文件；正常老单零触碰。

═══ 四、禁区 ═══
- orderCalc 出口本体禁改；漏保矩阵零触碰（P0-248 在途另单，禁越界）；匹配顺序零触碰
- isCableMat **只修字面空格+categoryCode 短路**，禁加词（「线」「缆」单字禁入正则，防 PVC/漏保/人工费行误入电缆联动）；万帮 findWanbangMeteredCable 零触碰
- 「安装服务套包（30米线缆敷设）」类**套包一口价**行修后仍必须 false（categoryCode 短路天然保安全，验收逐名称实证）
- 反向联动（updateForm L200-211 改距离→电缆行数量）保留不动；P0-161「0=空态」、P0-224 自布线全归零语义不破；save L238-244 口径不动
- 件4 只修事故形态，**禁全量重算所有已完成单**（改价后老单按完工时价冻结铁规不破）；既有橙警保留
- 弹窗=写入侧阻断（甲方裁示）；测试一律脱敏（王某某/13800000000/某小区）

═══ 五、验收（核验窗过秤）═══
1. **件1·填入即同步**：脱敏单以 244 入口自加电缆辅材（名用「套包外电缆敷设3*6mm²」）→ isCableMat=true 实证 → 数量填 20 → 电缆距离框**填入那一刻=20** 且预估费用联动；改 18 → 框=18。反向：改距离框 15 → 电缆行数量=15（既有回归）
2. **件1·别的什么都不动**：非电缆辅材数量改 50 → 电缆距离框纹丝不动；「安装服务套包（30米线缆敷设）」行判定仍 false、费用=quantity×unitPrice 口径不变
3. **名称判定回归集**（监理实测集，逐名称实证 true/false）：套包外电缆敷设3*10mm²→true｜套包外线缆敷设→true｜线缆敷设 ZR-YJV 3*10mm²→true（该行走 categoryCode 短路）｜安装服务套包（30米线缆敷设）→false｜套包外2P漏保开关→false｜PVC管材→false
4. 件2/件3 同 v3 验收 1/2/3（米数拦截、未绑定绑定、橙警保留）
5. **件4**：造 4 条脱敏事故单（形态A×2：米数0+勘测18m+存值5；形态B×2：cableDistance 0+电缆行数量20+存值不含电缆）+ 2 条正常老单对照 → 部署自动执行 → 4 条归正（材料成本含电缆米×单价+PVC）→ 2 条对照零变化 → 重跑空（幂等）→ 备份实证 → 日志文件列 4 条改动明细
6. 甲方 11-11 截图原单形态复跑 = 验收 1 结论；甲方 11-10 原单形态复跑 = 验收 5 形态A 结论
7. 回归 20/20；npm run build tsc 0 错 + [BUILD CHECK]；releaseNotes.ts 头追加 P0-247 v4

═══ 六、交付方式 ═══
push 一笔（message 含 P0-247 v4）+ specs/261110-P0-247/delivery.md（自查实证清单：文件:行/命令/输出摘要，虚报一处全单退件），会话只报一行指针。