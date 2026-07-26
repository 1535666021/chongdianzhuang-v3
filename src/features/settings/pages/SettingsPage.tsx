import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Upload,
  DollarSign,
  Package,
  User,
  Sliders,
  RotateCcw,
  Info,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { APP_NAME, APP_VERSION } from '@/constants/common'
import { useSettingsStore } from '@/stores/settingsStore'
import CostSheetManager from '../components/CostSheetManager'
import ExtraItemManager from '../components/ExtraItemManager'
import EngineerInfo from '../components/EngineerInfo'

type SettingSection = 'cost' | 'addon' | 'engineer' | 'platform' | 'backup' | 'reset' | 'about' | null

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>(null)
  const navigate = useNavigate()

  const menuItems = [
    { id: 'backup' as const, label: '数据导入', icon: Upload, desc: '从老系统导入订单数据' },
    { id: 'cost' as const, label: '成本表管理', icon: DollarSign, desc: '编辑20项辅材成本价' },
    { id: 'addon' as const, label: '增项表管理', icon: Package, desc: '编辑572项增项材料价格' },
    { id: 'engineer' as const, label: '工程师信息', icon: User, desc: '姓名、电话、收货地址' },
    { id: 'platform' as const, label: '平台配置', icon: Sliders, desc: '套餐、扣点等配置' },
    { id: 'reset' as const, label: '恢复出厂设置', icon: RotateCcw, desc: '清空所有本地数据' },
    { id: 'about' as const, label: '关于', icon: Info, desc: `${APP_NAME} v${APP_VERSION}` },
  ] as const

  const handleItemClick = (id: SettingSection) => {
    if (id === 'backup') {
      navigate('/settings/backup')
      return
    }
    if (id === activeSection) {
      setActiveSection(null)
    } else {
      setActiveSection(id)
    }
  }

  const handleReset = () => {
    if (window.confirm('确定要恢复出厂设置吗？这将清空所有本地数据，包括订单、材料、设置等！')) {
      if (window.confirm('再次确认：此操作不可撤销，确定继续？')) {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('cdz_v3_')) keys.push(k)
        }
        keys.forEach((k) => localStorage.removeItem(k))
        window.location.reload()
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">设置</h1>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id
          const Icon = item.icon
          return (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => handleItemClick(item.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
                {isActive ? (
                  <ChevronDown size={18} className="text-gray-400" />
                ) : (
                  <ChevronRight size={18} className="text-gray-400" />
                )}
              </button>

              {isActive && item.id !== 'reset' && item.id !== 'about' && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {item.id === 'cost' && <CostSheetManager />}
                  {item.id === 'addon' && <ExtraItemManager />}
                  {item.id === 'engineer' && <EngineerInfo />}
                  {item.id === 'platform' && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      平台配置功能开发中...
                    </div>
                  )}
                </div>
              )}

              {isActive && item.id === 'reset' && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-3">
                    恢复出厂设置将清空所有本地数据，包括订单、材料库存、设置等。
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:bg-red-800"
                  >
                    确认恢复出厂设置
                  </button>
                </div>
              )}

              {isActive && item.id === 'about' && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 text-center">
                  <div className="text-lg font-semibold text-gray-900">{APP_NAME}</div>
                  <div className="text-sm text-gray-500 mt-1">版本 {APP_VERSION}</div>
                  <div className="text-xs text-gray-400 mt-2">巢湖充电桩安装助手</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
