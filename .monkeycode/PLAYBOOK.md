# 施工队操作手册（PLAYBOOK，2026-11-03 蒸馏版）
> 动手前顺序：RULES.md（裁定全集，冲突以它为准）→ 本手册。环境硬信息见 CONTEXT.md。

## 0. 踩坑录（开工前必读）
- 教训一·打错文件：从界面文案倒推文件，把弹窗活干到 SurveyForm.tsx（弹窗走 SurveyModal.tsx）白改。防法=改组件前先找渲染入口（谁 import、路由指谁）。
- 教训二·漏行：区间跳读漏 124 行"米标刻度"行。防法=函数从头读到尾。
- 教训三·空任务（2026-11-03 监理窗）：向第三核验窗发上岗包前未做能力探测，默认其"有 shell 有网+接受聊天投喂令牌"，结果该窗无网络、拒令牌，两轮上岗全失败，核验任务书空转，被甲方裁"空任务"。防法=RULES §12：先探测后设计，探测不过当场换形态，不反复修补同一形态；文书必含不依赖网络/令牌/upload 三假设的降级路径。

## 1. 拉码（勿 git clone）
- curl -L -o main.tar.gz https://codeload.github.com/1535666021/chongdianzhuang-v3/tar.gz/refs/heads/main
- git clone/pull 在 /mnt 常报 File exists 勿用；/mnt noexec，node_modules 与构建放 /tmp。

## 2. 构建（每次交付必跑）
- npm install（npmmirror 快）；npm11 拦 esbuild postinstall 时补 npm i @esbuild/linux-x64@<lock版本> --no-save
- 必跑 npm run build（build-check→tsc --noEmit→vite build→build-check 后置），tsc 0 错才过；tar 无 .git 先本地 git init/add/commit（build script 取 rev-parse）

## 3. 编码铁律速记
- 最小改动：任务书没点名的文件一个比特不动；只增不改，既有风格照抄
- 计算唯一出口 orderCalc.ts；写回唯一通道 orderStore.updateOrder/setOrders，禁直改 localStorage
- parser.ts 入口禁改；每改解析必在 parserRegressionSamples.ts 追加脱敏样例（name/input/expect），旧样例禁删禁改期望
- 新自愈逻辑注册 App.tsx runStartupMaintenance phase（try/catch+console.time），禁首屏前同步执行
- 交付快照写 delivery.md 落 specs 同目录，验证项逐条对应任务书，虚报一处全单退件
- **举证清单（2026-11-03 甲方裁定，核验移交第三窗后强制）**：delivery.md 末尾必附"自查实证清单"——每条验收一项一行证据（文件:行/命令/输出摘要）；核验窗按此抽查 1/3，举证造假一次，此后该队所有单全量重跑

## 4. 推送
- 一本书=一次提交（勘误/返工另算），提交信息含书号
- 令牌：监理下发；分片注入环境变量、不落明文、用后焚毁、仅推送与校验用；401 才报甲方重发
- 无 git 时用 GitHub API 单 commit：GET ref → blob(base64) → tree(base_tree) → commit(parents=HEAD) → PATCH ref

## 5. 双断言（交付必备）
- ① 载荷文件清单==任务书范围；② 每文件 sha256==推送后回拉 sha256
- 防越界：diff -r 基线tar 工作区 -x node_modules -x dist -x .git，除载荷外必须 0 差异

## 6. 数据红线
- 真实订单/客户信息（姓名/电话/地址/单号）禁进仓库、交付书、回归样例
- 测试一律脱敏假数据（如 王某某 13800000000 安徽省安庆市某镇某路某号）

## 7. 更新说明
- 每本书末尾"更新说明"一行，交付追加至 src/constants/releaseNotes.ts 头部，最多 30 条

## 8. Pages 版本号坑（详则见 MEMORY.md 第1条）
- 勿 re-run 历史部署 run（GITHUB_SHA 取旧 sha，版本号贴旧）；异常处置=查 HEAD→curl 线上资源→re-run 该 HEAD 的 run，勿推空提交