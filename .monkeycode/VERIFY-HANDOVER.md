# 核验窗交接书（2026-11-25 15:40，HEAD 5d988ed）

## 一、窗口身份
- 角色：充电桩 v3 项目核验窗（GitHub 1535666021/chongdianzhuang-v3）
- 本窗任期：2026-11-08 至 11-25，经手 P0-238→250 十三单全销（打回整改闭环 4 单）
- 下一窗口令"核验"=按 verify-task/任务书口径过秤；文书落库即视为送达

## 二、在途（按优先级）
| 单 | 状态 | 要点 |
|---|---|---|
| P0-251 | 已交付·待验 | c9f6f82（11-25）：套包外线缆敷设客户侧免费额度唯一出口（isCableLikeSurveyCharge 判定统一）；delivery @261125-P0-251，任务书 @2026-11-25-P0-251/TASK.md（注意：251 双目录，监理换命名约定） |
| P0-247 v4 | 已交付·待验（压 4 天） | d51eb4d+370a7a3（11-22）：勘测填入即同步+isCableMat 正则字面 bug+件4 形态B；v3 已销 @955d0f6 |
| P0-249 | 已交付·待验 | 数据清洗单（11-22 凌晨） |
| P0-252 | 签发·待施工 | TASK.md @2026-11-25-P0-252（11-25 07:39） |
| P0-248 | 待施工（10 天无动静） | 漏保矩阵废除 v2 钉版 @083c9f8；漏保器每单必含必计，漏保盒 L235 禁动，三层账不动 |

238-250 销号行全在交接书二节；各单 return-R*/delivery 含本窗裁定与边界待裁项。

## 三、环境坑位（实测定式，同 11-22 版）
1. /tmp 内核级重置：重建=codeload tar（约 10 秒，偶发失败重试或 git clone --depth 1 -c http.version=1.1 循环 3-4 次）+ /mnt/agents/output/v3work/nm241.tgz 恢复依赖
2. 文书落库走 contents API PUT 带 sha 防覆盖；短 SHA（7 位）作 trees/contents 的 ref 会 404，必须完整 SHA
3. zustand SSR 组件实证：getInitialState create 时固化——种子预写 mock localStorage（复合键 cdz_v3_*_list/data）
4. mock localStorage 枚举不可达（闭包 mem）：备份/日志键用 getItem 直查或 RUN_AT 拼键
5. runner 断言纪律：初报 FAIL 先疑构造错（字段名/返回结构/键名/期望值），双版本对拍定无回归再判真 FAIL——本窗 20+ 起初报 FAIL 全是我方构造错，无一误伤交付
6. esbuild：react-dom/server 需 format=cjs；import.meta.env 需 define 注入；ESM 提升→mock 独立文件首位 import

## 四、资产
/mnt/agents/output/v3work/：nm241.tgz（依赖）+ 各单快照 tar

## 五、令牌纪律
ghp 甲方投喂，禁明文/禁落文件/用完即弃；跨窗必须重新投喂，本窗未留存。

## 六、待办
1. P0-251/247 v4/249 三单已交付待验——甲方口令"核验"即过秤（251 优先，今天新交付）
2. 247 v4 件1 若只改 isCableMat 正则不补 categoryCode 校验=待裁项
3. 248 动漏保盒 L235 或三层账=直接打回（红线）
4. 252 交付后排队验

—— 核验窗（2026-11-25）