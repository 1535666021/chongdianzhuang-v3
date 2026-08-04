import { Copy, X } from 'lucide-react'

interface SurveyReportModalProps {
  reportText: string
  onClose: () => void
  onCopy: () => void
}

export function SurveyReportModal({ reportText, onClose, onCopy }: SurveyReportModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">勘测报告</h3>
          <button onClick={onClose} className="modal-close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <pre className="modal-report-content">{reportText}</pre>
        </div>
        <div className="modal-footer">
          <button onClick={onCopy} className="modal-btn modal-btn--primary">
            <Copy size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            一键复制
          </button>
        </div>
      </div>
    </div>
  )
}
