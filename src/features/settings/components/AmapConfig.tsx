import { useState } from 'react'
import { MapPin, TestTube, Check, AlertCircle } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { AMAP_DEFAULT_ZOOM, AMAP_DEFAULT_CENTER } from '@/constants/map'

export default function AmapConfig() {
  const amapKey = useSettingsStore((s) => s.amapKey)
  const amapZoom = useSettingsStore((s) => s.amapZoom)
  const setAmapKey = useSettingsStore((s) => s.setAmapKey)
  const setAmapZoom = useSettingsStore((s) => s.setAmapZoom)

  const [inputKey, setInputKey] = useState(amapKey || '')
  const [inputZoom, setInputZoom] = useState(String(amapZoom ?? AMAP_DEFAULT_ZOOM))
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'fail'>('idle')
  const [testMsg, setTestMsg] = useState('')

  const handleSave = () => {
    setAmapKey(inputKey.trim())
    const zoom = parseInt(inputZoom, 10)
    if (!isNaN(zoom) && zoom >= 3 && zoom <= 20) {
      setAmapZoom(zoom)
    }
  }

  const handleTest = async () => {
    const key = inputKey.trim()
    if (!key || key === 'YOUR_AMAP_KEY') {
      setTestResult('fail')
      setTestMsg('请先输入有效的高德Key')
      return
    }

    setTestResult('idle')
    setTestMsg('测试中...')

    try {
      const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent('北京市')}&key=${key}&output=JSON`
      const res = await fetch(url)
      const data = await res.json()
      if (data.status === '1') {
        setTestResult('success')
        setTestMsg('连接成功，Key有效')
      } else {
        setTestResult('fail')
        setTestMsg(`连接失败：${data.info || 'Key无效或超限'}`)
      }
    } catch {
      setTestResult('fail')
      setTestMsg('网络请求失败，请检查网络')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          高德Key仅保存在本地，不会上传到服务器或GitHub仓库。
          请前往
          <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">高德开放平台</a>
          申请Web端JS API Key。
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <MapPin size={14} />
          高德地图 Key
        </label>
        <input
          type="text"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="YOUR_AMAP_KEY"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400">当前：{amapKey || '未配置'}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">默认缩放级别</label>
        <input
          type="number"
          min={3}
          max={20}
          value={inputZoom}
          onChange={(e) => setInputZoom(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400">
          范围 3~20，默认 {AMAP_DEFAULT_ZOOM}。当前：{amapZoom ?? AMAP_DEFAULT_ZOOM}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">默认中心点</label>
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
          <div>纬度: {AMAP_DEFAULT_CENTER.lat}</div>
          <div>经度: {AMAP_DEFAULT_CENTER.lng}</div>
          <div className="text-xs text-gray-400">（巢湖地区，不可修改）</div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm active:bg-blue-700"
        >
          <Check size={14} />
          保存配置
        </button>
        <button
          onClick={handleTest}
          className="flex-1 flex items-center justify-center gap-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm active:bg-gray-50"
        >
          <TestTube size={14} />
          测试连接
        </button>
      </div>

      {testResult !== 'idle' && (
        <div className={`text-xs text-center py-2 rounded-lg ${
          testResult === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {testMsg}
        </div>
      )}
    </div>
  )
}
