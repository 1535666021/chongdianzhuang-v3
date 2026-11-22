# P0-247 v4 交付（isCableMat 码短路+数据修补+存量修形态B）

## 基线与载荷
- 基线：main HEAD（v3 销号后）；载荷 4 文件：useSurvey.ts / meterMismatchFix.ts / addonMaterialData_batch11_捷途 part1 / releaseNotes.ts（前两笔 6538337/23e16f6 已推）
- 件2=原 v3 件1/件3=原 v3 件2（v3 已销号）——v4 实增量=件1+件1④+件4 形态B

## 件1 实证
- isCableMat 判定统一：有 categoryCode 只看码（===CABLE）；无码文本兜底 `/电缆敷设|线缆敷设/`（原字面空格正则仅「敷设+空格」形态侥幸命中——runner A0 双正则对比实证）
- 万帮 findWanbangMeteredCable 零触碰（orderCalc L167 导出实证）

## 件1④ 数据文件核验（静态脚本全量扫描 addonMaterialData*.ts）
- 「category=线缆∧categoryCode≠CABLE」行数=0——任务书预期失配形态不存在，无需向 CABLE 修补
- **反向发现（裁示点）**：「安装服务套包（30米线缆敷设）」（addon_253，unit=套一口价）误挂 CABLE——件1新短路会判 true 与验收「套包必须 false」冲突；按任务书授权机制数据文件修补：CABLE→**SERVICE**（既有码零类型扩展，短路 false 保安全）
- 观察不处理：接地线/上门服务等行有 CABLE 噪声码（既有脏数据非本单范围，报备待甲方裁）

## 件4 形态B 实证
- detectFormB：survey.cableDistance 空/0 ∧ **survey**.estimatedMaterials 含电缆敷设/线缆敷设行 qty>0 → 数量即米数（OrderSurvey 路径 types/order.ts L5 实证纠偏）
- isMeterMismatchOrder/run 取米数=形态A∨形态B

## runner 汇总（脱敏 FAILS=0）
名称判定六连 A0-A6（正则 bug 对比/比亚迪=true/套包=false SERVICE 短路/万帮=true/套包外米=true/漏保盒=false/普通=false）
件四九连 B1-B9（形态A/B 命中/已带米数·无电缆行不命中/修 2 单/米数=行数量 30/留痕/幂等=0）
回归 20/20；tsc 0+vite build+[BUILD CHECK] 前后置全过
