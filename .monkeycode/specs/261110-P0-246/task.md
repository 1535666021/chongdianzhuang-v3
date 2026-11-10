《施工队 · 任务书》P0-246

编号：P0-246　签发：监理窗口　日期：2026-11-10　状态：待施工（**三件全裁：甲方 2026-11-10 裁示「123都修」，件3 修正器 plan→run 生效**）
基线：仓库 main 当前 HEAD=db55e1f
首句铁律：开工前必读 .monkeycode/MEMORY.md → RULES.md → PLAYBOOK.md，读完再动手。

═══ 一、问题（甲方报障 2026-11-10，原文实录）═══
甲方粘贴原文建档：`202610140842-比亚迪-方程豹 7kW墙盒-30米基础安装…安装套装:比亚迪-方程豹 7kW墙盒…车型:方程豹/钛7…`——系统品牌识别成**比亚迪**，甲方裁定：**这是方程豹**（比亚迪旗下子品牌，套装名"比亚迪-方程豹"=母-子写法）。
甲方裁示（原话）：「修规则，这种单子不是一个」——修解析规则，非逐单手改。

═══ 二、实证锚点（行号与 HEAD=db55e1f 逐字核对）═══
- src/lib/parser-engines.ts：
  L50 `KNOWN_BRANDS = [… '比亚迪' …]`——**品牌词表无"方程豹/仰望/腾势"**
  L51-56 `extractSubBrand`：`brandName.startsWith(bw)` 截词——"比亚迪-方程豹"被切成 brandName="比亚迪"+subBrand="-方程豹"（前导连字符未剥）
  L164-169 套装名匹配：KNOWN_BRANDS 最长命中——词表无方程豹则命中"比亚迪"
  L148/L470：extractSubBrand 两个调用点
- src/constants/brands.ts L44 `PILE_BRAND_KEYWORDS`——桩品牌关键词表同缺子品牌

═══ 三、施工三件（全部生效，无 plan-only 保留件）═══
1. **品牌词表补子品牌**（只增不改）：KNOWN_BRANDS + PILE_BRAND_KEYWORDS 补"方程豹"；施工队全量梳理市面"母品牌-子品牌"写法（比亚迪系：方程豹/仰望/腾势等），凡文本中真实出现的子品牌词一并收录，词表增补清单写进 delivery。
2. **最长匹配优先**：extractSubBrand 截词逻辑改 KNOWN_BRANDS **最长命中优先**——"比亚迪-方程豹"→方程豹（4字>3字）；subBrand 余量剥前导连字符/空白；L164-169 同款逻辑对齐；纯"比亚迪"单零扰动（无子品牌词时仍=比亚迪）。
3. **存量修正器**（RULES §9 铁律：plan/run 分离+执行前 localStorage 备份+幂等+留痕+设置页入口；**甲方已裁示生效**）：扫存量单 brandName=比亚迪 且（subBrand 含方程豹 或 rawText/车型含"方程豹"）→ plan 列明细（姓名/单号/原值）→ run 归正 brandName=方程豹+清脏 subBrand；交付时附 plan 清单摘要+run 报告。

═══ 四、禁区 ═══
- 禁改解析回归 20 条样例本体；新增断言走临时 runner 留输出摘要
- 禁动 orderCalc/匹配顺序/漏保矩阵；品牌展示链（OrderCard 水印/胶囊/getBrandLabel R-11.2）按既有"只增不删"机制兼容新词，禁回写存量
- 歧义保持空禁猜原则不动；真实订单/客户数据禁入仓库，测试脱敏（王某某/13800000000/某小区）

═══ 五、验收（核验窗过秤）═══
1. 甲方原文进 runner：brandName=方程豹（断言对拍）；subBrand 不为"-方程豹"脏值
2. 对照组：纯"比亚迪-汉"类原文仍=比亚迪+subBrand 干净；方程豹/仰望/腾势各造一条脱敏样例全绿
3. 歧义不猜：无法判定时 brandName 行为与基线一致（runner 断言）
4. 修正器：造 3 条脱敏错标单（比亚迪+subBrand=方程豹）→ plan 列 3 条 → run 归正 → 重跑空（幂等）→ 备份文件实证
5. 回归 20/20；npm run build tsc 0 错+[BUILD CHECK]；releaseNotes.ts 头追加 P0-246

═══ 六、交付方式 ═══
push 一笔（message 含 P0-246）+ specs/261110-P0-246/delivery.md（自查实证清单：文件:行/命令/输出摘要，虚报一处全单退件），会话只报一行指针。
