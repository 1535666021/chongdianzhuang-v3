import { useMemo, useState } from 'react'
import { Calculator, Search, X, RotateCcw } from 'lucide-react'
import { brandList, addonMaterialsData } from '@/constants/materialData'
import { PLATFORMS } from '@/constants/order'
import { useSettingsStore } from '@/stores/settingsStore'
import { calcSalaryEstimate } from '@/shared/utils/orderCalc'

interface SelectedMaterial {
  name: string
  settlementPrice: number
  unit: string
  quantity: number
}

const MAX_RESULT = 50

export default function SalaryCalculator() {
  const getPlatformFeeRate = useSettingsStore((s) => s.getPlatformFeeRate)
  const [open, setOpen] = useState(true)
  const [brand, setBrand] = useState('万帮吉利')
  const [platform, setPlatform] = useState<string>(PLATFORMS[0])
  const [packageMeters, setPackageMeters] = useState('30')
  const [actualMeters, setActualMeters] = useState('30')
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<Record<string, SelectedMaterial>>({})

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    if (!k) return addonMaterialsData.slice(0, MAX_RESULT)
    return addonMaterialsData
      .filter((m) => m.name.toLowerCase().includes(k))
      .slice(0, MAX_RESULT)
  }, [keyword])

  const estimate = useMemo(() => {
    const materials = Object.values(selected).map((m) => ({
      name: m.name,
      quantity: m.quantity,
      settlementPrice: m.settlementPrice,
    }))
    return calcSalaryEstimate({
      brand,
      packageMeters: parseFloat(packageMeters) || 0,
      actualMeters: parseFloat(actualMeters) || 0,
      platformRate: getPlatformFeeRate(platform),
      materials,
    })
  }, [brand, packageMeters, actualMeters, platform, selected, getPlatformFeeRate])

  const toggleMaterial = (name: string, settlementPrice: number, unit: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[name]) {
        delete next[name]
      } else {
        next[name] = { name, settlementPrice, unit, quantity: 1 }
      }
      return next
    })
  }

  const updateQuantity = (name: string, quantity: number) => {
    setSelected((prev) => {
      if (!prev[name]) return prev
      return { ...prev, [name]: { ...prev[name], quantity: Math.max(0, quantity) } }
    })
  }

  const reset = () => {
    setBrand('万帮吉利')
    setPlatform(PLATFORMS[0])
    setPackageMeters('30')
    setActualMeters('30')
    setKeyword('')
    setSelected({})
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center justify-center gap-1.5"
      >
        <Calculator size={16} />
        打开工资计算器
      </button>
    )
  }

  const fmt = (n: number) => `¥${n.toFixed(2)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-[90%] max-w-[400px] max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-base font-bold text-gray-800">
            <Calculator size={18} className="text-blue-500" />
            工资计算器
          </div>
          <div className="flex items-center gap-1">
            <button onClick={reset} className="p-1.5 text-gray-400 hover:text-gray-600" title="重置">
              <RotateCcw size={16} />
            </button>
            <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600" title="关闭">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs text-gray-500">品牌</span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">无品牌</option>
              {brandList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">平台</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">套餐米数</span>
            <input
              type="number"
              value={packageMeters}
              onChange={(e) => setPackageMeters(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500">实际米数</span>
            <input
              type="number"
              value={actualMeters}
              onChange={(e) => setActualMeters(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-gray-500">增项材料</span>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索增项材料"
              className="w-full rounded-lg border border-gray-300 pl-7 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-xs text-gray-400 text-center">无匹配材料</div>
            )}
            {filtered.map((m) => {
              const item = selected[m.name]
              return (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                  <label className="flex flex-1 min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!item}
                      onChange={() => toggleMaterial(m.name, m.settlementPrice, m.unit)}
                      className="shrink-0"
                    />
                    <span className="flex-1 min-w-0 truncate text-xs text-gray-700">
                      {m.name}
                      <span className="ml-1 text-gray-400">{fmt(m.settlementPrice)}/{m.unit}</span>
                    </span>
                  </label>
                  {item && (
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(m.name, parseInt(e.target.value, 10) || 0)}
                      className="w-16 shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5 rounded-xl bg-blue-500 p-3 text-white">
          <div className="flex justify-between text-sm">
            <span>结算费{estimate.isGeely ? '（吉利）' : ''}</span>
            <span className="font-medium">{fmt(estimate.settlementFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>增项费用{estimate.overMeters > 0 ? `（超${estimate.overMeters}米）` : ''}</span>
            <span className="font-medium">{fmt(estimate.addonFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>材料成本</span>
            <span className="font-medium">-{fmt(estimate.materialCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>平台扣点{estimate.isGeely ? '（吉利免）' : ''}</span>
            <span className="font-medium">-{fmt(estimate.platformFee)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-white/30 pt-2 text-base font-bold">
            <span>实际工资</span>
            <span>{fmt(estimate.salary)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
