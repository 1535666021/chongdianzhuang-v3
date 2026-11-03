import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { History, Package, Settings } from 'lucide-react'
import { RELEASE_NOTES } from '@/constants/releaseNotes'
import { RoutePath } from '@/routes/route'

/** P0-173「我的」页：材料领用/设置入口（抽屉退役后迁入）；P0-233：追加更新记录（本页弹层，不走路由） */
export default function MinePage() {
  const navigate = useNavigate()
  const [showNotes, setShowNotes] = useState(false)
  const entries = [
    { label: '材料领用', desc: '材料库存与领用登记', Icon: Package, path: RoutePath.MATERIALS },
    { label: '设置', desc: '话术模板 / 数据修正 / 备份', Icon: Settings, path: RoutePath.SETTINGS },
    { label: '更新记录', desc: '每次更新内容', Icon: History, path: null },
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
            onClick={() => (path ? navigate(path) : setShowNotes(true))}
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

      {/* P0-233：更新记录弹层——列出全部 RELEASE_NOTES（新在上），点遮罩或关闭键退出 */}
      {showNotes && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowNotes(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', maxWidth: 360, width: '88%', maxHeight: '70vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>更新记录</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: '#374151' }}>
              {RELEASE_NOTES.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              style={{ marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14 }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
