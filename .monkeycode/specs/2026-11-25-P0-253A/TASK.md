# 《施工队 · 任务书》P0-253A

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），确认目录规范、接口约定、红线约束与历史教训后再编码。

基线：main HEAD 以推送时为准；P0-253 原书作废，以 P0-253A/P0-253B 为准。

## 目标
软件内实现备份密钥与“数据变更当场生成 age 加密包”。不等午夜、不做 WiFi 判断；A 单只负责本地生成密文和待传队列，不负责网络上传。

## 红线
- 真实用户明文/私钥/GitHub token 禁止进公仓、聊天、交付书；测试一律脱敏假数据。
- 私钥绝不持久化在 v3 localStorage；公钥可持久化。
- 任何明文导出文件不得留在本地队列；队列只放 `.age/.sha256`。

## 实现要求
1. 设置页新增「备份密钥」：本地生成 age 密钥对；保存公钥；私钥仅支持本地下载一次或解密时临时选择，不写 localStorage。
2. 新增备份 store/schema：`schemaVersion/exportedAt/baseDate/changes/counts`；`changes` 记录新增/修改/删除 tombstone，按业务主键去重。
3. 订阅订单/客户/配置等数据变更；30s 防抖合并连续修改，重新生成「今日变更包」。
4. 用公钥把今日变更包加密为 `today-new.age`，生成 `today-new.age.sha256`；本地队列只保存密文、hash、状态、重试计数。
5. 提供恢复/校验工具函数：解密后的包可 overlay 到基础快照，新增/修改按主键覆盖，删除按 tombstone 删除。

## 验收
- 脱敏假数据：新增 1 单、改 1 单、删 1 单后，只生成一个最新 today 密文包；队列无明文。
- 无私钥环境只能加密不能解密；有私钥本地可解密并 overlay，数量与 tombstone 正确。
- npm run build 通过；交付 delivery.md 到 `.monkeycode/specs/2026-11-25-P0-253A/delivery.md`。

施工队自行部署
监理窗口 · 签发完毕
