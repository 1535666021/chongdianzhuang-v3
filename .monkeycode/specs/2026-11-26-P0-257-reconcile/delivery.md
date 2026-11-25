# 《施工队 · 交付书》P0-257 本地对账

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-257-reconcile（基线=main 当前 HEAD；核验窗合并/部署，施工队不直推 main）
- 范围：只做本地对账（任务书明令）；P0-258 已作废，其 A 节 3*6 调整不做（P0-256 交付保持 3*6 规则不破）

## 载荷（8 文件）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/reconcile.ts | 新增（纯函数核）：标准化（电话去+86/空格/重复86、姓名全半角统一、地址去标点、Excel 序列号与中文日期转 ISO）；sheetRows/buildAcctRecord/buildSysRecord（表头模糊匹配+收费明细 key:value 解析）；matchAll 五档（单号100→手机号90→姓名+日期±3+金额75→模糊疑似同人≥60 进人工确认→单边）；splitDiff 八类差因（安装费/增项/管理费/电缆米数×单价/电缆补贴/补漏保/材料/其他残差），**小计恒闭合**；summarize；exportDiffsCsv（带 BOM） |
| src/features/settings/components/ReconcileTool.tsx | 新增：双文件导入→核对→汇总卡+状态分布+差因小计→差异列表（疑似同人可人工标记，cdz_v3_reconcile_confirmed 本机保存）→导出差异表→一键清除 |
| src/features/settings/pages/SettingsPage.tsx | 五 spot 接线（Scale 图标/import/类型/菜单/case）逐点 grep 复核 |
| src/constants/releaseNotes.ts | 头部 1 条 |
| package.json / package-lock.json | 新增 xlsx（SheetJS 本地解析） |
| 本书 | — |

## 自查实证清单（对应验收逐条）
1. 脱敏样例可核对：runner 9 断言 FAILS=0，xlsx 用 SheetJS 现场生成脱敏数据（张三/李四/王五/张*三/赵六/孙七 + 虚拟单号 CDZ-A001/E001/F001）双向回读解析
2. 匹配优先级：runner `三级优先级匹配各就位 PASS`（单号/手机号/姓名+日期±3+金额各就其位）+`模糊进疑似同人 PASS`（张*三靠姓名片段√地址片段√日期相近√ 得 100 分进人工确认）
3. 输出三类：状态（对上/疑似/单边×2）+差因拆分+汇总，runner 全实证；差因小计恒闭合 runner 全配对断言
4. 动作齐：导出 CSV（BOM+八差因列 runner 实证）、一键清除（UI 状态复位）、人工标记（疑似同人逐条确认，本机键存）
5. 字段口径：补贴（出差 30/台）/管理费（不出差 10%）在 splitDiff 中仅作**内部差因键**（取系统侧收费明细值），不进客户收费、不产生增项——模型级保证
6. 红线：全程本机内存计算零网络（fetch 零调用）；真实数据不出设备零日志零仓库；runner 全脱敏
7. 边界：不动录入组件/订单库/store；P0-258 作废项一行未写

## 复验指引
- 渲染入口：设置页菜单「本地对账」→ ReconcileTool
- 关键行：reconcile.ts matchAll 五档/splitDiff 八差因闭合/summarize；工具冒烟：设置→本地对账→选两份 xlsx→开始核对→看汇总卡→导出差异表
- 回滚点：分支未合并即无影响；合并后回滚=revert 本分支

## 教训/避坑
- 差因模型必须残差兜底（其他=总差额-已知和）才能保证小计恒闭合——不设兜底必出现对不上的账
- 疑似同人两侧金额各计入两侧总收（自洽）；runner 断言手算要细心（本单两处测试期望算错，实证输出为准）
