import { useState } from 'react'
import { CloudUpload, Save, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  loadRepoConfig, saveRepoConfig, uploadSyncPackage, scheduleRetryWithBackoff,
  getLastUpload, getRetryCount, cancelRetry, validateRepoConfig, RepoConfig,
} from '../lib/repoUpload'

// P0-253-5 私仓上传：配置 owner/repo/token → 上传今日密文包；断网自动退避重试不丢密文
export default function RepoUploadTool() {
  const [cfg, setCfg] = useState<RepoConfig | null>(() => loadRepoConfig())
  const [owner, setOwner] = useState(cfg?.owner ?? '')
  const [repo, setRepo] = useState(cfg?.repo ?? '')
  const [token, setToken] = useState(cfg?.token ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [, force] = useState(0)

  const handleSave = () => {
    setError(''); setMsg('')
    if (!owner.trim() || !repo.trim() || !token.trim()) { setError('owner/repo/token 三项都要填'); return }
    const c = { owner: owner.trim(), repo: repo.trim(), token: token.trim() }
    const cfgErrors = validateRepoConfig(c)
    if (cfgErrors.length > 0) { setError(`白名单校验未过，已拒绝保存：${cfgErrors.join('；')}`); return }
    saveRepoConfig(c)
    setCfg(c)
    setMsg('私仓配置已本机保存（token 只存本机，不外传日志）')
  }

  const handleUpload = async () => {
    setError(''); setMsg('')
    const c = cfg ?? loadRepoConfig()
    if (!c) { setError('请先保存私仓配置'); return }
    setBusy(true)
    try {
      const r = await uploadSyncPackage(c)
      if (r.ok) {
        setMsg(`已上传 ${r.uploaded?.join('、')}${r.baseCreated ? '；已顺带建立 base-current 基线（私仓仅 base+today 两份）' : ''}`)
      } else {
        setError(r.error ?? '上传失败')
        scheduleRetryWithBackoff(c) // 断网/失败自动 30s→60s→120s 退避重试，密文本机保留
      }
    } finally {
      setBusy(false)
      force((x) => x + 1)
    }
  }

  const last = getLastUpload()

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <CloudUpload size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">上传今日密文包到私仓 sync/ 目录；私仓只维护 base-current 与 today-new 两份，跨天滚动覆盖即删旧。</p>
      </div>

      <div className="space-y-2">
        <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="owner（GitHub 用户名）" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="repo（私仓名）" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="token（只存本机，可复用部署令牌）" type="password" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
            <Save size={12} />
            保存配置
          </button>
          <button onClick={handleUpload} disabled={busy} className="flex-1 py-2 text-xs text-white rounded-lg flex items-center justify-center gap-1 disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
            <CloudUpload size={12} />
            {busy ? '上传中…' : '上传今日密文包'}
          </button>
        </div>
        {getRetryCount() > 0 && (
          <button onClick={() => { cancelRetry(); force((x) => x + 1) }} className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
            <RefreshCw size={11} />
            取消自动重试（已第 {getRetryCount()} 次）
          </button>
        )}
      </div>

      {last && (
        <div className="text-xs text-gray-500 border border-gray-200 rounded-lg p-2.5 space-y-1">
          <p>上次上传：{last.at.slice(0, 19).replace('T', ' ')}</p>
          <p>文件：{last.uploaded.join('、') || '（无）'}{last.baseCreated ? '（含新建基线）' : ''}</p>
          {last.error && <p className="text-amber-600">{last.error}</p>}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
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
