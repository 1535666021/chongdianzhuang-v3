# 《施工队 · 任务书》P0-253-2
> 施工队：新队（253 系列换队）。原 253 班组禁止继续跑本系列；新队从 P0-253-1 开始，小步交付。


施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

## 总则
- 本系列原 P0-253A/P0-253B 已止损作废；必须按 P0-253-1 → 2 → 3 → 4 → 5 → 6 小步做，禁止一口气做完全系列。
- 每个小任务独立 build、独立 delivery.md、独立回拉核验；做完一个停一个，等监理复验。
- 真实明文/私钥/token 不进仓库、聊天、交付书；测试脱敏。

## 范围
只做手动「导出同步包 JSON」：包含 schemaVersion/exportedAt/baseDate/changes/counts；changes 支持新增/修改/删除 tombstone，按业务主键去重。

## 不做
不做加密、不做自动监听、不做上传。

## 验收
1) 脱敏假数据导出 JSON 可被离线校验 schema；2) 重复导出同批变更不重复计数；3) npm run build 通过；4) 交付 specs/2026-11-25-P0-253-2-export-schema/delivery.md。

施工队自行部署
监理窗口 · 签发完毕
