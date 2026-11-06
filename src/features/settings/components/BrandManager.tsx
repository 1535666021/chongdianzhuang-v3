import { useState } from 'react'
import { Tag, Trash2 } from 'lucide-react'
import { getCustomBrands, removeCustomBrand } from '@/shared/storage/customBrandStorage'

/** P0-240：设置页品牌管理——列全部自定义品牌、可删除；硬编码20个不显示删除钮（此列表本就不含） */
export default function BrandManager() {
  const [brands, setBrands] = useState<string[]>(() => getCustomBrands())

  const handleRemove = (brand: string) => {
    // P0-240：仅把品牌移出自定义库（下拉不再出现）；存量单品牌字段不动（R-11.2）
    removeCustomBrand(brand)
    setBrands(getCustomBrands())
  }

  return (
    <div className="p-3 space-y-2 bg-white rounded-xl border border-gray-100">
      <p className="text-xs text-gray-400">手动输入的品牌在此统一管理。删除后不再出现在勘测下拉里，已录订单的品牌字段不受影响。</p>
      {brands.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">暂无自定义品牌（勘测弹窗品牌下拉底部可手动添加）</p>
      ) : (
        brands.map((b) => (
          <div key={b} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
            <span className="text-sm text-gray-700 flex items-center gap-2"><Tag size={14} className="text-gray-400" />{b}</span>
            <button type="button" onClick={() => handleRemove(b)} className="text-xs text-red-500 flex items-center gap-1 shrink-0"><Trash2 size={12} />删除</button>
          </div>
        ))
      )}
    </div>
  )
}
