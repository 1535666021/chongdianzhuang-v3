import { useState } from 'react'
import { Inbox, Package, Download, RefreshCw, AlertTriangle, Check } from 'lucide-react'
import { getQueueStatus, flushQueue, TODAY_AGE_KEY, TODAY_SHA_KEY, QueueStatus } from '../lib/changeQueue'

// P0-253-4 变更队列面板：状态展示 + 立即打包 + 下载今日密文包；监听在 App 启动链自动开启
function downloadText(text: string, filename: string, type: string) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ChangeQueueTool() {
  const [status, setStatus] = useState<QueueStatus>(() => getQueueStatus())
  const [msg, setMsg] = useState('')

  const refresh = () => setStatus(getQueueStatus())

  const handleFlush = () => {
    const r = flushQueue()
    if (r.ok) setMsg(r.packaged ? `已打包 ${r.packaged} 条变更入今日密文包，暂存已清空` : '暂存为空，无需打包')
    else setMsg(`打包失败：${r.error ?? '未知错误'}`)
    refresh()
  }

  const age = localStorage.getItem(TODAY_AGE_KEY)
  const sha = localStorage.getItem(TODAY_SHA_KEY)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Inbox size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">订单增删改自动入暂存，30 秒防抖后整体打包为今日密文包；队列只留密文，暂存在打包成功即清空。</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">今日</p><p className="font-medium text-gray-700 mt-0.5">{status.day}</p></div>
        <div className="border border-gray-200 rounded-lg p-2.5"><p className="text-gray-500">暂存待打包</p><p className="font-medium text-gray-700 mt-0.5">{status.pending} 条</p></div>
      </div>

      <button onClick={handleFlush} className="w-full py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-1.5" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Package size={14} />
        立即打包今日密文包
      </button>

      <div className="flex gap-2">
        <button
          disabled={!age}
          onClick={() => age && downloadText(age, 'today-new.age', 'application/octet-stream')}
          className="flex-1 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Download size={13} />
          today-new.age
        </button>
        <button
          disabled={!sha}
          onClick={() => sha && downloadText(sha, 'today-new.sha256', 'text/plain;charset=utf-8')}
          className="flex-1 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Download size={13} />
          today-new.sha256
        </button>
      </div>

      <button onClick={refresh} className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
        <RefreshCw size={12} />
        刷新状态
      </button>

      {status.lastError && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">{status.lastError}</p>
        </div>
      )}
      {msg && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <Check size={15} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700">{msg}</p>
        </div>
      )}
    </div>
  )
}
