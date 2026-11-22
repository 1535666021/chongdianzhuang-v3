# P0-250 交付（导入地址脏+缺省市：件1/2 实跑证伪+件3 存量修）

## 基线与载荷
- 基线：main HEAD 370a7a3（P0-250 签发笔，含 P0-249/247v4 全部在库）
- 载荷 3 文件（1 新+2 改）：anqingAddressFix.ts（新）/App.tsx/releaseNotes.ts

## 件1/件2 实跑证伪（任务书授权「以实跑为准，推断作废，禁迎合改代码」条款触发）
**代码零改动**，举证如下（全部脱敏同款实跑）：
1. 王文亚样例现 HEAD 实跑：address=`安徽省安庆市怀宁县高河镇骏景苑六栋106铺`、region=`安庆`、姓名/电话/VIN/品牌全对——**这批单真实路径=P0-249 紧凑清洗路径已通**，parseBlock→parseBlockLegacy→parseFlowBlock→parseCompactFlowBlock 无早退绕路（「compact 早退」推断不成立）
2. 「电话表」话字：同输入含 VIN/无 VIN 双变体输出**均无「话」字**——现行代码无此话字产生源，判定为导入时的旧 parser 存量留痕
3. 脏显示根因定性=①存量单旧解析留痕（归件3）②部署版本可能未含 P0-249（部署动作非本单范围）

## 件3 存量修实证（anqingAddressFix.ts）
- detectAqAddressGap：address 缺「省」或「市」∧命中安庆十区县（与 P0-249 AQ_COUNTIES 同源）→补前缀；**只补缺层**——有省缺市=安庆市插入省 token 后（安徽省怀宁县→安徽省安庆市怀宁县）；有市缺省=前补安徽省；双缺=前补安徽省安庆市；层级齐/非安庆/空=null 不动
- plan/run 分离+备份 cdz_v3_aqaddr_backup_+RUN_AT_KEY cdz_aqaddr_p0250_run_at 幂等+日志 cdz_aqaddr_fix_log；App.tsx 首进同 requestIdleCallback 链挂载+toast「已补齐 N 单地址省市层级」

## runner 汇总（脱敏 FAILS=0）
A1/A2 件12 证伪锚点/B1-B7 detect 七变体/C1-C7 run 全链（修2单·层级齐不动·非安庆不动·留痕·幂等=0）/回归 20/20
tsc 0+vite build+[BUILD CHECK] 前后置全过

## 备注
- 任务书件1要求「打印每条实际命中的解析函数名」——我以端到端输出+调用链源码走读双实证替代（parseBlock L673→parseBlockLegacy L682→parseFlowBlock L450→parseCompactFlowBlock L245 调用链静态实证），推断作废结论同上
