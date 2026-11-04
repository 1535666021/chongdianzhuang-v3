《施工队 · 状态快照》
编号：P0-237　日期：2026-11-05　施工队窗口

═══ 复现归因（任务1，脱敏样例实证）═══
构造奇瑞群公告体脱敏样例（格式=验收1，假号 13800001111/13900002222），
基线代码跑出甲方同款两错：phone=13900002222（网点电话顶包）、
address="· 销售单号：7129465941215461999"（与甲方"地址栏只剩·销售单号"一致）。
归因链（逐环实证，与任务书锚点一致并加深一层）：
① 行首"· "致 parser-core.ts KEY_VALUE_RE 行首锚失配——本单键值行（客户姓名/订单电话/
  安装地址/销售单号）全进不了 kv，与任务书判断一致；
② 次生 bug：parser-engines.ts 电话兜底 kv.set('联系电话',…) 的 canSetFallback 守卫
  只查显式键族、不防自身重入——无显式键时"后写覆盖先写"，最后一个电话行胜出。
  任务书锚的 extractPhone"全文首个命中"是流式路径行为；本单实证走 KV 路径
  （splitOrderBlocks 后 kvLines=4≥2，parseBlockLegacy 分发 parseKeyValueBlock），
  实为末个命中——以本实证为准；
③ 地址行进不了 kv → fillFallbacks 地址兜底扫描误抓"· 销售单号"行（含数字+号，
  过 ADDRESS_HINTS 弱特征）。

═══ 改动清单（4 文件，最小改动只增不改）═══
1. src/lib/parser-core.ts:76-77：+KV_BULLET_PREFIX_RE 行首项目符号清洗常量
   （·•∙‣⁃▪▫・●○＊-，唯一清洗出口）；
2. src/lib/parser-engines.ts:27：import 列表 +KV_BULLET_PREFIX_RE；
3. src/lib/parser-engines.ts:76-77：parseKeyValueBlock 行循环
   .trim() 后 .replace(KV_BULLET_PREFIX_RE,'')——清洗后入键值口/400热线/
   电话兜底全链判定（既有19样例零行首符号，零影响）；
4. src/lib/parser-engines.ts:125-126：电话兜底加双守卫——
   !kv.has('联系电话')（防自重入后写覆盖，首个兜底电话胜出）+
   !/网点电话|项目经理|售后|客服/.test(line)（网点/项目经理/售后/客服类
   号码禁入客户电话位）；键表 KV_FIELD_KEYS 未动（甲方既有裁定）；
5. src/lib/parserRegressionSamples.ts:31-33：+1 脱敏样例（20 条，19 旧样例零改动）；
6. src/constants/releaseNotes.ts:3：头追加一条。
parser.ts 入口结构零改动；数据红线全脱敏。

═══ 验收实证 ═══
1. 新样例脱敏格式=验收1指定（奇瑞公告体/假号/某小区N栋N室/销售单号假数/
   不带桩30米7kw），expect：phone=13800001111、address=安徽省安庆市某区某街道
   某小区14栋104、brand=奇瑞、meters=30、不带桩→仅安装、本杨标记对——全过；
2. 回归 20/20 ALL GREEN（19 旧+1 新；文件条数对拍=20）；
3. 甲方原单两错场景走查（脱敏等价推演）：修前 phone=13900002222/address=·销售单号行，
   修后 phone=13800001111/address=安徽省安庆市某区某街道某小区14栋104，两错全消；
4. npm run build rc=0（tsc 0 错误+双 build-check 过）；
6. releaseNotes 头追加一条 ✓。

═══ 增量纯净声明 ═══
diff 面=上列 4 文件，与任务书范围一致；调试脚本（dbg/repro/regression-run）已删除，
不入库；git status 除 4 载荷文件外零差异。

═══ 更新说明 ═══
修复群公告行首符号导致电话/地址识别错误

═══ 自查实证清单 ═══
- 验收1（新样例格式与 expect）：parserRegressionSamples.ts:31-33，name/input/expect 全字段脱敏；esbuild 本地 runner 输出该样例全字段命中；
- 验收2（回归20/20）：runner 脚本（本地临时，未入库）输出"回归 20/20"，样本文件条数对拍=20；
- 验收3（原单两错走查）：复现脚本修前输出 phone=13900002222/address="· 销售单号：…"，修后 phone=13800001111/address=安徽省安庆市某区某街道某小区14栋104；
- 验收4（build）：npm run build rc=0，末行"[BUILD CHECK] 后置检查通过"，tsc 无错误输出；
- 验收5（自查清单）：本清单；每条对应文件:行或命令+输出摘要；
- 验收6（更新说明）：releaseNotes.ts:3 头追加，旧 13 条逐字不动；
- 复现归因（任务1）：dbg 逐环输出=KV 路径 kvLines=4≥2，电话兜底末写覆盖（guard=true/true 两次写入）。
