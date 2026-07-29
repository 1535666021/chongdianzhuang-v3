import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { Sliders, Percent, Save } from 'lucide-react'

import { PLATFORMS } from '@/constants/order'

export default function PlatformConfig() {
  const { platformFeeRates, setPlatformFeeRate } = useSettingsStore()
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const handleChange = (platform: string, value: string) => {
    setEditing((prev) => ({ ...prev, [platform]: value }))
  }

  const handleSave = (platform: string) => {
    const val = parseFloat(editing[platform])
    if (!isNaN(val) && val >= 0 && val <= 1) {
      setPlatformFeeRate(platform, val)
    }
    setEditing((prev) => {
      const next = { ...prev }
      delete next[platform]
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Sliders size={12} />
        设置各平台扣点比例（0.1=10%，0.2=20%）
      </div>
      {PLATFORMS.map((platform) => {
        const currentRate = platformFeeRates[platform] ?? 0.2
        const isEditing = editing[platform] !== undefined
        const displayValue = isEditing ? editing[platform] : String(currentRate)

        return (
          <div
            key={platform}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 w-12">{platform}</span>
              <span className="text-xs text-gray-400">
                当前 {(currentRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={displayValue}
                  onChange={(e) => handleChange(platform, e.target.value)}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Percent size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button
                onClick={() => handleSave(platform)}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                title="保存"
              >
                <Save size={14} />
              </button>
            </div>
          </div>
        )
      })}
      {saved && (
        <p className="text-xs text-green-600 text-center">已保存</p>
      )}
    </div>
  )
}
