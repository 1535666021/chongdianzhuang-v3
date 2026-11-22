# P0-249 交付（地址识别修复·紧凑流式行污染）

## 基线与载荷
- 基线：main c8245ae3
- 载荷 2 文件：src/lib/parser-engines.ts（清洗函数 cleanCompactAddress+COMPACT_NON_ADDRESS_TOKEN+AQ_COUNTIES+注入点）/ releaseNotes.ts 头追加
- 单文件改动量：parser-engines 恰 1 函数块+3 行注入，注入点仅限 parseCompactFlowBlock「是/否」分支 address 写入前

## 施工对任务书根因逐条
1. 左段清洗：token 级剔除日期区间（11.22-11.23)/预约.*/权益.*/电表已安装/电表已申请/家用电表/单位电（表|源）?/电源性质.*/已装表/未装表 + VIN(17位）/手机号残留——COMPACT_NON_ADDRESS_TOKEN 正则
2. 品牌/套餐/功率/是/否 不入 address：它们位于「是/否」后尾段（remark 通道），主链零改动实证；remark 仍取尾段不回填 address
3. 安庆短名归一：AQ_COUNTIES 十区县（怀宁县/迎江区/大观区/宜秀区/潜山市/桐城市/太湖县/宿松县/望江县/岳西县），命中且缺「安庆市」→规范「安徽省安庆市+区县+后续」；item.region='安庆'（parser-core REGIONS 白名单 L13 已含安庆，parser.ts L82 白名单校验实证不回落）
4. 重复层级去重：`怀宁县 安徽省安庆市怀宁县江镇镇…`→前缀裸县名去除+叠写去重双保险，只保留一次规范式

## 禁区自查
- orderNo/name/phone/VIN/品牌/套餐主链零改动（注入点仅 address 写入行）
- 无「是/否」尾段行走原 null/回落逻辑（runner E1：不被硬切实证）
- 既有键值块/万联/速家/glued 流路径零改动；orderCalc/成本/漏保矩阵零触碰
- 回归 20/20 全绿；tsc 0+vite build+[BUILD CHECK] 前置/后置全过

## runner 汇总（脱敏假数据 9 断言 FAILS=0）
A1 样例地址=安徽省安庆市怀宁县高河镇某小区106铺/A2 无污染词（11.22/家用电表/电表/权益/单位电 五词全拒）/A3 region=安庆/B1 迎江区=安徽省安庆市迎江区某小区55-2/B2 region=安庆/C1 层级去重/D1 完整省市区地址回归不变（合肥蜀山区对照）/D2 非安庆不置 region/E1 无是否行不硬切/回归 20/20

## 备注
- releaseNotes 头插后顺序：P0-249→P0-247（P0-248 无头条目=该单未交付，核验窗如见差异以此为准）
