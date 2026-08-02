import { useEffect, useState } from 'react'
import { Copy, RotateCcw, X } from 'lucide-react'
import type { Order } from '@/types'
import { useSettingsStore } from '@/stores/settingsStore'
import { generateCompletionScript } from '../hooks/useScript'
import '../../../shared/components/Modal.css'

interface Props {
  order: Order
  onClose: () => void
}

export default function ScriptEditorModal({ order, onClose }: Props) {
  const settings = useSettingsStore()
  const initialScript = generateCompletionScript(order, {
    engineerName: settings.engineerName || '谢责强',
    engineerPhone: settings.engineerPhone || '15395147568',
  })
  const [content, setContent] = useState(initialScript)

  useEffect(() => setContent(initialScript), [initialScript])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // 浏览器权限限制时保持编辑内容，用户可手动复制。
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">完工话术</h2>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <textarea className="modal-textarea" style={{ minHeight: 200 }} value={content} onChange={(event) => setContent(event.target.value)} />
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--secondary" onClick={copy}><Copy size={16} />复制</button>
          <button className="modal-btn modal-btn--secondary" onClick={() => setContent(initialScript)}><RotateCcw size={16} />重置</button>
          <button className="modal-btn modal-btn--primary" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
