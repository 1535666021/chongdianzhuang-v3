import { X } from 'lucide-react'
import { toast } from '@/shared/hooks/useToast'

interface Props {
  rawText: string
  onClose: () => void
  /** 弹窗标题，默认"原始记录" */
  title?: string
}

/**
 * P0-151-R1：原始记录统一弹窗（全App唯一实现，src/shared/components/）。
 * 尺寸自适应：内容驱动高度，上限 85vh——短原文紧凑、长原文一屏全显，
 * 仅极端超长内部滚动兜底；塌陷修复：内容区 flex:1 1 auto + min-height
 * 保障（基础 .modal-body 的 height:0/flex-basis:0 会令内容区塌缩）。
 * 等宽 13.5px/1.6、自动换行不溢出；头/底固定不遮文本。
 */
export default function RawTextModal({ rawText, onClose, title = '原始记录' }: Props) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawText)
      toast.success('原文已复制')
    } catch {
      toast.error('复制失败')
    }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content raw-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>
        <div className="modal-body raw-view-modal__body">
          {rawText
            ? <pre className="raw-view-modal__text">{rawText}</pre>
            : <p className="modal-rawtext-empty">无原始记录</p>}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn modal-btn--secondary">关闭</button>
          {rawText && (
            <button onClick={() => void copy()} className="modal-btn modal-btn--primary">复制原文</button>
          )}
        </div>
      </div>
    </div>
  )
}
