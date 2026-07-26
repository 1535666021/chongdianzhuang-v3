import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { Type, ToggleLeft, ToggleRight, Save } from 'lucide-react'

export default function WatermarkTemplate() {
  const { watermark: wm, setWatermark } = useSettingsStore()
  const [text, setText] = useState(wm.text)
  const [enabled, setEnabled] = useState(wm.enabled)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setWatermark({ text, enabled })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Type size={12} />
        配置图片水印文字
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
        <span className="text-sm font-medium text-gray-700">启用水印</span>
        <button onClick={() => setEnabled(!enabled)} className="text-blue-500">
          {enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-400" />}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">水印文字</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="如：谢责强 15395147568"
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {enabled && text && (
        <div className="p-4 rounded-lg bg-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-2">预览效果</p>
          <p className="text-sm text-gray-500 opacity-30 select-none">{text}</p>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-2.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1.5"
      >
        <Save size={14} />
        保存水印设置
      </button>
      {saved && (
        <p className="text-xs text-green-600 text-center">水印设置已保存</p>
      )}
    </div>
  )
}
