# 《施工队 · 任务书》P0-253-6

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

## 总则
- 本系列原 P0-253A/P0-253B 已止损作废；必须按 P0-253-1 → 2 → 3 → 4 → 5 → 6 小步做，禁止一口气做完全系列。
- 每个小任务独立 build、独立 delivery.md、独立回拉核验；做完一个停一个，等监理复验。
- 真实明文/私钥/token 不进仓库、聊天、交付书；测试脱敏。

## 范围
在 253-5 复验通过后做：下载 base/today 密文，本地解密，校验 sha/schema，先 pre-import 备份，再确认导入；同主键冲突进列表人工处理，不静默覆盖。

## 不做
不做自动双向同步、不做静默 merge、不做还原自动覆盖。

## 验收
1) 脱敏样例可导入并等于本地当前状态；2) 冲突不静默，删除 tombstone 生效；3) npm run build 通过；4) 交付 specs/2026-11-25-P0-253-6-import-restore/delivery.md。

施工队自行部署
监理窗口 · 签发完毕
