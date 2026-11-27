interface TagCloudProps {
  tags: { label: string; count: number }[]
  total: number // P0-268-A：总数=基集合去重长度，禁标签计数求和（一单一多标签会虚增）
  selected: string | null
  onSelect: (tag: string | null) => void
}

export default function TagCloud({ tags, total, selected, onSelect }: TagCloudProps) {

  return (
    <div className="ofb-tag-cloud" role="group" aria-label="标签云">
      <button
        type="button"
        className={`ofb-tag ${selected === null ? 'ofb-tag--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        全部({total})
      </button>
      {tags.map((tag) => (
        <button
          key={tag.label}
          type="button"
          className={`ofb-tag ${selected === tag.label ? 'ofb-tag--active' : ''}`}
          onClick={() => onSelect(selected === tag.label ? null : tag.label)}
        >
          {tag.label}({tag.count})
        </button>
      ))}
    </div>
  )
}
