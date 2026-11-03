import { useEffect, useRef, useState } from 'react'
import { RELEASE_NOTES } from '@/constants/releaseNotes'

/** P0-234：更新通知顶部横幅——非遮罩，下方页面可正常滚动点击；已读条数机制与 P0-233 一致
 * （SEEN_KEY，仅当 RELEASE_NOTES.length > 已读条数时渲染）。记已读两条路径：①点 ✕；
 * ②挂载 4 秒自动滑出（写回当前条数并卸载）。点横幅本体（非 ✕）拉起明细层列本次新增全部条目
 * （用户主动点开，允许覆盖页面）。禁全屏阻断遮罩、禁反复弹。 */
const SEEN_KEY = 'cdz_release_notes_seen'

export default function ReleaseNotesBanner() {
  const seen = Number(localStorage.getItem(SEEN_KEY) ?? '0') || 0
  const hasNews = RELEASE_NOTES.length > seen
  const [visible, setVisible] = useState(hasNews)
  const [shown, setShown] = useState(false)
  const [detail, setDetail] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const known = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    localStorage.setItem(SEEN_KEY, String(RELEASE_NOTES.length))
    setDetail(false)
    setVisible(false)
  }

  useEffect(() => {
    if (!hasNews) return
    const raf = requestAnimationFrame(() => setShown(true)) // 挂载即滑入
    timerRef.current = setTimeout(() => known(), 4000) // 4 秒自动记已读滑出
    return () => {
      cancelAnimationFrame(raf)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [hasNews])

  if (!hasNews || !visible) return null
  const news = RELEASE_NOTES.slice(0, RELEASE_NOTES.length - seen)
  return (
    <>
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
          background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', minHeight: 48, padding: '6px 12px',
          borderLeft: '4px solid #2563eb', cursor: 'pointer',
          transform: shown ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease',
        }}
        onClick={() => {
          if (timerRef.current) clearTimeout(timerRef.current)
          setDetail(true)
        }}
      >
        <span style={{ flex: 1, fontSize: 13, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          已更新：{RELEASE_NOTES[0]}
        </span>
        <button
          type="button"
          aria-label="关闭"
          onClick={(e) => {
            e.stopPropagation()
            known()
          }}
          style={{ border: 'none', background: 'transparent', fontSize: 18, color: '#6b7280', marginLeft: 8, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
        >
          ✕
        </button>
      </div>
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
          onClick={known}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '16px 20px', maxWidth: 480, width: '100%', maxHeight: '60vh', overflow: 'auto' }}
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
              style={{ marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14 }}
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  )
}
