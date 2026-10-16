import { ChevronUp, FileText } from 'lucide-react'
import type { Order } from '@/types'

interface Props {
  order: Order
  showModal: boolean
  editRawText: string
  onEditRawTextChange: (v: string) => void
  onCloseModal: () => void
  onSaveRaw: () => void
}

/** 订单原文编辑弹窗（P0-142-R2 从 OrderCard 抽取；只读查看已统一至 OrderRawViewModal，P0-151） */
export default function OrderRawModals({
  order, showModal, editRawText,
  onEditRawTextChange, onCloseModal, onSaveRaw,
}: Props) {
  return (
    <>
      {showModal && (
        <div
          className="modal-overlay"
          onClick={onCloseModal}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">订单原文</h2>
              <button onClick={onCloseModal} className="modal-close">
                <ChevronUp size={20} className="rotate-180" />
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={editRawText}
                onChange={(e) => onEditRawTextChange(e.target.value)}
                className="modal-textarea"
                placeholder="暂无订单原文"
              />
            </div>
            <div className="modal-footer">
              <button onClick={onCloseModal} className="modal-btn modal-btn--secondary">
                取消
              </button>
              <button onClick={onSaveRaw} className="modal-btn modal-btn--primary">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
