import { useState, useEffect, useMemo } from 'react'
import { X, Search, Link2 } from 'lucide-react'
import { getAllAddonMaterials } from '@/shared/utils/addonMaterialsResolver'
import { getCostMapping, setCostMapping } from '@/shared/storage/costMappingStorage'
import { calcFullMaterialCost, findCostPrice } from '@/shared/utils/orderCalc'
import { useToast } from '@/shared/hooks/useToast'
import { formatCurrency } from '@/shared/utils/format'
import CostItemPicker from '@/shared/components/CostItemPicker'
import { isWanbangGeelyOrder } from '@/constants/addonPrice_wanbang_geely'
import { isZhidaWulingOrder } from '@/constants/addonPrice_zhida_wuling'
import { getMaterialFrequency, sortMaterialsByFrequency } from '@/features/material/hooks/useMaterialFrequency'
import type { Material } from '@/types/material'

interface Picked {
  id: string
  name: string
  unit: string
  quantity: number
  settlementPrice: number
}

interface Props {
  onClose: () => void
  /** P0-255：当前订单有效品牌（MaterialPicker 已按模板布尔映射挚达/五菱、万帮吉利；此处再做吉利单参兜底）——候选=该品牌客户价表（禁成本表/禁他牌） */
  brandName?: string
  /** 件2：确认一次全进单（useCompletion.addMaterials） */
  onConfirm: (list: { name: string; unit: string; quantity: number; settlementPrice: number }[]) => void
}

/** P0-255：添加材料底部上拉半屏弹窗——当前品牌客户价表+搜索+复选+就地数量+绑定状态。
 *  铁规矩：弹窗零自算——已选区合计金额一律读 calcFullMaterialCost 出口 total；行价=客户价；
 *  成本不进本弹窗（进单时由 useCompletion 走 findCostPrice 既有成本绑定解析）。
 */
export default function AddMaterialsSheet({ onClose, brandName, onConfirm }: Props) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Picked[]>([])
  const [bindFor, setBindFor] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

  // P0-255·A：候选=当前订单品牌客户价表（P0-130 品牌口径复用：万帮吉利单参映射兜底；挚达/五菱由调用方模板布尔预映射）；品牌空=未配置
  const targetBrand = useMemo(() => {
    const b = (brandName || '').trim()
    if (!b) return ''
    return isWanbangGeelyOrder(b) ? '万帮吉利' : isZhidaWulingOrder(b) ? '挚达/五菱' : b
  }, [brandName])

  // P0-255·D：候选按使用频率排序（slice 前）；搜索过滤后再按频率排、再截断
  const frequency = useMemo(() => getMaterialFrequency(), [])
  const catalog = useMemo(() => {
    if (!targetBrand) return []
    const brandItems = getAllAddonMaterials().filter((m) => (m.brand || '') === targetBrand)
    return sortMaterialsByFrequency(brandItems, frequency)
  }, [targetBrand, frequency])

  const filtered = useMemo(
    () => sortMaterialsByFrequency(query ? catalog.filter((m) => m.name.includes(query)) : catalog, frequency).slice(0, 50),
    [query, catalog, frequency],
  )

  const isPicked = (id: string) => picked.some((p) => p.id === id)
  const toggle = (m: Material) => {
    setPicked((prev) => (isPicked(m.id) ? prev.filter((p) => p.id !== m.id) : [...prev, { id: m.id, name: m.name, unit: m.unit || '个', quantity: 1, settlementPrice: m.settlementPrice || 0 }]))
  }
  const updateQty = (id: string, quantity: number) => {
    setPicked((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, Number.isFinite(quantity) ? quantity : 0) } : p)))
  }

  // 铁规矩1：合计读出口——把已选喂给出口，total 直接展示（含未绑定项按 0，与单内口径一致）
  const pickedTotal = useMemo(() => {
    if (picked.length === 0) return null
    return calcFullMaterialCost({
      cableMeters: 0, pvcMeters: 0, breakerCount: 0, breakerType: '',
      extraItems: picked.map((p) => ({ name: p.name, quantity: p.quantity })),
    }).total
  }, [picked])

  // P0-255·C：成本另走成本绑定——此处仅展示绑定状态/建立绑定，不显示、不修改成本价
  const bindState = (name: string) => {
    const mapped = getCostMapping(name)
    if (mapped) return { label: `绑定到 ${mapped}`, ok: true }
    return findCostPrice(name) !== null ? { label: '同名命中', ok: true } : { label: '未绑定', ok: false }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-h-[80vh] rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">添加材料（品牌客户价表）</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* 顶部已选区：件数+合计金额（金额=出口 total，禁自算） */}
        <div className="px-4 py-2 bg-blue-50 flex items-center justify-between text-xs">
          <span className="text-blue-700">已选 {picked.length} 件</span>
          <span className="text-blue-700 font-medium">合计 {pickedTotal === null ? '—' : formatCurrency(pickedTotal)}</span>
        </div>

        <div className="px-4 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={targetBrand ? `搜索${targetBrand}价表条目...` : '搜索价表条目...'}
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.map((m) => {
            const st = bindState(m.name)
            const p = picked.find((x) => x.id === m.id)
            return (
              <div key={m.id} className="flex items-center gap-2 px-2 py-2 border-b border-gray-50 text-sm">
                <input
                  type="checkbox"
                  checked={!!p}
                  onChange={() => toggle(m)}
                  className="shrink-0"
                />
                <span className="flex-1 text-gray-700" style={{ wordBreak: 'break-all' }}>{m.name}</span>
                <span className={`text-[10px] shrink-0 ${st.ok ? 'text-gray-400' : 'text-orange-600'}`}>
                  {st.ok ? st.label : (
                    <button type="button" className="underline" onClick={() => setBindFor(m.name)}><Link2 size={10} className="inline" /> 未绑定·去绑定</button>
                  )}
                </span>
                {p ? (
                  <input
                    type="number"
                    value={p.quantity}
                    onChange={(e) => updateQty(m.id, parseFloat(e.target.value))}
                    className="w-14 text-right border border-gray-200 rounded px-1 py-0.5 text-xs shrink-0"
                  />
                ) : (
                  <span className="text-gray-400 text-xs w-14 text-right shrink-0">{m.unit || '个'}</span>
                )}
                <span className="text-xs text-blue-600 shrink-0">¥{m.settlementPrice}</span>
              </div>
            )
          })}
          {catalog.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">未配置当前品牌价表</p>
          )}
          {catalog.length > 0 && filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-4">无匹配条目</p>}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-sm text-gray-600">取消</button>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onConfirm(picked.map((p) => ({ name: p.name, unit: p.unit, quantity: p.quantity, settlementPrice: p.settlementPrice })))}
            className="flex-1 py-2 rounded-lg text-sm text-white bg-blue-600 disabled:bg-gray-300"
          >
            确认添加（{picked.length}）
          </button>
        </div>

        {bindFor && (
          <CostItemPicker
            materialName={bindFor}
            selectedCostName={getCostMapping(bindFor)}
            onSelect={(costName) => { setCostMapping(bindFor, costName); setBindFor(null); toast.toast.success('已绑定') }}
            onClose={() => setBindFor(null)}
          />
        )}
      </div>
    </div>
  )
}
