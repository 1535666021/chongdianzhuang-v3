import { Clock, MapPin } from 'lucide-react'
import type { GroupMode } from '@/types'

interface GroupToggleProps {
  groupMode: GroupMode
  isSmart: boolean
  onToggleDimension: () => void
  onToggleSmart: () => void
}

export default function GroupToggle({ groupMode, isSmart, onToggleDimension, onToggleSmart }: GroupToggleProps) {
  const dimensionLabel = groupMode === 'time' ? '按时间' : '按区域'

  return (
    <div className="ofb-group-toggle">
      <button
        type="button"
        className="ofb-btn ofb-btn--blue"
        onClick={onToggleDimension}
        disabled={isSmart}
      >
        <Clock size={14} />
        {dimensionLabel}
      </button>
      <button
        type="button"
        className={`ofb-btn ofb-btn--green ${isSmart ? 'ofb-btn--active' : ''}`}
        onClick={onToggleSmart}
        aria-pressed={isSmart}
      >
        <MapPin size={14} />
        智能分组
      </button>
    </div>
  )
}
