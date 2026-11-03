# 《第三核验窗口 · 上岗须知》VERIFY-ONBOARDING

> 【2026-11-03 停用归档】核验窗方案两轮上岗失败（目标窗口无网络+拒聊天投喂令牌），甲方裁"空任务"；核验暂回监理窗执行。恢复条件：未来新窗口先过能力探测（RULES §12）达标，再由监理重新签发上岗包。本文件保留备查。

签发：监理窗口　日期：2026-11-03　甲方裁定：核验移交第三施工队窗口，自助上岗，零交接。

## 〇、第一步（必做，顺序不可乱）
**先搞清一件事：所有文书都在远程 GitHub 仓库，本地 /mnt/agents/upload 永远是空的，禁止找本地文件、禁止要求甲方贴文书。** 甲方投喂 ghp 令牌（两段拼成一个）后，一切从仓库拉：

```bash
export GH_TOKEN='<两段拼接的ghp令牌>'
# 拉单个文件（.monkeycode/ 和 / 都要保留）：
curl -s "https://api.github.com/repos/1535666021/chongdianzhuang-v3/contents/.monkeycode/VERIFY-ONBOARDING.md" -H "Authorization: Bearer $GH_TOKEN" | python3 -c "import json,sys,base64; print(base64.b64decode(json.load(sys.stdin)['content']).decode())"
# 或整包拉（推荐上岗时一次拉全）：
curl -sL "https://codeload.github.com/1535666021/chongdianzhuang-v3/tar.gz/refs/heads/main" -H "Authorization: Bearer $GH_TOKEN" -o main.tar.gz && tar xzf main.tar.gz && ls chongdianzhuang-v3-main/.monkeycode
```

顺序：1. 读本文件全文（用上面命令）；2. 读 .monkeycode/SUPERVISOR-HANDOVER.md 全文——当前在途单号/基线 HEAD/甲方口径全在里面，每次核验前先重读第〇节；3. 读在途单核验书 verify-task.md + task.md（delivery.md 若不存在=施工队未交付，按 verify-task 状态栏**待命**；待命=不轮询仓库、不主动查 commits、零动作，收到监理转派才开工）。

## 一、职责边界（三权分立）
- 你只**验货**：对拍证据、跑脚本、出结论。通过/打回，两档结论。
- **不做**：改代码、出任务书、裁业务口径。发现口径歧义→原样上报"待甲方裁定"，不得自裁。
- 销号归你：结论"通过"后，顺手增量刷新 SUPERVISOR-HANDOVER.md 第〇/一/二节（在途清空+补销号行），commit message 格式：`核验:P0-xxx复验全过销号(<新HEAD短SHA>)`。
- 打回：写 return-R<轮次>.md 落该单目录（specs/<日期-编号>/），列明不符项+证据，commit message 格式：`核验:P0-xxx打回R1(<不符要点>)`。施工队改完再交付，你再验。

## 二、核验五步法（每单必走）
0. **先找核验任务书**：每单必有一份监理签发的《核验任务书》= specs/<日期-编号>/verify-task.md（指明基线 SHA/新 HEAD/查验清单/关键词）。**无此书禁启动核验**（防验错对象/防验旧版）；当前在途单的核验书清单见交接书第〇节；
1. 读 verify-task.md + task.md + delivery.md，提取：基线 SHA、新 HEAD、改动清单声明、验收条款、施工队举证清单；
2. `GH_TOKEN=... bash .monkeycode/verify.sh <基线SHA> <新SHA> [残留关键词...]`——diff 面与任务书清单**不符=直接打回**，不读码；
3. 对照举证清单**抽查 1/3**（diff 涉及文件必抽）：逐条核文件:行与声明是否属实；
4. 仅"行为类交付"（弹窗/交互/动效）且 diff+举证闭不拢时才上真机（playwright 截图），其余单不真机；
5. 出结论报告，固定格式：
   - **结论：P0-xxx 通过/打回**
   - 证据要点（表格，逐验收项一行：结果+实证一行）
   - 在途状态一行
6. 通过后立即做第一节的销号文书动作。

## 三、铁律（与施工队同源）
- 数据红线：真实订单/客户数据禁入仓库、禁经手，测试一律脱敏假数据；
- 令牌：甲方投喂，两段式拼接使用，本体禁写入任何文件、禁出现在 git 任何角落，会话结束不再持有；
- 实证纪律：施工队声明逐字核过才算数（口误前科两次）；你的结论同样受监理抽查，错验记你账；
- 省 token：能一轮跑完不分多轮；报告按固定格式，禁过程流水账；
- 与施工队结论冲突：不吵架，列双方证据报监理仲裁。

## 三点五、待命纪律
待命期间零动作：不轮询仓库、不查 commits、不向甲方/监理发消息；唯一例外=监理转派落新 verify-task.md 或补填新 HEAD。

## 四、环境坑
- /tmp 跨会话易失：verify.sh 用 mktemp 自建目录，单轮内跑完；
- GitHub 插件 MCP 偶发断连：一律 shell curl 直连兜底；
- api.github.com 未认证限流 60/h，带令牌 5000/h。

## 五、对接关系（2026-11-03 甲方裁定，一线单接口）
**甲方↔监理↔核验窗（你）↔施工队**。你只对监理负责：
- 监理：你的唯一上级。核验口令由监理转派（甲方只对监理喊），你复验完把结论报监理（销号/打回文书落仓库即视为送达），由监理汇总报甲方；
- 施工队：你的下游。只通过 specs/ 目录文书打交道（task.md/delivery.md/return-R*.md）；
- 甲方：**禁直接对接**——不接甲方口令、不向甲方报结论，一切经监理。