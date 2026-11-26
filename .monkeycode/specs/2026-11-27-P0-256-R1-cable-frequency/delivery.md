# 《施工队 · 交付书》P0-256-R1 电缆类必须计频

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-256-R1-cable-frequency（基线=main 现 HEAD；核验窗合并/翻牌）
- 性质：**证据型返工单**——本窗 P0-256 合并（16da2541，含 A 去跳过+R2 删硬置顶）已覆盖 R1 全部要求，本单以脱敏实证+代码现状核验交付，**零代码改动**

## R1 要求逐条核验
| 要求 | 现状 | 实证 |
| --- | --- | --- |
| 频率统计不排 isFreeQuotaMaterial；电缆/3×6/YJV/PVC 全计频 | main useMaterialFrequency.ts grep `isFreeQuotaMaterial` = **0 命中**，跳过已删 | runner `YJV 计频2/PVC 1/3×6 1/30m 1` 四连 PASS |
| 保留删 3*6 硬置顶；最高频只凭频率第一 | isCable36 硬编码已删（R2 笔） | runner 双向回归（本单低频排后/同频 tie-break 含 3×6 用例） |
| 低频不删不藏仅排后；同频稳定 tie-break | 排序纯频率降序无剔除 | runner `低频不删不藏 PASS`+`同频稳定 tie-break PASS` |
| 脱敏用例证明电缆类计数前后差值正确 | update 差值模型 | runner `YJV +1/3×6 +1/进行中差值0` 三连 PASS |
| 搜索/候选/批量添加一致 | 三入口（MaterialPicker/AddMaterialsSheet 候选 L57+搜索 L61/SurveyModal）共用同一 sortMaterialsByFrequency | 同输入同序 runner 三调用一致 PASS + 调用点 grep 四行实证 |

## 载荷（1 文书）
- .monkeycode/specs/2026-11-27-P0-256-R1-cable-frequency/delivery.md（本书）

## 自查实证
- runner 10 断言 FAILS=0（esbuild bundle 直跑，零 shim）
- 代码现状三 grep 实证：无 isFreeQuotaMaterial 残留 / 无 isCable36 / 三入口调用点在
- 交付引用 R1 路径：.monkeycode/specs/2026-11-27-P0-256-R1-cable-frequency/TASK.md（WINDOW-SYNC 协议）

## 复验指引
- 渲染入口：材料选择/增项/勘测三入口任选——电缆类按真实使用频率排序
- 合并方式：纯文书笔，直接合并即翻牌

## 教训/避坑
- 销号后增补返工先核 main 现状再动手——本单若重推代码反而制造双份改动
