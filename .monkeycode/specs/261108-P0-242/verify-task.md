# 《核验窗 · 核验任务书》P0-242

- 单号：P0-242（智能分组地址胶囊行政层级化）
- 核验窗角色进场必读：.monkeycode/SUPERVISOR-HANDOVER.md 全文 → 本单 task.md → delivery.md → 本任务书
- 分支锁：main；基线 fa18a56 → 交付 cf650f5
- 测试一律脱敏假数据（王某某/13800000000/某小区），真实订单数据禁经手
- 回执二选一：通过=SUPERVISOR-HANDOVER.md 第二节加销号行；打回=本目录 return-R*.md 逐条列 FAIL 实证

## 验收逐条（按 task.md 第四节过秤）

1. **四件载荷核验**：groupTags.ts extractAreaChain（省→市→区县→乡镇）+matchAreaChain；useOrderList.ts 层级累计计数+层级定序其他末位+点选过滤；OrderFilterBar/utils.ts areaGroupLabel 点选级分组键；OrderList.tsx 传 filter.areaTag（含 useMemo 依赖）
2. **组名片段去重**：extractAreaChain('安徽省淮南市寿县安徽寿县寿春镇某街道') 必须产出 {province:'安徽省',city:'淮南市',district:'寿县',township:'寿春镇'}——「寿县安徽寿县」拼接绝迹
3. **胶囊层级累计**：三脱敏单（合肥蜀山小庙镇/合肥长丰下塘镇/淮南寿县寿春镇）→ 安徽省(3)/合肥市(2)/淮南市(1)/区县乡镇各(1)，层级定序+其他末位
4. **点选=该级及下级全域**：matchAreaChain 链上任一级命中；点合肥市=2 单（含两区县单）、点寿县=1 单、点其他仅解析不出单
5. **分组标题同步**：点选胶囊后列表分组标题与点选层级匹配（点省按市/点市按区县/点区县按乡镇）；未点选按最细可用级
6. **extractAreaTag 零断链**：签名/导出不动，既有调用方 grep 无功能调用被破（内部改调链取最细可用级=任务书允许）
7. **零超范围**：diff 面恰 5 src 文件；orderCalc.ts/parser/回归 20 条零改动
8. **实跑**：runner 场景断言全过+回归 20/20+tsc 0+vite build+[BUILD CHECK] 前后
9. **双版本快照 diff 法**：fa18a56 vs cf650f5 快照对拍，实证贴文件:行/命令/输出
