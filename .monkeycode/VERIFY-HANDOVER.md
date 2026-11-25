# 核验窗交接书（2026-11-26 00:14，HEAD dd7068f）

## 一、窗口身份
- 角色：充电桩 v3 项目核验窗（GitHub 1535666021/chongdianzhuang-v3）
- 本窗任期：2026-11-08 至 11-25，经手 P0-238→250 十三单全销（打回整改闭环 4 单）
- 11-25 晚新窗接班：探测令 HTTP 200 实证上岗，上岗双读完成（VERIFY-ONBOARDING+SUPERVISOR-HANDOVER）
- 下一窗口令"核验"=按 verify-task/任务书口径过秤；文书落库即视为送达
- **部署归本窗**（RULES L70-72，2026-11-25 甲方裁定）：上线/部署/回滚统一由核验窗执行；施工队只编码/验证/Build/交付 delivery.md，不得自行 Pages/生产部署、线上配置变更、Workflow 密钥调整；本窗按任务书+build 产物+回拉核验+甲方口令操作，部署结果写回 delivery.md/状态快照；Pages 500 判别定式见 ENV-PITFALLS（@d470e3eb）

## 二、在途（按优先级）
| 单 | 状态 | 要点 |
|---|---|---|
| P0-247 v4 | **甲方裁暂停**（11-25 18:18，不提示不重提） | d51eb4d+370a7a3（11-22）：勘测填入即同步+isCableMat 正则字面 bug+件4 形态B；v3 已销 @955d0f6 |
| P0-249 | **甲方裁暂停**（11-25 18:18） | 数据清洗单（11-22 凌晨）；状态矛盾（档案记已销号 vs 交接书待验）随暂停挂起 |
| P0-248 | 待施工（10 天无动静） | 漏保矩阵废除 v2 钉版 @083c9f8；漏保器每单必含必计，漏保盒 L235 禁动，三层账不动 |

238-250 销号行全在交接书二节；各单 return-R*/delivery 含本窗裁定与边界待裁项。

**P0-252 已销号 @1307eb65**（11-25 晚复验全过）：基线 dad9b17d→1307eb65 diff 恰 3 src 文件零超范围（Statistics.tsx ALL_MONTHS 哨兵+首项「全部」+selectedOrders 三元短路零拷贝+exportMonth 统一变量联动导出钮/ProfitDetailModal+rangeLabel 传参/MonthDetailSections 两组件 rangeLabel 默认'该月'空态文案/releaseNotes 头插 1 条）；runner 9/9 FAILS=0（ALL 5=5 含 createdAt 兜底单/原引用返回/2026-11 过滤 3 单/10 月 1/9 月 1/哨兵不在真实月份集/空集合 ALL=0）；parser 回归 20/20；build 三连全过；任务书 F 条"另发现不改"已证保持原样（exportReconciliationCsv 函数体零改动，文件名 对账单_${month}.xlsx 原样，ALL 传'全部'由传参侧成立）。

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
3. 当前无在验单，核验窗待命（零动作，不轮询）

—— 核验窗（2026-11-25 晚班）
