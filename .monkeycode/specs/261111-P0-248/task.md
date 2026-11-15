《施工队 · 任务书》P0-248

编号：P0-248　签发：监理窗口　日期：2026-11-11　状态：待施工
基线：仓库 main 当前 HEAD=4e7a456
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 一、问题（甲方裁定 2026-11-11，原话）═══
「把漏保矩阵取消掉，每个订单都自动有漏保，自动计算成本」
现状=漏保矩阵 needBreakerCost(品牌,功率) 决定漏保器"要不要计成本"：吉利厂家提供=免配0、领克全不含、五菱3.5kW不含、其余含。甲方裁定：**矩阵废除，漏保器每单必含必计**（漏保盒本就每单必含）。
细节授权监理定（甲方既有口径"剩下的你看着干，有冲突想办法解决"）。

═══ 二、实证锚点（行号与 HEAD=4e7a456 逐字核对）═══
- src/shared/utils/orderCalc.ts L237-247 `calcFullMaterialCost` 漏保器段：`if (needBreakerCost(input.brandName || '', input.powerKw))` 矩阵分支内含=计成本、不含=0 支（P0-197-R1 新语义"不含=需自购计成本"）；breakerName 回退解析 `resolveCostMaterials().find(/漏保|漏电保护/ && !/盒/)` 保留（型号选择，不动）
- src/features/order/hooks/useCompletion.ts profit memo：`const breakerFreeByMatrix = !needBreakerCost(order?.brandName || '', order?.powerKw || '')`——漏保免配判定消费点①（breakerTypeCost=0 分支）
- useCompletion buildMaterialItems：`breakerFreeByMatrix ? "（厂家提供）" : ...`——展示消费点②
- src/constants/brands.ts `BRAND_DEFAULTS`——品牌漏保型号默认值（inferBreakerType 用，保留）
- P0-202-R2 增补：手加漏保行由矩阵接管禁叠加（isBreakerMaterial skip）——矩阵废除后该拦截语义同步改

═══ 三、施工三件 ═══
1. **矩阵废除·漏保器每单必计**：calcFullMaterialCost 漏保器段=无条件计 1 支（needBreakerCost 免配分支废除）；breakerName 解析链不动（型号仍按品牌默认/功率/手选 completionBreakerType 回退）；漏保盒必含不动。吉利/领克/五菱3.5kW 等原免配品牌=新起行为（每单计漏保器成本）。
2. **useCompletion 同步**：breakerFreeByMatrix 恒 false 语义（免配 0 支废除），展示文案「（厂家提供）」分支随之废除（每单都按「漏保 X 1个 × ¥成本价」展示）。P0-202 手加漏保行禁叠加拦截保留（防双计）。
3. **未绑定兜底衔接**：漏保器必计后，findCostPrice 查不到漏保成本价→走 P0-247 件2 绑定弹窗（同队列衔接；247 未上线期间按既有 unmatched 机制不额外处理）。

═══ 四、禁区 ═══
- 三层账不动：已完成冻结单零重算零触碰；漏保器型号推断（BRAND_DEFAULTS/inferBreakerType/completionBreakerType）保留
- 禁双计：矩阵行与用户手加漏保行仍互斥（P0-202 拦截保留）
- orderCalc 其余出口语义零改（电缆/PVC/漏保盒/增项行不动）；真实订单数据禁入仓库，测试脱敏

═══ 五、验收（核验窗过秤）═══
1. 原免配三品牌（吉利/领克/五菱3.5kW）新单：漏保器成本=成本表漏保条目价×1 入账（runner 断言）
2. 普通单（比亚迪 7kW）：漏保器+漏保盒照常，行为与基线一致
3. 型号推断回归：功率 3.5→C25/7→C40/品牌默认 BRAND_DEFAULTS 全绿
4. 手加漏保行仍被拦截不双计；展示文案无「厂家提供」
5. 已完成老单（含免配品牌）：数据零变化（冻结实证）
6. 回归 20/20；npm run build tsc 0 错+[BUILD CHECK]；releaseNotes.ts 头追加 P0-248

═══ 六、交付方式 ═══
push 一笔（message 含 P0-248）+ specs/261111-P0-248/delivery.md（自查实证清单：文件:行/命令/输出摘要，虚报一处全单退件），会话只报一行指针。
