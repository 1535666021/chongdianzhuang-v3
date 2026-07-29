import { useMemo, useState } from 'react'
import { DEFAULT_SCRIPT_TEMPLATES } from '@/constants/scripts'
import { buildScriptVars, renderScript } from '../hooks/useScript'
import { useSettingsStore } from '@/stores/settingsStore'
import { X, Copy, FileText, Check } from 'lucide-react'
import type { Order } from '@/types'

interface Props {
  order: Order
  onClose: () => void
}

export default function ScriptPicker({ order, onClose }: Props) {
  const settings = useSettingsStore()
  const brandName = order.brandName || '通用'
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const matching = DEFAULT_SCRIPT_TEMPLATES.filter(
      (t) => t.brand === '通用' || t.brand === brandName
    )
    const brandSpecific = matching.filter((t) => t.brand === brandName)
    const generic = matching.filter((t) => t.brand === '通用')
    return [...brandSpecific, ...generic]
  }, [brandName])

  const handleCopy = (template: (typeof DEFAULT_SCRIPT_TEMPLATES)[0]) => {
    const vars = buildScriptVars(order, template.scene, {
      engineerName: settings.engineerName || '谢责强',
      engineerPhone: settings.engineerPhone || '15395147568',
    })
    const text = renderScript(template.content, vars)
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const preview = (content: string) => {
    return content.replace(/\n/g, ' ').replace(/\s+/g, ' ').slice(0, 40) + (content.length > 40 ? '...' : '')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl w-full max-w-lg max-h-[70vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">发送话术</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm">该品牌尚未配置话术模板</p>
            </div>
          ) : (
            filtered.map((t) => {
              const isCopied = copiedId === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleCopy(t)}
                  disabled={isCopied}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    isCopied
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{t.brand} · {t.scene}</span>
                    {isCopied ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Check size={12} />已复制
                      </span>
                    ) : (
                      <Copy size={12} className="text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{preview(t.content)}</p>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
