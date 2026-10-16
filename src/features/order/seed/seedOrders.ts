import type { InstallType, Order, OrderStatus, Platform, Region } from '@/types'

const REGION_STREETS: Record<Region, string[]> = {
  '巢湖': ['亚父街道', '凤凰山街道', '烔炀镇', '柘皋镇', '黄麓镇', '槐林镇'],
  '合肥': ['骆岗街道', '大圩镇', '淝河镇', '烟墩街道', '三十岗乡'],
  '芜湖': ['澛港街道', '白马街道', '火龙岗镇', '三山街道'],
  '马鞍山': ['慈湖街道', '向山镇', '采石街道'],
  '滁州': ['琅琊街道', '乌衣镇', '沙河镇'],
  '宣城': ['济川街道', '水阳镇', '狸桥镇'],
  '安庆': ['菱湖街道', '长风乡', '白泽湖乡'],
  '其他': ['城关街道', '中心镇'],
}

const BRANDS = ['比亚迪', '特斯拉', '蔚来', '零跑', '小鹏', '理想', '极氪', '深蓝', '吉利', '埃安']
const PLATFORMS: Platform[] = ['京东', '天猫', '淘宝', '拼多多', '抖音', '其他']
const INSTALL_TYPES: InstallType[] = ['带桩上门', '仅安装', '维修', '勘察', '检测', '拆桩', '移机', '其他']
const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗']
const GIVEN = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '桂英', '建华', '志强']
const ROADS = ['健康路', '人民路', '中山路', '建设路', '朝阳路', '长江路', '解放路', '幸福路', '光明路', '和平路']
const INSTALLERS = ['张师傅', '李师傅', '王师傅', '赵师傅', '陈师傅']
const POWER_KW = ['7kW', '11kW', '21kW', '30kW', '40kW']

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function randomPhone(): string {
  const prefixes = ['13', '15', '17', '18', '19']
  let phone = pick(prefixes)
  for (let i = 0; i < 9; i++) phone += randomInt(0, 9)
  return phone
}

function randomName(): string {
  return pick(SURNAMES) + pick(GIVEN) + (Math.random() < 0.3 ? pick(GIVEN) : '')
}

function randomDate(dayOffset: number, hoursOffset = 0): string {
  const base = new Date()
  base.setDate(base.getDate() + dayOffset)
  base.setHours(base.getHours() + hoursOffset)
  return base.toISOString().slice(0, 10)
}

function randomTs(daysAgo: number): number {
  return Date.now() - randomInt(0, daysAgo * 24 * 60 * 60 * 1000)
}

function randomAddress(region: Region): string {
  const street = pick(REGION_STREETS[region])
  const road = pick(ROADS)
  const number = randomInt(1, 200)
  const cityPrefix = region === '巢湖' ? '安徽省合肥市巢湖市' : `安徽省${region}市`
  return `${cityPrefix}${street}${road}${number}号`
}

function buildMaterials(materialCost: number) {
  return [{ name: '充电桩安装材料', quantity: 1, unit: '套', unitPrice: materialCost }]
}

function buildOrder(status: OrderStatus, index: number): Order {
  const region = pick(Object.keys(REGION_STREETS) as Region[])
  const platform = pick(PLATFORMS)
  const brandName = pick(BRANDS)
  const installType = pick(INSTALL_TYPES)
  const customerPrice = randomInt(30, 80) * 100
  const materialCost = randomInt(8, 30) * 100
  const laborCost = randomInt(2, 8) * 100
  const platformFee = Math.round(customerPrice * randomInt(5, 15) / 100)
  const serviceFee = Math.random() < 0.5 ? randomInt(0, 3) * 100 : 0
  const actualProfit = customerPrice - materialCost - platformFee + serviceFee

  const createdAt = randomTs(30)
  const today = new Date().toISOString().slice(0, 10)

  const order: Order = {
    id: `seed_${Date.now()}_${index}_${randomInt(1000, 9999)}`,
    createdAt,
    updatedAt: createdAt + randomInt(0, 24 * 60 * 60 * 1000),
    customerName: randomName(),
    phone: randomPhone(),
    address: randomAddress(region),
    platform,
    platformName: platform,
    status,
    region,
    brandName,
    installType,
    powerKw: pick(POWER_KW),
    materialCost,
    laborCost,
    platformFee,
    actualProfit,
    customerPrice,
    serviceFee,
    notes: '',
    meterStatus: Math.random() < 0.5 ? '已安装' : '未安装',
    installer: pick(INSTALLERS),
    materials: buildMaterials(materialCost),
    remark: Math.random() < 0.5 ? '客户要求周末上门安装' : '',
  }

  if (status === '已预约') {
    const isToday = index % 7 === 0
    order.appointmentDate = isToday ? today : randomDate(randomInt(1, 14))
    order.appointmentTime = pick(['09:00-12:00', '14:00-18:00', '18:00-21:00'])
    order.appointmentNote = ''
  }

  if (installType === '带桩上门') {
    order.restockStatus = status === '已完成' ? 'done' : 'needed'
  }

  if (status === '已完成') {
    order.appointmentDate = randomDate(-randomInt(1, 20))
    order.completeDate = randomDate(-randomInt(0, 15))
    order.actualInstallDate = order.completeDate
    order.payment = { paid: Math.random() < 0.8, paidDate: order.completeDate }
    order.meterStatus = '已安装'
  }

  return order
}

export function generateSeedOrders(count = 45): Order[] {
  const orders: Order[] = []
  const statuses: OrderStatus[] = ['待办', '已预约', '已完成']
  for (let i = 0; i < count; i++) {
    const status = statuses[i % 3]
    orders.push(buildOrder(status, i))
  }
  return orders
}
