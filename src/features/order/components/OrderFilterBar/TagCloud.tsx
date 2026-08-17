interface TagCloudProps {
  tags: { label: string; count: number }[]
  selected: string | null
  onSelect: (tag: string | null) => void
}

export default function TagCloud({ tags, selected, onSelect }: TagCloudProps) {
  const total = tags.reduce((sum, tag) => sum + tag.count, 0)

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
