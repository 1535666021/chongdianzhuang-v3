import { useState } from 'react'
import { Lock, Unlock, FileDown, Check, AlertTriangle } from 'lucide-react'
import { loadStoredPublicKey } from '../lib/ageKey'
import {
  parsePublicKey,
  parseSecretKey,
  encryptWithPublicKey,
  decryptWithSecretKey,
  sha256Hex,
  buildSha256FileContent,
  parseSha256File,
} from '../lib/localAge'

// P0-253-3 本地加解密：加密只需公钥；解密需私钥文件临时读入内存；全程断网可用；不留明文临时文件
function baseName(name: string): string {
  return name.replace(/\.(json|age|sha256|txt)$/i, '')
}

function downloadBlob(bytes: Uint8Array<ArrayBuffer> | string, filename: string, type: string) {
  const blob = new Blob([bytes], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function LocalAgeTool() {
  const [pubkey] = useState<string | null>(() => loadStoredPublicKey())
  const [encFile, setEncFile] = useState<File | null>(null)
  const [decFile, setDecFile] = useState<File | null>(null)
  const [decKeyFile, setDecKeyFile] = useState<File | null>(null)
  const [decSumFile, setDecSumFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [okMsg, setOkMsg] = useState('')

  const handleEncrypt = async () => {
    setError(''); setOkMsg('')
    if (!encFile) { setError('请先选择要加密的 JSON 文件'); return }
    if (!pubkey) { setError('本机还没有备份公钥，请先在「备份密钥」里生成密钥对'); return }
    setBusy(true)
    try {
      const text = await encFile.text()
      const recipient = parsePublicKey(pubkey)
      const encrypted = encryptWithPublicKey(new TextEncoder().encode(text), recipient)
      const base = baseName(encFile.name)
      downloadBlob(encrypted as Uint8Array<ArrayBuffer>, `${base}.age`, 'application/octet-stream')
      downloadBlob(buildSha256FileContent(sha256Hex(new TextEncoder().encode(text)), encFile.name), `${base}.sha256`, 'text/plain;charset=utf-8')
      setOkMsg(`已加密：${base}.age（私钥不在手也能加密；解密需对应私钥）`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加密失败')
    } finally {
      setBusy(false)
    }
  }

  const handleDecrypt = async () => {
    setError(''); setOkMsg('')
    if (!decFile || !decKeyFile) { setError('请选择 .age 文件和私钥文件'); return }
    setBusy(true)
    try {
      const secretText = (await decKeyFile.text()).trim()
      const secret = parseSecretKey(secretText)
      const encrypted = new Uint8Array(await decFile.arrayBuffer())
      const plain = decryptWithSecretKey(encrypted, secret)
      if (decSumFile) {
        const sum = parseSha256File(await decSumFile.text())
        const actual = sha256Hex(plain)
        if (actual !== sum.hex) throw new Error(`sha256 校验失败：期望 ${sum.hex.slice(0, 16)}… 实得 ${actual.slice(0, 16)}…`)
      }
      const base = baseName(decFile.name)
      downloadBlob(plain as Uint8Array<ArrayBuffer>, `${base}.json`, 'application/json;charset=utf-8')
      setOkMsg(`已解密还原：${base}.json${decSumFile ? '（sha256 校验通过）' : ''}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解密失败')
    } finally {
      setBusy(false)
    }
  }

  const inputCls = 'block w-full text-xs text-gray-600 file:mr-2 file:px-3 file:py-1.5 file:text-xs file:border-0 file:rounded-lg file:bg-blue-50 file:text-blue-700'

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Lock size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">本地 age 加解密，断网可用。加密只需公钥；解密需私钥文件（只在本页内存使用，关闭即焚，不落任何存储）。</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Lock size={14} />加密（选 JSON → 出 .age + .sha256）</p>
        <input type="file" accept=".json,application/json" onChange={(e) => setEncFile(e.target.files?.[0] ?? null)} className={inputCls} />
        <button onClick={handleEncrypt} disabled={busy} className="w-full py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50" style={{ backgroundColor: 'var(--color-primary)' }}>
          <Lock size={14} />
          {busy ? '处理中…' : '加密并下载'}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Unlock size={14} />解密（选 .age + 私钥文件，可选 .sha256 校验）</p>
        <input type="file" accept=".age" onChange={(e) => setDecFile(e.target.files?.[0] ?? null)} className={inputCls} />
        <input type="file" accept=".txt,.key,text/plain" onChange={(e) => setDecKeyFile(e.target.files?.[0] ?? null)} className={inputCls} />
        <input type="file" accept=".sha256" onChange={(e) => setDecSumFile(e.target.files?.[0] ?? null)} className={inputCls} />
        <button onClick={handleDecrypt} disabled={busy} className="w-full py-2.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Unlock size={14} />
          {busy ? '处理中…' : '解密并下载'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      {okMsg && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700">{okMsg}</p>
        </div>
      )}
    </div>
  )
}
