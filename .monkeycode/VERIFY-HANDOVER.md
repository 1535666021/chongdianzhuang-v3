# 核验窗交接书（2026-11-22 08:41，HEAD c8245ae）

## 一、窗口身份
- 角色：充电桩 v3 项目核验窗（GitHub 1535666021/chongdianzhuang-v3）
- 本窗任期：2026-11-08 至 11-22，经手 P0-238→247 十单全销（打回整改闭环 4 单：241 两轮/242 R1/243 R1）
- 下一窗口令"核验"=按 verify-task/任务书口径过秤；文书落库即视为送达

## 二、在途（均无物可验）
| 单 | 状态 | 要点 |
|---|---|---|
| P0-247 v4 | 重开·待施工 | task.md @2f09a38（11-21）：件1 新=勘测填入即同步（isCableMat 正则字面 bug：`\|`两侧带空格几乎全灭+244 新增行无 categoryCode）+原件 2/3/4+件4 形态B（存量兜截图类）。v3 已销号 @955d0f6 |
| P0-248 | 待施工 | @083c9f8 v2 钉版（11-15）：漏保矩阵废除——只管漏保器（每单必含必计，免配分支废除），漏保盒 L235 无条件行禁动（甲方纠正实录），三层账不动 |

238-247 销号行全在交接书二节；核验过程方法与本窗裁定（含边界待裁项）见各单目录 return-R*/delivery。

## 三、环境坑位（实测定式）
1. /tmp 内核级重置（分钟~小时级）：重建=codeload tar（约 10 秒）+ /mnt/agents/output/v3work/nm241.tgz 恢复依赖，20 秒完事；禁 npm install（/mnt ENOTCONN）
2. 整仓 clone 网络不稳（HTTP2 framing 复发）：用 codeload+contents API；文书落库走 contents API PUT（带 sha 防覆盖）
3. zustand SSR 组件实证：getInitialState create 时固化，setState 注入读不到——须种子预写 mock localStorage（复合键 cdz_v3_*_list/data）
4. mock localStorage 枚举不可达（闭包 mem）：备份 key 用 RUN_AT 值拼或 getItem 直查
5. runner 断言纪律：初报 FAIL 先疑构造错（字段名/key 格式/期望值口径），双版本对拍定无回归再判真 FAIL——本窗 10 余起初报 FAIL 全是我方构造错，无一误伤交付
6. esbuild 打包：react-dom/server 需 format=cjs；ESM import 提升→mock 模块须独立文件首位 import；import.meta.env 需 define 注入

## 四、资产
- /mnt/agents/output/v3work/：nm241.tgz（依赖）+ 各单 h*.tar.gz 快照
- /tmp 会被重置，工作区必须重建于 /tmp、tar 包留 /mnt

## 五、令牌纪律
ghp 由甲方投喂，禁明文输出/禁落任何文件/用完即弃。跨窗必须重新投喂，本窗未留存。

## 六、待办
1. 247 v4/248 任一交付→甲方口令"核验"→按第四节口径过秤（预期 runner 断言+回归 20/20+tsc+build+双版本 diff 对拍）
2. 248 若动漏保盒 L235 或三层账=直接打回（甲方纠正实录红线）
3. 247 v4 件1 若只改 isCableMat 正则不补 categoryCode 校验=待裁项

—— 核验窗（2026-11-22）