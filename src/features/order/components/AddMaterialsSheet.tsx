import { useState, useEffect, useMemo } from 'react'
import { X, Search, Link2 } from 'lucide-react'
import { getAllCostMaterials } from '@/shared/utils/costMaterialsResolver'
import { getCostMapping, setCostMapping } from '@/shared/storage/costMappingStorage'
import { calcFullMaterialCost, findCostPrice } from '@/shared/utils/orderCalc'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/shared/hooks/useToast'
import { formatCurrency } from '@/shared/utils/format'
import CostItemPicker from '@/shared/components/CostItemPicker'
import type { Material } from '@/types/material'

interface Picked {
  id: string
  name: string
  unit: string
  quantity: number
  costPrice: number
}

interface Props {
  onClose: () => void
  /** 件2：确认一次全进单（useCompletion.addMaterials） */
  onConfirm: (list: { name: string; unit: string; quantity: number; costPrice: number }[]) => void
}

/** P0-241件2：添加材料底部上拉半屏弹窗——成本表全量+搜索+复选+就地数量+点价改（写成本表全局）+绑定状态。
 *  铁规矩：弹窗零自算——已选区合计金额一律读 calcFullMaterialCost 出口 total。
 */
export default function AddMaterialsSheet({ onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Picked[]>([])
  const [bindFor, setBindFor] = useState<string | null>(null)
  const [priceEdit, setPriceEdit] = useState<{ id: string; value: string } | null>(null)
  const setCostPrice = useSettingsStore((s) => s.setCostPrice)
  const toast = useToast()

  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => { document.body.classList.remove('modal-open') }
  }, [])

  const catalog = getAllCostMaterials()
  const filtered = useMemo(
    () => (query ? catalog.filter((m) => m.name.includes(query)) : catalog).slice(0, 50),
    [query, catalog],
  )

  const isPicked = (id: string) => picked.some((p) => p.id === id)
  const toggle = (m: Material) => {
    setPicked((prev) => (isPicked(m.id) ? prev.filter((p) => p.id !== m.id) : [...prev, { id: m.id, name: m.name, unit: m.unit || '个', quantity: 1, costPrice: m.costPrice || 0 }]))
  }
  const updateQty = (id: string, quantity: number) => {
    setPicked((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, Number.isFinite(quantity) ? quantity : 0) } : p)))
  }

  // 件1/件2 改价同口径：直改成本表绑定价（settingsStore 覆盖制=全局生效），目标=映射目标条目，无映射=同名条目
  const costEntryOf = (name: string) => {
    const target = getCostMapping(name) || name
    return getAllCostMaterials().find((m) => m.name === target) || null
  }
  const applyPrice = (entryId: string, name: string, raw: string) => {
    const entry = getAllCostMaterials().find((m) => m.id === entryId)
    if (!entry) { toast.toast.error('未找到成本条目，请先绑定'); return }
    const v = Number(raw)
    if (!Number.isFinite(v) || v < 0) { toast.toast.error('价格必须≥0'); return }
    setCostPrice(entry.id, v) // 价格唯一写入源=成本表（cdz 覆盖层），findCostPrice 唯一来源不动
    toast.toast.success('已改成本表，以后所有单都按新价')
    setPicked((prev) => prev.map((p) => (p.id === entryId ? { ...p, costPrice: v } : p)))
    setPriceEdit(null)
  }

  // 铁规矩1：合计读出口——把已选喂给出口，total 直接展示（含未绑定项按 0，与单内口径一致）
  const pickedTotal = useMemo(() => {
    if (picked.length === 0) return null
    return calcFullMaterialCost({
      cableMeters: 0, pvcMeters: 0, breakerCount: 0, breakerType: '',
      extraItems: picked.map((p) => ({ name: p.name, quantity: p.quantity })),
    }).total
  }, [picked])

  const bindState = (name: string) => {
    const mapped = getCostMapping(name)
    if (mapped) return { label: `绑定到 ${mapped}`, ok: true }
    return findCostPrice(name) !== null ? { label: '同名命中', ok: true } : { label: '未绑定', ok: false }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-h-[80vh] rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">添加材料（成本表全量）</h3>
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
              placeholder="搜索成本表条目..."
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
                {priceEdit?.id === m.id ? (
                  <span className="flex items-center gap-1 shrink-0">
                    <input
                      autoFocus
                      type="number"
                      value={priceEdit.value}
                      onChange={(e) => setPriceEdit({ id: m.id, value: e.target.value })}
                      className="w-16 text-right border border-blue-300 rounded px-1 py-0.5 text-xs"
                    />
                    <button type="button" className="text-xs text-white bg-blue-600 rounded px-1.5 py-0.5" onClick={() => applyPrice(m.id, m.name, priceEdit.value)}>存</button>
                    <button type="button" className="text-xs text-gray-400" onClick={() => setPriceEdit(null)}>×</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    title="点价改（写成本表，全局生效）"
                    onClick={() => setPriceEdit({ id: m.id, value: String(p?.costPrice ?? m.costPrice ?? 0) })}
                    className="text-xs text-blue-600 underline shrink-0"
                  >
                    ¥{p?.costPrice ?? m.costPrice ?? 0}
                  </button>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-4">无匹配条目</p>}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-sm text-gray-600">取消</button>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => onConfirm(picked.map((p) => ({ name: p.name, unit: p.unit, quantity: p.quantity, costPrice: p.costPrice })))}
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
