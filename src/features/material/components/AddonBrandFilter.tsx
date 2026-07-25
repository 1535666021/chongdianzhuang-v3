import { MATERIAL_BRANDS } from '@/constants/materialData'

interface Props {
  selected: string
  onChange: (brand: string) => void
}

export default function AddonBrandFilter({ selected, onChange }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
      >
        <option value="全部">全部品牌（{MATERIAL_BRANDS.length}个）</option>
        {MATERIAL_BRANDS.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
    </div>
  )
}
