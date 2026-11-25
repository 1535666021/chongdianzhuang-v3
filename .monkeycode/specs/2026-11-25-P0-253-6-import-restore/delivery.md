# 《施工队 · 交付书》P0-253-6 导入恢复

- 仓库：1535666021/chongdianzhuang-v3
- 基线 HEAD：8ae850ee（本窗 253-5 载荷；推前逐文件 sha 核验零改动）
- 范围：只做私仓拉 base/today 密文→本地解密→sha/schema 双校验→预导入备份→确认导入；同主键冲突进列表人工处理
- 未做（任务书明令）：双向同步/静默 merge/自动覆盖——一行未写；私钥仅 file.text() 内存驻留

## 载荷（5 文件）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/importRestore.ts | 新增：fetchFileBytes（私仓 GET，404/401 分类文案）；verifyAndParsePackage（sha256+JSON+schema 三层校验）；downloadAndDecrypt（私钥内存解密双包）；mergePackages（base+today 合并，同键 today 覆盖=导出侧同去重规则）；computeImportPlan（新增/同值跳过/冲突/墓碑删除四分类）；applyImportPlan（冲突按人工决议，默认跳过不静默）；backupBeforeImport（cdz_v3_preimport_backup_<时间戳> 全量备份） |
| src/features/settings/components/ImportRestoreTool.tsx | 新增：选私钥→拉取解密校验→冲突逐条三选（跳过/保留本地/采用远端）→备份并确认导入（setOrders 落库自带持久化） |
| src/features/settings/pages/SettingsPage.tsx | 五 spot 接线逐点 grep 复核 |
| src/constants/releaseNotes.ts | 头部追加 1 条 |
| 本书 | — |

## 自查实证清单（对应验收逐条）
1. 下载+解密+sha/schema 校验：runner 12 断言 FAILS=0——`拉取解密 sha/schema 双校验通过`+负向双证（篡改 sha256 被拦/schema v2 被拦）
2. 预导入备份+人工确认：backupBeforeImport 写独立备份键（runner 实证内容可回滚）；导入按钮文案明示备份动作；无静默——computeImportPlan 不同内容必进 conflicts，applyImportPlan 默认 skip
3. 同主键冲突列表：runner 三判实证（默认跳过本地不动/采用远端覆盖/保留本地）；UI 逐条三选下拉
4. npm run build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`（修 string 误传 TextDecoder.decode 与 atob 字节转换两处）
5. 交付本书 ✓
6. 边界守护：任务书明令三不做零出现；私钥零持久化零日志；非 order 实体变更计 noops 不越权导入

## 教训/避坑
- TextDecoder.decode 只收 BufferSource，string 直接传即 TS 报错——sha256 文件拉取后已解码文本的别二次解码
- GitHub contents API 的 content 是带换行 base64，atob 前先 strip \n；字节转换用 for 循环，Uint8Array.from(str) 类型签名不认

## 部署结果（核验窗 11-26 07:30）
- 部署执行：核验窗（RULES L70-72）；deploy 手动触发制
- 部署 run：45721469371 success（手动 dispatch）；线上 version.json=73cdd65 对拍全同
- 回拉核验：version.json 对拍另报
- 结论：P0-253-6 核验通过+部署成功，销号成立
