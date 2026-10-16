import type { InstallType } from '@/types'

interface TypeFilterProps {
  types: { label: InstallType; count: number }[]
  selected: InstallType | null
  onSelect: (type: InstallType | null) => void
}

export default function TypeFilter({ types, selected, onSelect }: TypeFilterProps) {
  return (
    <div className="ofb-tag-cloud" role="group" aria-label="安装类型">
      <button
        type="button"
        className={`ofb-tag ofb-tag--purple ${selected === null ? 'ofb-tag--purple-active' : ''}`}
        onClick={() => onSelect(null)}
      >
        全部类型
      </button>
      {types.map((type) => (
        <button
          key={type.label}
          type="button"
          className={`ofb-tag ofb-tag--purple ${selected === type.label ? 'ofb-tag--purple-active' : ''}`}
          onClick={() => onSelect(selected === type.label ? null : type.label)}
        >
          {type.label}({type.count})
        </button>
      ))}
    </div>
  )
}
