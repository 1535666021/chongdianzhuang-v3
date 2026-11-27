## 〇、本窗任期（2026-11-27 起，三通道扫描铁律上岗）

- 本窗扫描姿势：main 通道+task/* 分支逐个开 specs 查 delivery+看板通道，三者缺一不可（253-5/256/260/259 四连误判教训）
- 令牌故障记录：甲方投喂 ghp 首次 401（本窗 shell 单引号未展开变量，误报令牌失效，实为有效——已复盘）
- git 协议 HTTP/2 断流不通，合并/推送全程走 GitHub API（merges/git database/contents）；API 更新 ref 不触发 push 事件，Pages 部署须 workflow_dispatch

### 本窗经手销号
| 单 | 销号@SHA | 复验实证 |
|---|---|---|
| P0-261 已完成虚拟列表 | 82d40d0e（合并@main） | 三补丁逐字吻合（virtualEnabled 提前 L130/slice 条件化 L135/按钮条件 L288/单一事实源）+diff 面无混笔+build 全过 |
| P0-257-R1 增补（多工作表识月+默认上月+可视化报告） | dc3651cb（合并@main，解冲突三文件：reconcile/ReconcileTool 取分支版，releaseNotes 四条目并存） | 本窗自建 runner 20/20（prevMonth 跨年/识月三形态/当月过滤时间戳/空域双端/多表取行/对账往返 matched+acct-only+sys-only）+UI 四声明审计+合并版全量 build 全过 |

### 本窗经手打回
| 单 | 判定 | 备注 |
|---|---|---|
| P0-259 | ~~打回 R1~~→**撤销** | 基于旧分支头 68b60fc0 判孤儿文件未删；查 main 提交史实证 11-26 23:04 已由前窗合并销号 4199e4cd（五删 2 改版含孤儿文件全删），打回前提不成立，return-R1 未落库作废 |

### 待办
- 部署 run 45995229427（workflow_dispatch@ecad85b7）in_progress，成功即回填看板+version.json 对拍
- P0-247 v4/249 甲方裁暂停不提示不重提；P0-248 待施工；V4 优化单挂起等甲方补图

# 核验窗交接书（2026-11-27 06:57，HEAD 1a193417）

## 一、窗口身份
- 角色：充电桩 v3 项目核验窗（GitHub 1535666021/chongdianzhuang-v3）
- 本窗任期：2026-11-08 至 11-25，经手 P0-238→250 十三单全销（打回整改闭环 4 单）
- 11-25 晚新窗接班：探测令 HTTP 200 实证上岗，上岗双读完成（VERIFY-ONBOARDING+SUPERVISOR-HANDOVER）
- 下一窗口令"核验"=按 verify-task/任务书口径过秤；文书落库即视为送达
- **双窗同步走仓库看板** .monkeycode/WINDOW-SYNC.md（甲方 11-26 07:00 令：状态牌+读写约定+253-5 教训固化，禁口头同步禁单方定论）
- **部署归本窗**（RULES L70-72，2026-11-25 甲方裁定）：上线/部署/回滚统一由核验窗执行；施工队只编码/验证/Build/交付 delivery.md，不得自行 Pages/生产部署、线上配置变更、Workflow 密钥调整；本窗按任务书+build 产物+回拉核验+甲方口令操作，部署结果写回 delivery.md/状态快照；Pages 500 判别定式见 ENV-PITFALLS（@d470e3eb）

## 二、在途（按优先级）
| 单 | 状态 | 要点 |
|---|---|---|
| P0-247 v4 | **甲方裁暂停**（11-25 18:18，不提示不重提） | d51eb4d+370a7a3（11-22）：勘测填入即同步+isCableMat 正则字面 bug+件4 形态B；v3 已销 @955d0f6 |
| P0-249 | **甲方裁暂停**（11-25 18:18） | 数据清洗单（11-22 凌晨）；状态矛盾（档案记已销号 vs 交接书待验）随暂停挂起 |
| P0-248 | 待施工（10 天无动静） | 漏保矩阵废除 v2 钉版 @083c9f8；漏保器每单必含必计，漏保盒 L235 禁动，三层账不动 |

238-250 销号行全在交接书二节；各单 return-R*/delivery 含本窗裁定与边界待裁项。

**P0-257 已销号 @8bca8068**（11-26 15:2x 复验全过，甲方直连口令=追认，无 verify-task.md 破链记账）：基线 main 73cdd65e...branch task/P0-257-reconcile 8491cbc0 合并=8bca8068；diff 恰 8 文件零超范围（reconcile.ts 新立 313 行纯函数核/ReconcileTool.tsx 138 行/SettingsPage 五 spot/releaseNotes 头插/package+lock xlsx0.18.5/delivery.md）；本窗自跑 runner 26 断言 FAILS=0（标准化 6+五档匹配+八差因闭合+补贴管理费内部键+CSV BOM+汇总计数闭合）——施工队 9 断言声明不采信，以本窗实证为准；tsc0+build 前后 [BUILD CHECK] 全过；红线三 grep 零命中（fetch/console/store）；回归 20/20 零交集沿用；非 FAIL 观察项 2：①normalizePhone 不剥 0086/双 86 前缀（TASK 字面「去重复+86」未列 0086，回落 3/4 档兜住，上报监理待甲方圈是否补）②一键清除不复位文件选择框（无数据残留，纯 UX）。

**P0-252 已销号 @1307eb65**（11-25 晚复验全过）：基线 dad9b17d→1307eb65 diff 恰 3 src 文件零超范围（Statistics.tsx ALL_MONTHS 哨兵+首项「全部」+selectedOrders 三元短路零拷贝+exportMonth 统一变量联动导出钮/ProfitDetailModal+rangeLabel 传参/MonthDetailSections 两组件 rangeLabel 默认'该月'空态文案/releaseNotes 头插 1 条）；runner 9/9 FAILS=0（ALL 5=5 含 createdAt 兜底单/原引用返回/2026-11 过滤 3 单/10 月 1/9 月 1/哨兵不在真实月份集/空集合 ALL=0）；parser 回归 20/20；build 三连全过；任务书 F 条"另发现不改"已证保持原样（exportReconciliationCsv 函数体零改动，文件名 对账单_${month}.xlsx 原样，ALL 传'全部'由传参侧成立）。

**P0-268 已销号 @ae045cb**（11-28 07:40 复验全过+部署成功）：task/P0-268-home-total-region 复验（runner 9/9：去省一级=市→区县→乡镇三级树/怀宁黄墩镇+石镜乡分组/街道入乡镇层/baseCount 一单两标签只计 1——useTagCounts 为 React hook 顶层调用违规=我方构造错删除该断言；回归 20/20+build 三连）→合并（5 src：OrderFilterBar 3 文件+RegionTree 2 文件 97 插 59 删恰声明+releaseNotes）；部署 run 46083447285；线上 version.json=ae045cb 对拍全同。

**P0-265 已销号 @bc49b28**（11-28 06:20 复验全过+部署成功）：task/P0-265-list-filter-region（262/263/264 合并单）复验（runner 15/15：省市区三级树聚合/乡镇需街道后缀/路径导航/匹配七例——初报 4 FAIL 均我方构造错：树为虚拟根 4 层模型误设、皖苏同省误数、乡镇格式误用；回归 20/20+build 三连）→合并（5 src：RegionTree.tsx/regionTreeModel.ts 新增+OrderList/App/releaseNotes）；部署 run 46075628980；线上 version.json=bc49b28 对拍全同。

**P0-259 已销号 @4199e4c**（11-27 07:12 复验全过+部署成功）：task/P0-259-remove-oneoff-tools 复验（grep 五组件名+五菜单 id 全仓零命中 ZERO-DANGLING/SubBrandFix 独立 case/reconcile 保留/haptics 保留+分支 build 三连+合并态 build 三连）。**两处合并纠正（如实标注）**：①分支 orderStore 删 256-R2 registerFrequencyOrdersProvider=会致 256-R1 懒重算回退→合并时保留 main 版 provider（256R1-regress 3/3 无回退实证）；②分支基于老 main 缺 260 resolveCustomerReceivable→orderCalc/orderStore 保 main 版只删四组件文件+SettingsPage 菜单合并；③交付声明「orderCalc 死函数删」实 diff 无此项=未执行待裁。部署 run 45909209001；线上 version.json=4199e4c 对拍全同。

**P0-257-R1 已销号 @956448e**（11-27 02:00 复验全过+部署成功）：task/P0-257-R1-direct-system 分支复验（runner 12/12：单号映射/客户名标准化/品牌透传/收费/日期三源/安装费近似/无字段置 0/月份过滤/空范围不造假/时间戳转 ISO——初报 3 FAIL 均我方构造错：name 字段名/月份显式传参/恒 0 设计语义误读为直读；回归 20/20+build 三连）→合并（reconcile.ts +50/ReconcileTool 20 改恰声明增量）；部署 run 45871594298；线上 version.json=956448e 对拍全同。

**P0-256-R1 已销号 @65d77d33**（11-27 01:40 复验全过）：证据型返工单零代码改动（256 合并 16da254 已覆盖 R1 全部要求）——grep 三证（isFreeQuotaMaterial=0 命中/isCable36=0/三入口 sortMaterialsByFrequency 在）+runner 10/10（YJV/PVC/3×6/30m 计频/低频不删不藏/最高频第一/同频 tie-break 稳定/单订单增量+1/三入口同序——初报 3 FAIL 均我方构造错：tie-break 语义期望矛盾、传数组而非单订单、进行中过滤层位置误设）+build 三连全过；无代码可合无需部署（main 已 256 版）。

**P0-260 已销号 @26db418**（11-26 23:45 复验全过+部署成功）：task/P0-260-customer-accept 分支复验（runner 10/10：override650 优先/含 0 优先/留空走政策/round2dp/扣点随实收+回归 20/20+build 三连）→文件级合并（恰 5 文件 29 插 2 删：orderCalc 纯函数 resolveCustomerReceivable/useCompletion memo 一行/OrderComplete 实收输入/completion.ts 字段/releaseNotes 头插）；部署 run 45851872266；线上 version.json=26db418 对拍全同。

**P0-256 已销号 @16da254**（11-26 17:45 复验全过+部署成功）：task/P0-256-frequency-sort 分支复验（runner 7/7：3*6 免配额入频/仅已完成统计/provider 懒重算/不重复计数+回归 20/20+build 三连）→文件级合并 main（useMaterialFrequency +18-8/orderStore +3-2/releaseNotes 头插保 257 条目）；部署 run 45794870567；线上 version.json=16da254 对拍全同。

**P0-253-6 已销号 @9e5988b5**（11-26 07:30 复验全过+部署成功）：diff 恰 4 src+本书零超范围（importRestore.ts 新增 verifyAndParsePackage 三层校验 sha256/JSON/schema+mergePackages today 覆盖 base+computeImportPlan 四分类（非 order=noop/delete→墓碑/upsert 无→adds/深等→noop/不同→conflicts）+applyImportPlan 默认冲突 skip 不静默+backupBeforeImport {at,orders} 备份键可回滚/ImportRestoreTool.tsx 选文件+sha+密钥→还原报告/SettingsPage 接线/releaseNotes 行）；runner 15/15（四分类计数/默认跳过 A 保本地/墓碑 T 删/新增写入/take-remote 生效/备份包装回环/merge 同键覆盖/三层校验过/坏 sha 拦/坏 JSON 拦——初报 B2 FAIL 系我方构造错：备份={at,orders} 包装我误比裸数组）；回归 20/20；build 三连全过；部署 run 回拉另报。

**P0-253-5 已销号 @6570523**（11-26 06:58 整改复验全过）：打回点「owner/repo 白名单校验」整改落地=repoUpload.ts +14（validateRepoConfig：owner 字母数字连字符≤39 首尾禁连字符/repo 字母数字._-≤100）+uploadSyncPackage 入口拦截（非法配置零 fetch 不外发）+RepoUploadTool.tsx +3 保存红条；整改增量 diff 恰 5 文件零超范围（含 return-R2535 送达实证节）；runner 11/11（合法零错/首连字符/40 超限/39 合法/空格/101 超限/100 合法/入口拦截零外发/放行无配置错）；回归 20/20 沿用（零交集）+build 三连全过；部署 run 回拉另报。**误判更正**：核验窗 06:30「整改笔不可达」结论系 fetch 短 SHA 方法错+per_page=2 核查不严所致（6570523 一直在 main 祖先链），误发重新推送令（f957b5a）与 delivery 误令节已标注作废，向施工队致歉；教训录 ENV-PITFALLS：判存否必用 compare API 或全 SHA fetch，禁短 SHA+禁小样本定论。

**P0-253-4 已销号 @e9cc9e39**（11-26 00:45 复验全过+部署成功）：diff 恰 7 文件零超范围（changeQueue.ts 新增 QUEUE_DAY_KEY/SEQ_KEY/TODAY_AGE_KEY/TODAY_SHA_KEY 四键分离（253-2 契约键不变）+computeOrderDiff 四态（未变不入队/修改 upsert/新增 upsert/真删 tombstone）+getQueueStatus+flushQueue 失败保留暂存+scheduleFlush 30s 防抖幂等守卫/ChangeQueueTool.tsx 状态展示/SettingsPage 接线/App.tsx 挂启动链/releaseNotes 头插）；runner 14/14（四态 diff 全对/无公钥 flush 失败暂存保留/有公钥密文双键+队列清空+无明文 today-new.json+私钥解密回环 counts 吻合/契约键数组格式/防抖 30s）；回归 20/20；build 三连全过；部署 run 回拉另报。

**P0-253-3 已销号 @269dcf0**（11-26 00:40 复验全过+部署成功）：diff 恰 7 文件零超范围（localAge.ts 新增 age v1 全套：parsePublicKey bech32/parseSecretKey bech32m/secretKeyToPublicKey X25519/canonical b64/encryptWithPublicKey 临时密钥+HKDF(ephShare‖recipient, INFO_WRAP)+ChaCha20Poly1305 包 fileKey/decryptWithSecretKey/sha256Hex/build+parseSha256File/LocalAgeTool.tsx 选 JSON→.age+.sha256 双下载/选 .age+私钥→还原（可选 sha256 校验）/SettingsPage 接线/releaseNotes 头插/package+lock @noble/ciphers+@noble/hashes）；runner 10/10（公钥加密私钥解密回环/错私钥解不开/篡改被拦/空载荷/70KB 跨块/sha256 回环/公私钥推导一致）；回归 20/20；build 三连全过；部署 run 回拉另报。

**P0-253-2 已销号 @a7f1f36**（11-26 00:30 复验全过+部署成功）：diff 恰 4 src 文件+本书零超范围（exportSync.ts 新增 schema v1 五要素+dedupeChanges 去重保留后条+countChanges+buildExportPackage+validateExportPackage 错误收集+readPendingChanges 队列契约 cdz_v3_change_queue/ExportSyncTool.tsx 组包→离线自校验→失败红条→cdz-sync-<baseDate>.json 下载/SettingsPage.tsx FileDown+类型联合+菜单项+case 渲染 5 处接线/releaseNotes 头插与 255/253-1 并存）；runner 13/13（组包五要素/离线校验过/baseDate 透传/同键去重保留后条/counts 语义 total=3 upserts=2 deletes=1/反向五证全拦/队列空包合法+回环）；三不做零出现实证（crypto/encrypt/监听/fetch 全 0）；回归 20/20；build 三连全过；部署 run 回拉另报。

**P0-253-1 已销号 @3c3136ff**（11-26 00:18 复验全过+部署成功）：diff 恰 6 文件零超范围（ageKey.ts 新增 generateAgeKeyPair X25519+bech32/bech32m 公钥 age1.../私钥 AGE-SECRET-KEY-1...+persistPublicKey 只存公钥+buildSecretKeyFileContent 私钥下载文件含保管提示/BackupKeyManager.tsx 私钥 Blob 一次性下载，内存即焚绝不写 localStorage/SettingsPage.tsx KeyRound 图标+backupkey 菜单节+render 接线/package.json+lock @noble/curves+@scure/base/releaseNotes 行与 255 并存）；runner 10/10（age1 前缀/密钥对不同/公钥持久化往返/私钥文件三要素/私钥零持久化全键扫描/公钥长度）；回归 20/20；build 三连全过；部署随销号笔 push 触发，回拉对拍另报。

**P0-248 已销号 @132a990**（11-26 06:20 复验全过+部署成功）：diff 恰 4 文件零超范围（orderCalc 矩阵废 needBreakerCost 豁免移除→漏保器每单必计/漏保盒行未动/breakerRowSelfCheckFix 自检冻结 return {items:[]} 幂等零写入/useCompletion 恒 false+手加漏保行 skip 禁双计/releaseNotes 头插）；红线实证：**漏保盒 L235 在 diff 中 0 出现=零改动**；runner 9/9（吉利/领克/五菱 3.5kW 漏保器 C40 必计金额>0+漏保盒=5+单一行不双计+C40=26.8+老单冻结 items=[]——初报 5 FAIL 均我方构造错：input 缺 extraItems 必填字段+漏保器行名='C40'）；回归 20/20；build 三连全过；部署 run 回拉另报。

**P0-255 已销号 @15228a1**（11-26 00:10 复验全过+部署成功）：diff 恰 5 src 文件零超范围（AddMaterialsSheet 价表数据源+品牌过滤+频率排序+客户价载荷+删弹窗点价改/MaterialPicker 频率排序 slice 前+搜索后+brandName prop+模板布尔预映射/useCompletion.addMaterials 客户价进 settlementPrice+customerSubtotal round 同口径+findCostPrice 成本绑定/OrderComplete brandName 一行/releaseNotes 头插）；runner 13/13 双版本同绿（四品牌候选纯净/空品牌空候选/fakeFreq 降序/进单映射 80×10=800/findCostPrice 独立/251 链路零触碰 isFreeQuotaMaterial+30m total 572 基线对拍一致）；回归 20/20；build 三连全过；部署 run 45651413963 @dd7068f success，线上 version.json=dd7068f 对拍全同，delivery 已写回部署结果。

**P0-251 已销号 @c9f6f82**（11-25 晚复验全过）：diff 面恰 4 src 文件零超范围（orderCalc 唯一出口 isCableLikeSurveyCharge 五分支/useSurvey quota=freeQuota>0?fq:套餐米数+toggleAddon 改接/SurveyModal 删旧字面空格正则+报告 quota 同口径+单位按 mat.unit/releaseNotes 头插 1 条）；runner 28 断言 FAILS=0（判定矩阵 8+A/B/C 组 0/0/225+报告行「35米（超5米）× ¥45 = 225.00」+D 组+回退组+E 组成本侧零扰动无双计+回归组 310/311 全量计费/253 套包 1350）；parser 回归 20/20；build 三连全过。

## 三、环境坑位（实测定式，11-25 晚增补版）
1. /tmp 内核级重置（本晚 4 次，最短 8 分钟间隔）：重建=git clone --depth 1 裸仓循环 3-4 次（本仓 public 未认证可读；-c http.version=1.1 写法本内核 git 不兼容，裸 clone 反而通；报错形态多样：TLS 断连/expected flush after ref listing/codeload 404）+ npm install --ignore-scripts（esbuild 0.21.5 免 postinstall 可用）
2. 文书落库走 contents API PUT 带 sha 防覆盖；短 SHA（7 位）作 trees/contents 的 ref 会 404，必须完整 SHA
3. zustand SSR 组件实证：getInitialState create 时固化——种子预写 mock localStorage（复合键 cdz_v3_*_list/data）
4. mock localStorage 枚举不可达（闭包 mem）：备份/日志键用 getItem 直查或 RUN_AT 拼键
5. runner 断言纪律：初报 FAIL 先疑构造错（字段名/返回结构/键名/期望值），双版本对拍定无回归再判真 FAIL——本窗 20+ 起初报 FAIL 全是我方构造错，无一误伤交付（251 复验再证：J8b/E2 两起初报 FAIL 均构造越界，修正后全绿）
6. esbuild：react-dom/server 需 format=cjs；import.meta.env 需 define 注入；ESM 提升→mock 独立文件首位 import
7. 11-25 晚新增：git/codeload 通道 TLS 断连频发（gnutls_handshake -110），Contents API raw 带令牌直连最稳；API 对拍单文件 sha256 可替代"基线补装依赖对拍"（diff 面已证零改动=行为必然一致）；/tmp 连会话内都被卷——所有文书/脚本一 cell 内生成即用，禁依赖 /tmp 留存

## 四、资产
/mnt/agents/output/v3work/：nm241.tgz（依赖，跨沙箱 /mnt 不延续已实效，以 npm install --ignore-scripts 重建为准）+ 各单快照 tar

## 五、令牌纪律
ghp 甲方投喂，禁明文/禁落文件/用完即弃；跨窗必须重新投喂，本窗未留存。

## 五点五、部署流（甲方裁定 11-25）
核验通过→本窗执行 Pages/生产部署→回拉核验（线上 version.json 对拍 HEAD）→结果写回该单 delivery.md/状态快照→销号行注明部署笔。

## 六、待办
1. **P0-247 v4 / P0-249 甲方裁暂停（11-25 18:18）——不提示不重提**，恢复以甲方口令为准
2. 248 动漏保盒 L235 或三层账=直接打回（红线）
3. P0-253-5 打回整改**已闭环**（6570523 复验销号+部署）——旧返工令节作废保留作教训
4. 同步机制三件套在跑：WINDOW-SYNC 看板+交付三件套（分支+delivery+翻牌）+核验窗双通道扫描（看板待验行+task 分支头快照）
5. 当前无在验单，核验窗待命（零动作，不轮询）

—— 核验窗（2026-11-25 晚班）
