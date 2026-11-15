《施工队 · 任务书》P0-248（v2 · 口径钉版）

编号：P0-248　签发：监理窗口　日期：2026-11-11　状态：待施工
基线：仓库 main 当前 HEAD=4e7a456
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 一、问题（甲方裁定 2026-11-11，原话实录）═══
「把漏保矩阵取消掉，每个订单都自动有漏保，自动计算成本」
「漏保矩阵不包含漏保盒。。。」（甲方二次纠正实录——**口径钉死：漏保矩阵只管漏保器要不要计，漏保盒从来不在矩阵内、每单必含必计（orderCalc L235 无条件行），本次一动不动**；监理口头汇报曾把漏保盒捎带进矩阵表述，已更正，以本节为准）
现状=漏保矩阵 needBreakerCost(品牌,功率) 决定漏保器"要不要计成本"：吉利厂家提供=免配0、领克全不含、五菱3.5kW不含、其余含。甲方裁定：**矩阵废除，漏保器每单必计**。
细节授权监理定（甲方既有口径"剩下的你看着干，有冲突想办法解决"）。

═══ 二、实证锚点（行号与 HEAD=4e7a456 逐字核对）═══
- src/shared/utils/orderCalc.ts：
  L235 `meterCost('漏保盒', input.breakerCount ?? 1)`——**漏保盒无条件行，无矩阵分支，禁动**
  L237-247 `calcFullMaterialCost` 漏保器段：`if (needBreakerCost(input.brandName || '', input.powerKw))` 矩阵分支内含=计/不含=免配0（本单废除对象）；breakerName 回退解析（/漏保|漏电保护/ && !/盒/）保留（型号选择）
- src/features/order/hooks/useCompletion.ts profit memo：`const breakerFreeByMatrix = !needBreakerCost(order?.brandName || '', order?.powerKw || '')`——免配判定消费点①（breakerTypeCost=0 分支）；buildMaterialItems `breakerFreeByMatrix ? "（厂家提供）" : ...`——展示消费点②
- src/constants/brands.ts `BRAND_DEFAULTS`——漏保型号默认值（保留）
- P0-202-R2：手加漏保行矩阵接管禁双计拦截（矩阵废除后语义同步改，拦截本身保留）

═══ 三、施工两件（本单只动漏保器）═══
1. **矩阵废除·漏保器每单必计**：calcFullMaterialCost 漏保器段=无条件计 1 支（needBreakerCost 免配分支废除）；breakerName 解析链不动（型号仍按品牌默认/功率/手选 completionBreakerType 回退）；**漏保盒 L235 零改动**。吉利/领克/五菱3.5kW 等原免配品牌=新起行为（每单计漏保器成本）。
2. **useCompletion 同步**：breakerFreeByMatrix 恒 false 语义（免配 0 支与「（厂家提供）」文案废除），展示统一「漏保 X 1个 × ¥成本价」；P0-202 手加漏保行禁双计拦截保留。
3. **未绑定兜底衔接**：漏保器必计后 findCostPrice 查不到→走 P0-247 件2 绑定弹窗（同队列衔接；247 未上线期间按既有 unmatched 机制）。

═══ 四、禁区 ═══
- **漏保盒行（L235）禁动**——甲方二次纠正钉死；三层账不动：已完成冻结单零重算；漏保器型号推断保留
- 禁双计（P0-202 拦截保留）；orderCalc 其余出口语义零改（电缆/PVC/漏保盒/增项行不动）；测试脱敏（王某某/13800000000/某小区）

═══ 五、验收（核验窗过秤）═══
1. 原免配三品牌（吉利/领克/五菱3.5kW）新单：漏保器成本=成本表漏保条目价×1（runner 断言）；漏保盒仍=breakerCount×盒价（行为与基线逐字节一致）
2. 普通单（比亚迪 7kW）：漏保器+漏保盒与基线一致
3. 型号推断回归：3.5→C25/7→C40/品牌默认全绿；手加漏保行不双计；展示无「厂家提供」
4. 已完成老单（含免配品牌）：数据零变化（冻结实证）
5. 回归 20/20；npm run build tsc 0 错+[BUILD CHECK]；releaseNotes.ts 头追加 P0-248

═══ 六、交付方式 ═══
push 一笔（message 含 P0-248）+ specs/261111-P0-248/delivery.md（自查实证清单：文件:行/命令/输出摘要，虚报一处全单退件），会话只报一行指针。
