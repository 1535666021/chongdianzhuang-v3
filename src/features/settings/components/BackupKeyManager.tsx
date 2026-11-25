import { useState } from 'react'
import { KeyRound, Copy, Check, Download, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  AgeKeyPair,
  generateAgeKeyPair,
  loadStoredPublicKey,
  persistPublicKey,
  buildSecretKeyFileContent,
} from '../lib/ageKey'

// P0-253-1 备份密钥：公钥持久化本机；私钥仅触发浏览器下载一次，内存即焚，绝不写 localStorage
export default function BackupKeyManager() {
  const [publicKey, setPublicKey] = useState<string | null>(() => loadStoredPublicKey())
  const [pair, setPair] = useState<AgeKeyPair | null>(null) // 仅内存驻留，下载后清除
  const [downloaded, setDownloaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmRegen, setConfirmRegen] = useState(false)

  const handleGenerate = () => {
    const p = generateAgeKeyPair()
    persistPublicKey(p.publicKey) // 只存公钥
    setPublicKey(p.publicKey)
    setPair(p)
    setDownloaded(false)
    setConfirmRegen(false)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!publicKey) return
    try {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* 剪贴板不可用时静默，用户可手选复制 */
    }
  }

  const handleDownloadSecret = () => {
    if (!pair) return
    const blob = new Blob([buildSecretKeyFileContent(pair)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `age-backup-secret-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDownloaded(true)
    // 私钥即焚：交给浏览器下载后从内存清除，软件内不再持有
    window.setTimeout(() => setPair(null), 500)
  }

  // 未生成：引导生成
  if (!publicKey) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <KeyRound size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-700">还没有备份密钥</p>
            <p className="text-xs text-blue-500 mt-1">生成 age 密钥对：公钥保存在本机用于加密备份；私钥只给你下载一次，软件内不保存。</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          className="w-full py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-1.5"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <KeyRound size={14} />
          生成密钥对
        </button>
      </div>
    )
  }

  // 刚生成/持有私钥待下载
  if (pair && !downloaded) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">私钥仅此一次</p>
            <p className="text-xs text-amber-600 mt-1">请立即下载并离线妥善保管。关闭本页后私钥将消失，丢失将无法解开备份。</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1.5">公钥（已保存本机，可复制留给对账）</p>
          <div className="flex items-center gap-2">
            <input readOnly value={publicKey} className="flex-1 min-w-0 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-700" onFocus={(e) => e.target.select()} />
            <button onClick={handleCopy} className="shrink-0 px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <button
          onClick={handleDownloadSecret}
          className="w-full py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1.5"
        >
          <Download size={14} />
          下载私钥（仅此一次）
        </button>
      </div>
    )
  }

  // 常态：已生成（私钥已交付）
  return (
    <div className="p-4 space-y-4">
      {downloaded && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-700">私钥已交给浏览器下载，本软件内不保存私钥。请确认已妥善保管下载文件。</p>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">公钥</p>
        <div className="flex items-center gap-2">
          <input readOnly value={publicKey} className="flex-1 min-w-0 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50 text-gray-700" onFocus={(e) => e.target.select()} />
          <button onClick={handleCopy} className="shrink-0 px-3 py-2 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-1">
            {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      {confirmRegen ? (
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">重新生成后旧公钥作废，用它加密的旧备份将无法解开。确定继续？</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmRegen(false)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
            <button onClick={handleGenerate} className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">确认重新生成</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirmRegen(true)} className="w-full py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5">
          <RefreshCw size={14} />
          重新生成密钥对
        </button>
      )}
    </div>
  )
}
