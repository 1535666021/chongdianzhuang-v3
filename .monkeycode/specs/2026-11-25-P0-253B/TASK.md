# 《施工队 · 任务书》P0-253B
> 状态：暂停（2026-11-25 23:30 甲方止损）。原因：P0-253A 执行过长/窗口挂死；施工队立即停止继续开发，保留当前分支/commit/终端现场，先交进度快照与卡点，不得继续扩范围。


施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

基线：main HEAD 以推送时为准；P0-253 原书作废，以 P0-253A/P0-253B 为准。

## 目标
在 P0-253A 的密文队列上实现即时上传私仓与 `base + today` 两份滚动维护。不等午夜、不做 WiFi 判断；有网即传，失败只排队密文。

## 红线
- token/私钥不进公仓、不进聊天、不进 delivery；软件持有私仓写入凭据是甲方已接受风险，但必须最小权限、可撤销、可更换。
- 仓库只放 `.age/.sha256` 与脱敏说明；禁明文、禁 commit message 含客户线索。
- 私仓固定只维护两份：`base-current.age/.sha256` 与 `today-new.age/.sha256`。

## 实现要求
1. 设置页配置私仓 owner/repo/token 或 fine-grained secret；凭据存本机安全存储，禁同步到备份数据。
2. uploader 消费 A 的本地密文队列：调用 GitHub API 覆盖更新 `today-new.age/.sha256`；成功删本地队列，失败指数退避重试；仅监听在线事件，不做 WiFi 判断。
3. 自然日 rollover 不依赖定时器：首次检测到日期变化或今日包跨天时，先用本地全量数据生成“截至昨日基础包” `base-current.age`，再把今日包重置为空/新一天；上传两份并删除旧远端文件。
4. overlay 规则：恢复/合并时用 `base-current` 打底，再用 `today-new` 按主键覆盖/ tombstone 删除；同主键冲突记录进冲突表，不静默丢数据。
5. 上传/恢复操作只记录文件 hash、数量、时间；禁记录客户字段。

## 验收
- 脱敏假数据：连续变更触发防抖上传；断网时队列积压，恢复网络后自动补传；远端始终只有 base/today 两份。
- 模拟跨天：base 更新为截至昨日，today 重新开始；恢复结果等于本地当前状态。
- token 错误/权限不足给可操作提示；禁把 token 打进日志/仓库。
- npm run build 通过；交付 delivery.md 到 `.monkeycode/specs/2026-11-25-P0-253B/delivery.md`。

施工队自行部署
监理窗口 · 签发完毕
