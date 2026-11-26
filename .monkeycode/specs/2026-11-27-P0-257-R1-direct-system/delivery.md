# 《施工队 · 交付书》P0-257-R1 系统侧免导入直读

- 仓库：1535666021/chongdianzhuang-v3
- 交付分支：task/P0-257-R1-direct-system（基线=main 现 HEAD；核验窗合并/翻牌）
- 交付引用 R1 路径：.monkeycode/specs/2026-11-27-P0-257-R1-direct-system/TASK.md（WINDOW-SYNC 协议）

## 载荷（4 文件）
| 文件 | 动作 |
| --- | --- |
| src/features/settings/lib/reconcile.ts | 新增纯函数 `ordersToSysRecords(orders, month?)`：Order 直映 SysRecord（orderNo||id→单号、customerName/phone/address→标准化、brandName→品牌、customerPrice→客户收费、completeDate/actualInstallDate/createdAt 时间戳三源日期、materialCost+laborCost→安装费口径近似、meters/cablePrice 直读无字段置 0、units=1）；month 前缀过滤，默认当月 |
| src/features/settings/components/ReconcileTool.tsx | 删系统侧文件输入框；加月份选择（type=month，默认当月）；run 改「会计表导入 + store 直读」：sys=ordersToSysRecords(useOrderStore.getState().orders, month)，**空域提示「当前范围（YYYY-MM）无系统订单，不生成假差异」并中止**；清除键只清会计导入与结果，不动系统订单 |
| src/constants/releaseNotes.ts | 头部 1 条 |
| 本书 | — |

## 自查实证清单（对应 R1 验收逐条）
1. 系统侧免导入：UI 零文件输入（grep 实证），直读 useOrderStore 本机订单
2. 默认当月+月份切换：runner 6 断言 FAILS=0——`当月过滤（11 月 2 单）PASS`/`createdAt 时间戳转 ISO PASS`（2026-10-28 单被滤出）
3. 空范围不造假差异：`空范围返回空 PASS`（纯函数返回 [] 驱动 UI 中止分支）；UI 层 sys.length===0 即红条提示 return，matchAll 不执行
4. 只清会计导入不清系统：清除键 setResults(null) 不触 store（代码面实证）；系统订单零文件依赖天然不可被清
5. 脱敏用例对账往返：`直读对账往返 PASS`（张三手机号对上/孙七会计单边/赵六系统单边）
6. npm run build：tsc 0 + vite + `[BUILD CHECK] 后置检查通过`（createdAt 时间戳类型修复一笔）
7. 边界：会计侧导入链路/匹配/差因/导出一字未动；buildSysRecord 保留（导出等旁路兼容）

## 口径说明（delivery 必写）
- 安装费口径近似=材料+人工（直读无独立安装费字段）——匹配主锚为单号/手机号/总额，第三档金额一致判据不受影响
- meters/cablePrice 直读侧置 0：电缆米数差因金额化按 0 计，残差归入「其他」，小计闭合不破（splitDiff 残差模型保证）

## 复验指引
- 渲染入口：设置页→本地对账——只一个文件框+月份选择
- 功能冒烟（脱敏）：当月无单+导会计表 → 红条「当前范围无系统订单」；有单 → 正常五档匹配出结果；切上月 → 日期过滤生效

## 教训/避坑
- BaseEntity.createdAt 是 number 时间戳——OrderLike 须 number|string 联合，纯函数内分支转换（首版 TS 报错拦回）
- 时间戳测试常量先验证再断言（本单 1761955200000 实为 2025 年致三 FAIL，换算 1793491200000=2026-11-01 转绿）
