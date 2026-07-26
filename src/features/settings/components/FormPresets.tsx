import { useState } from 'react'
import { useSettingsStore, type FormPreset } from '@/stores/settingsStore'
import { ClipboardList, Save } from 'lucide-react'

const PRESET_FIELDS = [
  { key: 'parkingPosition', label: '车位位置', placeholder: '如：地下车库' },
  { key: 'distributionRoom', label: '配电室', placeholder: '如：负一层配电室' },
  { key: 'wiringMethod', label: '布线方式', placeholder: '如：桥架+穿管' },
  { key: 'cableType', label: '电缆型号', placeholder: '如：YJV3*6' },
  { key: 'meterLength', label: '默认米数', placeholder: '如：30' },
]

export default function FormPresets() {
  const { formPresets, setFormPresets } = useSettingsStore()
  const [values, setValues] = useState<FormPreset>({ ...formPresets })
  const [saved, setSaved] = useState(false)

  const handleChange = (key: keyof FormPreset, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    setFormPresets(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <ClipboardList size={12} />
        设置表单默认值，新建订单时自动填充
      </div>
      {PRESET_FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
          </label>
          <input
            type="text"
            value={values[field.key as keyof FormPreset]}
            onChange={(e) => handleChange(field.key as keyof FormPreset, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        className="w-full py-2.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1.5"
      >
        <Save size={14} />
        保存预设
      </button>
      {saved && (
        <p className="text-xs text-green-600 text-center">预设已保存</p>
      )}
    </div>
  )
}
