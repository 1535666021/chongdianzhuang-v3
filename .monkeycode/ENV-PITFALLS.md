# ENV-PITFALLS · 施工环境坑与处置定式（2026-11-25 复盘）

> 三窗必读：监理（签发前核环境）、施工队（开工前三问）、核验（复验环境差异时对照）。
> 起因：P0-253A 一单施工被环境坑拖 6+ 小时。本文把根因与定式一次说清，今后照做不再踩。

## 一、本机三层硬伤（实证）

1. **/mnt/agents 是 FUSE 挂载**：不支持符号链接（os.symlink → Operation not supported）、chmod exec 位不生效。
   - 后果 A：npm install/ci 建 `.bin` 链接必败 → tsc/vite/esbuild 调不起来。
   - 后果 B：node_modules 里的原生二进制（@esbuild/linux-x64/bin/esbuild、rollup）即使 chmod +x 也 spawn EACCES/SEGV → vite build 必挂。
2. **/tmp 周期性被卷**（当日亲历三次）：工作区、npm 临时目录、手工解的包随时蒸发。日志/工作区一律放 /mnt/agents 与 /mnt/agents/output。
3. **ipython 工具层偶发挂死**（curl 130s 超时，restart 也超时）：遇到先报停，下轮重试，勿在挂死轮空转。

## 二、出口代理行为（实证）

- 对 registry 大 tarball **中途截断**（Content-Length 不实，读流提前 EOF）。
- 对高频请求**硬币 flip 式限流**：同一 URL 200/404/422 交替，按包名封（@babel 系、@typescript-eslint 系当天全灭）。
- **HEAD 请求被拦**（416/404）；**GET + Range: bytes=a-b 可用**（200/206 均通，206 带 Content-Range）。
- **并发即封**：8 线程拉分段全灭；顺序单发 + 块间 sleep 0.2-1s 才稳定。
- jsdelivr 文件级通道（data.jsdelivr 列目录 + cdn.jsdelivr 逐文件）是限流期唯一稳定通路。

## 三、处置定式（照抄即可）

### A. 开工前三问（监理签发前核，施工队接单后核）
1. `ln -s` 测试目标盘：不支持 → npm 建链必败，预置 `.bin` 手工方案。
2. hello-world 编译二进制 exec 测试：失败 → vite build 走 ESBUILD_BINARY_PATH 外挂二进制。
3. `curl -r 0-0 <registry>/<pkg>/-/<file>.tgz` 探测：非 200/206 → 走 jsdelivr 文件级方案。

### B. 依赖修复 SOP（npm 死透后的手工链）
1. lock 对照扫残：`package-lock.json` packages 逐条核 `node_modules/<rel>/package.json` + main/exports 入口存在。
2. 残包抓取：**顺序单发** jsdelivr（禁并发），每请求 4-8 重试、sleep 0.8-1.5s；tarball 路线用 GET+Range 分段续传（bytes 0-0 探总长 → 64KB 块顺序拼）。
3. `.bin` 重建：扫各包 package.json 的 bin 字段，写 **shell 包装脚本**（`#!/bin/sh exec node "$(dirname "$0")/<rel>" "$@"`），chmod 755——绕 FUSE 无符号链接。
4. 原生二进制（esbuild/rollup）：curl 直拉 tgz 解压到 **/var/tmp**（tmpfs 可 exec），`ESBUILD_BINARY_PATH=/var/tmp/esbuild-good` 环境变量指给 vite。
5. build 手动四链（勿用 npm run，它调 .bin 需 exec 位）：
   `node build-check.cjs` → `node node_modules/typescript/bin/tsc --noEmit` → `ESBUILD_BINARY_PATH=… node node_modules/vite/bin/vite.js build` → `node build-check.cjs --check-dist`

### C. 纪律
- 后台 detached 进程会被无声清杀：**关键循环同步分段跑**（每轮 ≤120s 硬限），进度落盘日志（/mnt/agents/output/*.log）防丢。
- 环境修复与代码载荷**分推**：环境坑修复不进业务 commit，教训/文档单独一笔。
- 归因诚实：本轮 P0-253A 久拖 = 上述环境三连（FUSE+代理+tmp 被卷），非任务书或代码问题；253A 代码面与 runner 22/22 早已就绪。

### D. git 通道劣化与 API 竞速定式（2026-11-25 P0-255 实战增补）
1. git push 报 non-fast-forward 后紧跟 GnuTLS recv error(-110)/TLS 挂 = git 智能 HTTP 通道整体劣化：勿重试 git 通道（两轮实证全挂、空耗窗口）。直接走 Contents API 链：GET ref/heads/main 查 HEAD → POST git/blobs → POST git/trees(base_tree=当前远端 HEAD) → POST git/commits(parents=[HEAD]) → PATCH git/refs/heads/main。单 commit 干净落库。
2. PATCH ref 返 422 有两义，先判别再处置：
   - a) fast-forward 拒绝 = 远端又前进（本仓多窗并行常态，本单 10 分钟内远端前进 3 次）：重查 HEAD 换 base_tree 重建 tree 再打（blob 已建可复用，只重打 tree+commit）。
   - b) 出口代理 flip 限流（见二节）：降频重试，勿与 a) 混为一谈。
3. rebase 冲突卡死处置定式：冲突标记的替换串必须与文件实际字节完全一致（缩进/引号风格任一不符 = 未命中 → 标记残留 → rebase --continue 卡死且无报错）。处置：git rebase --abort 回干净点，改走 git reset --hard origin/main + git checkout <本地commit> -- <文件清单> 重放（等价可预测）。勿在卡死的 rebase 态里手修继续。
