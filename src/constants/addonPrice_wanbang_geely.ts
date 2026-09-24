import type { Material, MaterialCategory, MaterialCategoryCode } from '@/types/material'

export interface AddonPriceItem {
  id: string
  name: string
  spec: string
  unit: string
  customerPrice: number
  category: string
  remark?: string
}

export const CATEGORY_MAP: Record<string, { category: MaterialCategory; categoryCode: MaterialCategoryCode }> = {
  服务: { category: '服务', categoryCode: 'SERVICE' },
  线缆铺设: { category: '线缆', categoryCode: 'CABLE' },
  开挖: { category: '路面', categoryCode: 'ROAD_OPEN' },
  基础: { category: '基础', categoryCode: 'FOUNDATION' },
  开孔: { category: '开孔', categoryCode: 'WALL_DRILL' },
  桥架: { category: '桥架', categoryCode: 'BRIDGE' },
  高空: { category: '高空', categoryCode: 'HIGH_ALTITUDE' },
  接地: { category: '接地', categoryCode: 'GROUND' },
  辅材: { category: '辅材', categoryCode: 'OTHER' },
  保护箱: { category: '保护箱', categoryCode: 'BOX' },
  立柱: { category: '立柱', categoryCode: 'POLE' },
}

export const WANBANG_GEELY_ADDON_PRICES: AddonPriceItem[] = [
  { id: 'wb-geely-01', name: '代办电力报装（北京）', spec: '北京', unit: '项', customerPrice: 600, category: '服务' },
  { id: 'wb-geely-02', name: '代办电力报装（其他地区）', spec: '其他地区', unit: '项', customerPrice: 300, category: '服务' },
  { id: 'wb-geely-03', name: '充电桩移机', spec: '单独拆卸安装', unit: '次', customerPrice: 350, category: '服务', remark: '3公里内' },
  { id: 'wb-geely-04', name: '线缆 3*6mm²', spec: 'ZR-YJV-0.6/1KV-3*6', unit: '米', customerPrice: 40, category: '线缆铺设', remark: '含线缆PVC管人工' },
  { id: 'wb-geely-05', name: '线缆 3*10mm²', spec: 'ZR-YJV-0.6/1KV-3*10', unit: '米', customerPrice: 55, category: '线缆铺设' },
  { id: 'wb-geely-06', name: '线缆 3*16mm²', spec: 'ZR-YJV-0.6/1KV-3*16', unit: '米', customerPrice: 70, category: '线缆铺设' },
  { id: 'wb-geely-07', name: '线缆 5*6mm²', spec: 'ZR-YJV-0.6/1KV-5*6', unit: '米', customerPrice: 55, category: '线缆铺设' },
  { id: 'wb-geely-08', name: '线缆 5*10mm²', spec: 'ZR-YJV-0.6/1KV-5*10', unit: '米', customerPrice: 75, category: '线缆铺设' },
  { id: 'wb-geely-09', name: '线缆 5*16mm²', spec: 'ZR-YJV-0.6/1KV-5*16', unit: '米', customerPrice: 90, category: '线缆铺设' },
  { id: 'wb-geely-10', name: '普通土地开挖', spec: '常规地面', unit: '米', customerPrice: 30, category: '开挖' },
  { id: 'wb-geely-11', name: '水泥砖路面开挖', spec: '常规地面', unit: '米', customerPrice: 90, category: '开挖' },
  { id: 'wb-geely-12', name: '沥青路面开挖', spec: '沥青路面', unit: '米', customerPrice: 150, category: '开挖' },
  { id: 'wb-geely-13', name: '立柱混凝土基础（小）', spec: '400×350×350', unit: '个', customerPrice: 150, category: '基础' },
  { id: 'wb-geely-14', name: '立柱混凝土基础（大）', spec: '600×440×370', unit: '个', customerPrice: 300, category: '基础' },
  { id: 'wb-geely-15', name: '打墙洞/穿墙孔', spec: '非承重墙', unit: '个', customerPrice: 50, category: '开孔' },
  { id: 'wb-geely-16', name: '桥架及安装 50*50', spec: '镀锌材质', unit: '米', customerPrice: 40, category: '桥架' },
  { id: 'wb-geely-17', name: '高空作业费', spec: '5米及以上', unit: '米', customerPrice: 35, category: '高空', remark: '1000元封顶' },
  { id: 'wb-geely-18', name: '上门检测费', spec: '质保外', unit: '次', customerPrice: 200, category: '服务' },
  { id: 'wb-geely-19', name: '打地极', spec: '', unit: '次', customerPrice: 150, category: '接地' },
  { id: 'wb-geely-20', name: '打吊丝', spec: '', unit: '根', customerPrice: 20, category: '辅材', remark: '200元封顶' },
  { id: 'wb-geely-21', name: '充电桩保护盒 7kW', spec: '普通款', unit: '个', customerPrice: 450, category: '保护箱', remark: '包安装' },
  { id: 'wb-geely-22', name: '立柱（普通款）', spec: '7kW', unit: '根', customerPrice: 300, category: '立柱', remark: '包安装' },
  { id: 'wb-geely-23', name: '立柱（直流款）', spec: '20kW', unit: '根', customerPrice: 650, category: '立柱' },
  { id: 'wb-geely-24', name: '一体式保护箱+立柱', spec: '7kW', unit: '套', customerPrice: 550, category: '保护箱' },
  { id: 'wb-geely-25', name: '电表箱 PZ30', spec: '', unit: '个', customerPrice: 40, category: '辅材' },
  { id: 'wb-geely-26', name: '电表 40A', spec: '单相', unit: '个', customerPrice: 150, category: '辅材' },
  { id: 'wb-geely-27', name: '空气开关 2P 40A', spec: '220V', unit: '个', customerPrice: 50, category: '辅材' },
  { id: 'wb-geely-28', name: '空气开关 2P 40A 带漏保', spec: '220V', unit: '个', customerPrice: 85, category: '辅材' },
  { id: 'wb-geely-29', name: '空气开关 4P 40A 带漏保', spec: '', unit: '个', customerPrice: 110, category: '辅材' },
  { id: 'wb-geely-30', name: '空气开关 4P 带漏保', spec: '', unit: '个', customerPrice: 180, category: '辅材' },
  { id: 'wb-geely-31', name: '其他材料', spec: '', unit: '项', customerPrice: 0, category: '辅材', remark: '膨胀螺丝等免费' },
]

/**
 * 吉利系订单判定（勘测弹窗增项价表 / 完工页结算共用入口）。
 * 口径与 src/shared/utils/orderCalc.ts 的 isGeelyBrand 完全一致：吉利/银河/极氪。
 * 优先看 brandName；brandName 为空时才用平台/原文兜底二次判断；
 * brandName 明确存在且非吉利系 → 一律不命中。平台词仅作辅助、不作门槛。
 */
export function isWanbangGeelyOrder(brand?: string, platform?: string, extra?: string): boolean {
  const b = (brand || '').toLowerCase()
  if (/吉利|银河|极氪/.test(b)) return true
  if (b) return false
  return /吉利|银河|极氪/.test(`${platform || ''} ${extra || ''}`)
}

export const WANBANG_GEELY_ADDON_MATERIALS: Material[] = WANBANG_GEELY_ADDON_PRICES.map((item) => {
  const mapped = CATEGORY_MAP[item.category] || { category: '其他' as MaterialCategory, categoryCode: 'OTHER' as MaterialCategoryCode }
  return {
    id: item.id,
    name: item.name,
    category: mapped.category,
    categoryCode: mapped.categoryCode,
    unit: item.unit,
    costPrice: null,
    settlementPrice: item.customerPrice,
    customerPrice: item.customerPrice,
    brand: '万帮吉利',
    freeQuota: 0,
    source: 'addon',
    stock: 0,
    minStock: 0,
    isFixed: true,
  }
})
