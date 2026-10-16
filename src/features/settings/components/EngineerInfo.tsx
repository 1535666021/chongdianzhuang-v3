import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { User, Phone, MapPin, Save } from 'lucide-react'

export default function EngineerInfo() {
  const { engineerName, engineerPhone, engineerAddress, setEngineer } = useSettingsStore()
  const [name, setName] = useState(engineerName)
  const [phone, setPhone] = useState(engineerPhone)
  const [address, setAddress] = useState(engineerAddress)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setEngineer(name, phone, address)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <User size={14} />
          姓名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入姓名"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <Phone size={14} />
          电话
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="请输入电话"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
          <MapPin size={14} />
          收货地址
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="请输入收货地址"
        />
      </div>
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
      >
        <Save size={16} />
        {saved ? '已保存' : '保存'}
      </button>
    </div>
  )
}
