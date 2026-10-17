import { useNavigate } from 'react-router-dom'
import { Package, Settings } from 'lucide-react'
import { RoutePath } from '@/routes/route'

/** P0-173「我的」页：材料领用/设置两大入口（抽屉退役后迁入） */
export default function MinePage() {
  const navigate = useNavigate()
  const entries = [
    { label: '材料领用', desc: '材料库存与领用登记', Icon: Package, path: RoutePath.MATERIALS },
    { label: '设置', desc: '话术模板 / 数据修正 / 备份', Icon: Settings, path: RoutePath.SETTINGS },
  ]
  return (
    <div className="min-h-full bg-gray-50">
      <div className="px-4 pt-8 pb-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xl font-bold">
          桩
        </div>
        <p className="mt-2 text-sm text-gray-500">充电桩订单助手</p>
      </div>
      <div className="px-4 space-y-3">
        {entries.map(({ label, desc, Icon, path }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 bg-white rounded-xl px-4 py-4 shadow-sm active:bg-gray-50"
          >
            <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Icon size={20} />
            </span>
            <span className="flex-1 text-left">
              <span className="block text-sm font-medium text-gray-900">{label}</span>
              <span className="block text-xs text-gray-400 mt-0.5">{desc}</span>
            </span>
            <span className="text-gray-300">›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
