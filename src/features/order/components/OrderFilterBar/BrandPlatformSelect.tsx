import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BottomSheetSelect } from '@/shared/components/BottomSheetSelect'

interface SelectFieldProps {
  title: string
  placeholder: string
  value: string | null
  options: string[]
  onChange: (value: string | null) => void
}

function SelectField({ title, placeholder, value, options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false)

  const sheetOptions = [
    { value: '', label: placeholder },
    ...options.map((option) => ({ value: option, label: option })),
  ]

  return (
    <div className="ofb-select">
      <button type="button" className="ofb-select__trigger" onClick={() => setOpen(true)}>
        <span className={value ? 'ofb-select__value' : 'ofb-select__placeholder'}>{value || placeholder}</span>
        <ChevronDown size={16} className="ofb-select__arrow" />
      </button>
      {open && (
        <BottomSheetSelect
          title={title}
          options={sheetOptions}
          value={value || ''}
          onChange={(option) => onChange(option.value ? String(option.value) : null)}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

interface BrandPlatformSelectProps {
  brands: string[]
  platforms: string[]
  brand: string | null
  platform: string | null
  onBrandChange: (brand: string | null) => void
  onPlatformChange: (platform: string | null) => void
}

export default function BrandPlatformSelect({
  brands,
  platforms,
  brand,
  platform,
  onBrandChange,
  onPlatformChange,
}: BrandPlatformSelectProps) {
  return (
    <div className="ofb-select-row">
      <SelectField title="选择品牌" placeholder="全部品牌" value={brand} options={brands} onChange={onBrandChange} />
      <SelectField title="选择平台" placeholder="全部平台" value={platform} options={platforms} onChange={onPlatformChange} />
    </div>
  )
}
