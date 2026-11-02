# 施工队操作手册（PLAYBOOK）

> 给下一任施工队窗口。动手前先读 .monkeycode/RULES.md（裁定全集，冲突以它为准），再读本手册。
> 硬信息：仓库 github.com/1535666021/chongdianzhuang-v3；线上 GitHub Pages；React18 + TS strict + Vite5 + Zustand + ReactRouter + PWA。

## 0. 踩坑录（既往重大教训，开工前必读）

教训一·打错文件：把勘测弹窗 src/features/order/components/SurveyModal.tsx 的活干到了
SurveyForm.tsx（后者只被独立勘测页 OrderSurvey.tsx 使用，弹窗不走它），改了等于白改。
根因=从界面文案倒推文件，没从渲染入口顺藤摸瓜。防法=改组件前先找渲染入口（谁 import 它、路由指到谁）。
教训二·漏行：读报告文本只读了 86-120 行，漏掉 124 行"米标刻度"行，交付缺行。
根因=区间跳读。防法=函数从头读到尾。

## 1. 拉码（勿 git clone）
- codeload 拉 tar：curl -L -o main.tar.gz https://codeload.github.com/1535666021/chongdianzhuang-v3/tar.gz/refs/heads/main
- git clone/pull 在 /mnt 常报 File exists，勿用
- /mnt 挂载 noexec：node_modules 与构建必须放 /tmp 下执行

## 2. 构建（R4，每次交付必跑）
- npm install（registry 用 npmmirror 快）
- npm 11 默认拦 esbuild postinstall：若 node_modules/.bin/esbuild --version 失败，补 npm i @esbuild/linux-x64@<lock版本> --no-save
- 必跑 npm run build（build-check 前置 → tsc --noEmit → vite build → build-check 后置），tsc 0 错才算过，少一项禁交付
- build script 取 git rev-parse --short HEAD：tar 无 .git 时先本地 git init && git add -A && git commit（仅本地用途）

## 3. 编码铁律速记
- R1 最小改动：任务书没点名的文件一个比特不动；只增不改，既有风格照抄
- R2 计算唯一出口 src/shared/utils/orderCalc.ts；R3 写回唯一通道 orderStore.updateOrder / setOrders，禁直改 localStorage
- R9 parser.ts 入口禁改；每改解析必在 src/lib/parserRegressionSamples.ts 追加脱敏样例（name/input/expect），旧样例禁删禁改期望
- R12 新自愈逻辑注册为 src/App.tsx runStartupMaintenance 的 phase（try/catch + console.time），禁首屏前同步执行
- 完工书=《施工队 · 状态快照》，text 代码块一次性完整输出，验证项逐条对应任务书，如实申报（虚报一处全单退件）

## 4. 推送（R6）
- 一本书=一次提交（勘误/返工另算），提交信息含书号
- 令牌：监理下发；分片注入环境变量、不落明文（聊天/完工书/代码注释均禁）、仅推送与校验用、用后焚毁；401 才报甲方重发
- 无 git 条件时用 GitHub API 单 commit：GET /git/ref/heads/main → blob（各载荷 base64）→ tree（base_tree=当前 tree）→ commit（parents=[当前 HEAD]）→ PATCH ref；全程 Authorization 头用环境变量

## 5. 双断言（R7，完工书必备）
- ① 载荷文件清单==任务书范围（多出的如实增报并说明）
- ② 载荷字节==本地源文件字节：每文件 sha256，推送后 GitHub 回拉再算 sha256 对拍
- 防越界：diff -r 基线tar解压目录 工作区 -x node_modules -x dist -x .git，输出必须为 0 行差异（除载荷外）

## 6. 数据红线（R8）
- 真实订单/客户信息（姓名/电话/地址/单号）禁进仓库、禁进完工书、禁进回归样例
- 测试一律脱敏假数据（如 王某某 13800000000 安徽省安庆市某镇某路某号）

## 7. 更新说明（R11）
- 每本书末尾自带"更新说明"一行，交付时照抄追加至 src/constants/releaseNotes.ts 头部，最多保留 30 条

## 8. Pages 版本号坑（2026-11-01 实证）
- 版本号=构建时 GITHUB_SHA 前 7 位，内联进 version.json，"我的"页版本区块显示它
- 勿 re-run 历史部署 run：其 GITHUB_SHA 取原事件旧 sha，产物 version.json 版本号贴旧号（checkout 代码却可能是新），"关于"页版本号对不上、线上成新旧混搭
- 版本号异常处置顺序：api.github.com 查 main HEAD → curl 线上 index.html 看资源引用 → curl version.json → 确认 HEAD 无误后 re-run 该 HEAD 的 pages run 归正；勿推空提交污染历史
