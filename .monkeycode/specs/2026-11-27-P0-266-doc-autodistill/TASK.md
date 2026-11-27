# 《施工队 · 任务书》P0-266

施工队接单后第一步：依次读取 .monkeycode/MEMORY.md、.monkeycode/RULES.md、.monkeycode/PLAYBOOK.md（三读，缺一不动手），每轮结束重读最新版，再按本任务书施工。

## 目标
把“文档守卫提醒后自动蒸馏”固化为常驻维护任务：当 `.github/workflows/doc-size-guard.yml` 对 `.monkeycode/*.md` 报 SOFT/HARD 后，监理窗自动做安全蒸馏并回跑守卫。

## 自动蒸馏边界（只允许这样做）
A. 触发：guard 对任一 `.monkeycode/*.md` 报 >16KiB 或 fail。  
B. 动作：把该文件中历史解释、重复案例、已完成细节移到 `.monkeycode/ARCHIVE/YYYY-MM-DD-<原文件名>`；原文件只保留现行规则、红线、当前真相源指针。  
C. 禁改：不得改代码、不得改任务状态、不得删现行规则/红线/流程；历史移动必须可追溯。  
D. 提交：commit message 用 `[distill] <file>`；推 main 后重跑 guard，确认低于 SOFT 或至少低于 HARD。  
E. 留痕：在归档文件头写来源、归档日期、保留原则；必要时 NOTICE 一行。

## 验收
1) 构造/等待 guard warning 后执行一次蒸馏；archive 存在且原文件变小。  
2) 现行规则仍完整可搜；无代码改动。  
3) guard 重跑通过/只剩 warning。  
4) delivery.md 记录触发文件、before/after bytes、archive 路径。

施工队自行部署
监理窗口 · 签发完毕
