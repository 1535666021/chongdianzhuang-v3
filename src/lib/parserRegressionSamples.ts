/** P0-140-R4 强制交付物：解析回归样本集（甲方历史全部格式脱敏固化）。任何解析器改动必须全绿才许交付。 */
export interface RegressionSample { name: string; input: string; expect: Record<string, string | undefined> }
export const REGRESSION_SAMPLES: RegressionSample[] = [
  { name: '标准姓名电话地址(P0-099)', input: '姓名：张三 电话：13800138000 地址：合肥市包河区某小区 套餐：20米', expect: { customerName: '姓名', phone: '13800138000' } },
  { name: '群公告(P0-123)', input: '# 群公告 #\n订单来源：测试君\n购车人/电话：高测试13800001111\n桩名称：银河微金刚款 车辆型号：银河E5', expect: { customerName: '高测试', brandName: '吉利' } },
  { name: '外联单(P0-138 车主优先)', input: '外联单号: HW1\n联系人: 梁测试\n联系人电话: 13900001111\n车主姓名: 徐测试\n车主电话: 13800002222', expect: { customerName: '徐测试', phone: '13800002222' } },
  { name: '万联变体1', input: 'D2026100101010001WL五菱缤果ProQ13800001111安徽省淮北市濉溪县韩村镇海孜矿某街道LK6ADAE39TG0000007KW充电桩（五菱）地面壁挂 电表已安装挚达五菱 挚达五菱 （线缆：30米，请务必确认客户的核销码是否过期）', expect: { orderNo: 'D2026100101010001', customerName: 'Q', phone: '13800001111', powerKw: '7', brandName: '五菱', platformName: '挚达' } },
  { name: '万联变体2', input: 'D2026090102020002WL 安徽省淮北市濉溪县某镇某村 星测试 13900002222 LK6ADBHL7TB000000 7KW充电桩（五菱） 地面壁挂电表已安装 挚达五菱 （线缆：3*6）', expect: { orderNo: 'D2026090102020002', customerName: '星测试', phone: '13900002222', powerKw: '7' } },
  { name: '样本C(R4)', input: 'D2026100101010003WL lxTestGDzG 13800001111 安徽省淮北市 恒大名都9栋 LK6ADAE35TG000000 7KW充电桩+30米安装', expect: { orderNo: 'D2026100101010003', customerName: 'lxTestGDzG', phone: '13800001111', address: '安徽省淮北市恒大名都9栋', vin: 'LK6ADAE35TG000000', powerKw: '7' } },
  { name: '地址串位(P0-140-R5 谢素玲形态 addr=name应修复)', input: '谢素玲 13900003333 安徽省宿州市埇桥区某小区3栋 套餐：20米',
    expect: { customerName: '谢素玲', address: '安徽省宿州市埇桥区某小区3栋 套餐：20米' } }, // 既有解析合理(铁律零触碰), 套餐尾=既有行为锁
  { name: '均胜KV(P0-141 客户名称优先+联系人+权益到期排除)', input: '202609220808-B长城-长城魏牌7KW墙盒-30米基础安装套餐\n是否带桩：是\n客户名称：李测试\n用户信息：朱先生-13900001111\n车架号/VIN：LGWFGVA81SM000000\n安装地址：安徽省-淮北市-烈山区-杨庄街道二郎庙村三组\n权益到期时间：2027-10-26\n车型：魏牌',
    expect: { customerName: '李测试', phone: '13900001111', vin: 'LGWFGVA81SM000000', appointmentDate: '' } },
  { name: '均胜流式尾段(P0-141 地址止VIN前+单号/车型入位)', input: '姓名 甲 电话 13900004444 均胜长城 安徽省淮北市某区凤凰社区 L6T79BAZ3SV000000 银河M9 HW2025121316161800001 2026/12/12',
    expect: { address: '安徽省淮北市某区凤凰社区', vin: 'L6T79BAZ3SV000000', vehicleModel: '银河M9', orderNo: 'HW2025121316161800001' } },
  { name: '微信包装(P0-132)', input: '「方中发💍189 5605 1764 16:47」\n"订单来源：妍伟（送桩卷）\n颜伟\n所属品牌：吉利星愿\n套餐：20米\n购车人电话：139 0000 1111\n安装地址：安徽省合肥市包河区测试小区1栋"', expect: { customerName: '颜伟', phone: '13900001111', platformName: '妍伟' } },
  { name: '流式行内单号+备注污染(P0-212)', input: '6930661288138735200 测试甲 13800001111 安徽省安庆市迎江区老峰镇测试路测试小区A2.2004 天猫 地下 壁挂 电表已安装\n10.21-10.26装挚电商（不知道问测试员（要不要待桩安装时问测试员',
    expect: { orderNo: '6930661288138735200', serviceType: '', remark: '10.21-10.26装挚电商（不知道问测试员（要不要待桩安装时问测试员', phone: '13800001111', platformName: '天猫', meterStatus: '已安装' }  },
  { name: 'P0-214 速家键名体系', input: '平台：速家\n单号：HAVAL20260101000000000INS\n套包：长城-30米7KW安装权益套包\n车型：哈弗哈弗猛龙TEST\n权益类型：\n服务类型：安装\n用户：王某某\n电话：13800000000\n地址：安徽省安庆市某镇某路某号\n备注：【订单申请备注】【派单备注】自动派单【权益到期时间】2028-01-01 00:00:00\n派单时间：2026-01-01 09:00:00',
    expect: { platformName: '速家', orderNo: 'HAVAL20260101000000000INS', brandName: '长城', powerKw: '7', packageMeters: '30', customerName: '王某某', phone: '13800000000', address: '安徽省安庆市某镇某路某号', serviceType: '安装' } }
]