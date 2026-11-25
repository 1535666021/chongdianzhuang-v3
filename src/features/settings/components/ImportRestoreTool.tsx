import { useState } from 'react'
import { DownloadCloud, ShieldAlert, Check, AlertTriangle } from 'lucide-react'
import { useOrderStore } from '@/stores/orderStore'
import {
  downloadAndDecrypt, mergePackages, computeImportPlan, applyImportPlan,
  backupBeforeImport, loadRepoConfigOrThrow,
  ImportPlan, ConflictResolution, RemotePackages,
} from '../lib/importRestore'

// P0-253-6 导入恢复：私仓拉密文→解密→sha/schema校验→预导入备份→确认导入；冲突人工处理不静默覆盖
export default function ImportRestoreTool() {
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [pkg, setPkg] = useState<RemotePackages | null>(null)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({})
  const [backupKey, setBackupKey] = useState('')

  const handleFetch = async () => {
    setError(''); setMsg('')
    if (!keyFile) { setError('请选择私钥文件（只在本页内存使用）'); return }
    setBusy(true)
    try {
      const cfg = loadRepoConfigOrThrow()
      const secretText = await keyFile.text()
      const remote = await downloadAndDecrypt(cfg, secretText)
      const merged = mergePackages(remote.base, remote.today)
      const current = useOrderStore.getState().orders
      const p = computeImportPlan(current, merged)
      setPkg(remote); setPlan(p); setResolutions({})
      setMsg(`拉取解密校验通过：合并后 ${merged.length} 条变更；新增 ${p.adds.length} / 删除 ${p.deletes.length} / 无变化 ${p.noops} / 冲突 ${p.conflicts.length}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '拉取失败')
    } finally { setBusy(false) }
  }

  const handleImport = () => {
    setError(''); setMsg('')
    if (!pkg || !plan) { setError('请先完成拉取解密'); return }
    const current = useOrderStore.getState().orders
    const merged = mergePackages(pkg.base, pkg.today)
    const bk = backupBeforeImport(current)
    const next = applyImportPlan(current, merged, plan, resolutions)
    useOrderStore.getState().setOrders(next as never)
    setBackupKey(bk)
    setMsg(`已导入：备份于 ${bk}`)
    setPkg(null); setPlan(null)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <ShieldAlert size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">从私仓拉 base/today 密文本地解密恢复。导入前自动全量备份当前订单；同主键冲突逐条人工选择，绝不静默覆盖。</p>
      </div>

      <div className="space-y-2">
        <input type="file" accept=".txt,.key,text/plain" onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-gray-600 file:mr-2 file:px-3 file:py-1.5 file:text-xs file:border-0 file:rounded-lg file:bg-blue-50 file:text-blue-700" />
        <button onClick={handleFetch} disabled={busy}
          className="w-full py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)' }}>
          <DownloadCloud size={14} />
          {busy ? '拉取解密中…' : '从私仓拉取并解密校验'}
        </button>
      </div>

      {plan && (
        <div className="space-y-2">
          {plan.conflicts.length > 0 ? (
            <div className="border border-red-200 rounded-lg divide-y divide-red-100">
              <p className="text-xs font-medium text-red-600 px-3 py-2">同主键冲突 {plan.conflicts.length} 条（默认跳过，可逐条改判）</p>
              {plan.conflicts.map((cf) => (
                <div key={cf.key} className="px-3 py-2 text-xs space-y-1">
                  <p className="font-medium text-gray-700">{cf.key}</p>
                  <p className="text-gray-500 break-all">本地：{cf.localSummary}</p>
                  <p className="text-gray-500 break-all">远端：{cf.incomingSummary}</p>
                  <select value={resolutions[cf.key] ?? 'skip'} onChange={(e) => setResolutions({ ...resolutions, [cf.key]: e.target.value as ConflictResolution })}
                    className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5">
                    <option value="skip">跳过（不动本地）</option>
                    <option value="keep-local">保留本地</option>
                    <option value="take-remote">采用远端覆盖</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5">无冲突，可直接导入</p>
          )}
          <button onClick={handleImport}
            className="w-full py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-1.5">
            <Check size={14} />
            备份当前订单并确认导入
          </button>
        </div>
      )}

      {backupKey && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5">导入完成。导入前备份键：{backupKey}（可用此键手工回滚）</p>
      )}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      {msg && !plan && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <Check size={15} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700">{msg}</p>
        </div>
      )}
    </div>
  )
}
