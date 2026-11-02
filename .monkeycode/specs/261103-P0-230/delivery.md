《施工队 · 状态快照》
编号：P0-230 复验打回重做　日期：2026-11-03　施工队窗口

═══ 打回三处错认领 ═══
① 口径做反：首版把"≥2026-11-03 回填到每家"，正确口径=10/1–11/2 回填到每家、≥11/3 一律不动；
② 漏平台条件：只处理平台含京东的单（platformName/platform 正则）；
③ benyang 段缺失：完工日 <2026-10-01 → benyang（本杨）。

═══ 重做后回填口径（幂等一次，挂于 purgeLegacyAppointmentDates 之后）═══
筛选：platformName/platform 含京东 + 无显式 company（非 benyang/daomei）+ status='已完成'；
分段：resolveDoneDate(o) ∈ [2026-10-01, 2026-11-02] → daomei；< 2026-10-01 → benyang；≥ 2026-11-03 → 不动。
已回填单（company 有值）下次启动被筛选排除 = 幂等。

═══ 改动清单（2 文件）═══
src/features/appointment/repository.ts：backfillCompanyByDoneDate() 整函数重做（三段口径+平台条件+双计数日志）。
src/App.tsx：挂点从 purge 之前挪至之后（清洗→归位→自愈，顺序符合打回书）。

═══ 实证纪律 ═══
回归：19/19 ALL GREEN（18 既有+1 奇瑞新增；京东相关样本无 appointmentDate/company 断言受影响）。
build：rc=0（tsc+vite+双 build-check 过）。
消费点走查同首版快照（isDaomeiOrder 4 消费点+resolveCompany 1 消费点+companyHit 3 消费点，
全部经唯一出口，无自写京东判定残留）。

新坑记录：已报监理归档（npm registry/mnt 限制/API 推送三坑）。
