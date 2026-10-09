/** P0-140-R4 强制交付物：解析回归样本集（甲方历史全部格式脱敏固化）。任何解析器改动必须全绿才许交付。 */
export interface RegressionSample { name: string; input: string; expect: Record<string, string | undefined> }
export const REGRESSION_SAMPLES: RegressionSample[] = [
  { name: '标准姓名电话地址(P0-099)', input: '姓名：张三 电话：13800138000 地址：合肥市包河区某小区 套餐：20米', expect: { customerName: '姓名', phone: '13800138000' } },
  { name: '群公告(P0-123)', input: '# 群公告 #\n订单来源：测试君\n购车人/电话：高测试13800001111\n桩名称：银河微金刚款 车辆型号：银河E5', expect: { customerName: '高测试', brandName: '吉利' } },
  { name: '外联单(P0-138 车主优先)', input: '外联单号: HW1\n联系人: 梁测试\n联系人电话: 13900001111\n车主姓名: 徐测试\n车主电话: 13800002222', expect: { customerName: '徐测试', phone: '13800002222' } },
  { name: '万联变体1', input: 'D2026100101010001WL五菱缤果ProQ13800001111安徽省淮北市濉溪县韩村镇海孜矿某街道LK6ADAE39TG0000007KW充电桩（五菱）地面壁挂 电表已安装挚达五菱 挚达五菱 （线缆：30米，请务必确认客户的核销码是否过期）', expect: { orderNo: 'D2026100101010001', customerName: 'Q', phone: '13800001111', powerKw: '7', brandName: '五菱', platformName: '挚达' } },
  { name: '万联变体2', input: 'D2026090102020002WL 安徽省淮北市濉溪县某镇某村 星测试 13900002222 LK6ADBHL7TB000000 7KW充电桩（五菱） 地面壁挂电表已安装 挚达五菱 （线缆：3*6）', expect: { orderNo: 'D2026090102020002', customerName: '星测试', phone: '13900002222', powerKw: '7' } },
  { name: '样本C(R4)', input: 'D2026100101010003WL lxTestGDzG 13800001111 安徽省淮北市 恒大名都9栋 LK6ADAE35TG000000 7KW充电桩+30米安装', expect: { orderNo: 'D2026100101010003', customerName: 'lxTestGDzG', phone: '13800001111', address: '安徽省淮北市恒大名都9栋', vin: 'LK6ADAE35TG000000', powerKw: '7' } },
  { name: '微信包装(P0-132)', input: '「方中发💍189 5605 1764 16:47」\n"订单来源：妍伟（送桩卷）\n颜伟\n所属品牌：吉利星愿\n套餐：20米\n购车人电话：139 0000 1111\n安装地址：安徽省合肥市包河区测试小区1栋"', expect: { customerName: '颜伟', phone: '13900001111', platformName: '妍伟' } },
]
export function runRegressionSamples(parse: (text: string) => { items: Array<Record<string, unknown>> }): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = []
  let passed = 0
  for (const sample of REGRESSION_SAMPLES) {
    const item = parse(sample.input).items[0] || {}
    for (const [field, want] of Object.entries(sample.expect)) {
      const got = (item[field] as string | undefined) ?? ''
      if ((got || '') !== (want || '')) failures.push(`${sample.name} | ${field}: got=${JSON.stringify(got)} want=${JSON.stringify(want)}`)
      else passed++
    }
  }
  return { passed, failed: failures.length, failures }
}
