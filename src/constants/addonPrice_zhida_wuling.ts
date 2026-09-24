/**
 * 挚达/五菱客户增项价表（P0-113，印刷体22项誊录入收费单，手写忽略）。
 * 结构对齐 addonPrice_wanbang_geely.ts：价目表 → 收费单材料项映射由
 * ZHIDA_WULING_ADDON_MATERIALS 完成；成本侧 costPrice=null（走成本绑定映射，
 * 与客户价互不干扰）。
 * 命名红线：项名不得含 电缆/PVC/YJV/yjv 关键词（isFreeQuotaMaterial 会将其
 * 误判为套餐免费辅材而跳过应收）——"含安装/自购仅收安装费"已拆为独立两项。
 */
import type { Material, MaterialCategory, MaterialCategoryCode } from '@/types/material'
import { CATEGORY_MAP, type AddonPriceItem } from './addonPrice_wanbang_geely'

export const ZHIDA_WULING_ADDON_PRICES: AddonPriceItem[] = [
  // 【线缆】3*6 含"电缆"关键词→走既有超米减免口径（套餐内¥0），其余线缆命名避开关键词按普通增项全额
  { id: 'zw-01', name: '电缆 3*6mm²', spec: 'ZR-YJV-0.6/1KV-3*6', unit: '米', customerPrice: 40, category: '线缆铺设', remark: '30米套餐内免费' },
  { id: 'zw-02', name: '线缆 3*10mm²', spec: 'ZR-YJV-0.6/1KV-3*10', unit: '米', customerPrice: 55, category: '线缆铺设' },
  { id: 'zw-03', name: '线缆 3*16mm²', spec: 'ZR-YJV-0.6/1KV-3*16', unit: '米', customerPrice: 65, category: '线缆铺设' },
  { id: 'zw-04', name: '镀锌管升级', spec: 'PVC管升级镀锌管', unit: '米', customerPrice: 10, category: '辅材', remark: '升级项' },
  // 【耗材】保护箱/立柱"含安装/自购仅收安装费"两形态拆独立选项，互不干扰各自计价
  { id: 'zw-05', name: '保护箱（含箱含安装）', spec: '', unit: '台', customerPrice: 350, category: '保护箱' },
  { id: 'zw-06', name: '保护箱安装费（用户自购箱）', spec: '', unit: '台', customerPrice: 50, category: '保护箱' },
  { id: 'zw-07', name: '立柱（含柱含安装）', spec: '', unit: '台', customerPrice: 200, category: '立柱' },
  { id: 'zw-08', name: '立柱安装费（用户自购柱）', spec: '', unit: '台', customerPrice: 50, category: '立柱' },
  { id: 'zw-09', name: '断路器25A（3.5kW适用）', spec: '2P 25A', unit: '台', customerPrice: 50, category: '辅材' },
  { id: 'zw-10', name: '断路器40A（7kW适用）', spec: '2P 40A', unit: '台', customerPrice: 50, category: '辅材' },
  { id: 'zw-11', name: '桥架50*50*1.2mm', spec: '镀锌材质', unit: '米', customerPrice: 50, category: '桥架' },
  // 【特殊施工】
  { id: 'zw-12', name: '墙面钻孔（<40CM）', spec: '非承重墙', unit: '个', customerPrice: 40, category: '开孔' },
  { id: 'zw-13', name: '墙面钻孔（>40CM）', spec: '非承重墙', unit: '个', customerPrice: 60, category: '开孔' },
  { id: 'zw-14', name: '墙面开槽含恢复', spec: '', unit: '米', customerPrice: 50, category: '开挖' },
  { id: 'zw-15', name: '土路面开挖', spec: '', unit: '米', customerPrice: 80, category: '开挖' },
  { id: 'zw-16', name: '水泥地砖地面开挖', spec: '', unit: '米', customerPrice: 120, category: '开挖' },
  { id: 'zw-17', name: '浇筑立柱水泥墩', spec: '', unit: '个', customerPrice: 250, category: '基础' },
  { id: 'zw-18', name: '预埋接地线', spec: '', unit: '次', customerPrice: 150, category: '接地', remark: '有接地极免费' },
  { id: 'zw-19', name: '吊筋', spec: '', unit: '根', customerPrice: 10, category: '辅材' },
  // 【其他】
  { id: 'zw-20', name: '二次勘测上门', spec: '', unit: '次', customerPrice: 100, category: '服务', remark: '首次免费' },
  { id: 'zw-21', name: '高空作业', spec: '≥4米', unit: '米', customerPrice: 35, category: '高空' },
  { id: 'zw-22', name: '远程服务费', spec: '超30公里部分', unit: '公里', customerPrice: 4, category: '服务', remark: '30公里内免费' },
]

/** 挚达/五菱订单判定（品牌键；品牌名为空不命中，平台词不作门槛） */
export function isZhidaWulingOrder(brand?: string): boolean {
  return /挚达|五菱/.test((brand || '').toLowerCase())
}

export const ZHIDA_WULING_ADDON_MATERIALS: Material[] = ZHIDA_WULING_ADDON_PRICES.map((item) => {
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
    brand: '挚达/五菱',
    freeQuota: 0,
    source: 'addon',
    stock: 0,
    minStock: 0,
    isFixed: true,
  }
})
