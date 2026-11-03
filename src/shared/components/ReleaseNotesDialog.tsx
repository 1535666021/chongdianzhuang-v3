import { useState } from 'react'
import { RELEASE_NOTES } from '@/constants/releaseNotes'

/** P0-233：更新弹窗——启动时比对 localStorage 已读条数，有新增则列出（新→旧）；
 * "知道了"或点遮罩=视为已知并写入当前条数，此后启动不再弹，直到数组新增条目。禁自动反复弹、禁阻断。 */
const SEEN_KEY = 'cdz_release_notes_seen'

export default function ReleaseNotesDialog() {
  const seen = Number(localStorage.getItem(SEEN_KEY) ?? '0') || 0
  const [open, setOpen] = useState(RELEASE_NOTES.length > seen)
  if (!open) return null
  const news = RELEASE_NOTES.slice(0, RELEASE_NOTES.length - seen)
  const known = () => {
    localStorage.setItem(SEEN_KEY, String(RELEASE_NOTES.length))
    setOpen(false)
  }
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={known}
    >
      <div
        style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', maxWidth: 360, width: '88%', maxHeight: '70vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>本次更新</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: '#374151' }}>
          {news.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={known}
          style={{ marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14 }}
        >
          知道了
        </button>
      </div>
    </div>
  )
}
