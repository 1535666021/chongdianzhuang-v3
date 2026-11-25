import { useState } from 'react'
import { FileDown, Check, AlertTriangle } from 'lucide-react'
import {
  buildExportPackage,
  validateExportPackage,
  readPendingChanges,
  ExportPackage,
} from '../lib/exportSync'

// P0-253-2 手动导出同步包：读本地变更队列 → 组包 → 自校验 → 下载 JSON；不做加密/监听/上传
export default function ExportSyncTool() {
  const [lastExport, setLastExport] = useState<ExportPackage | null>(null)
  const [error, setError] = useState('')

  const handleExport = () => {
    setError('')
    const changes = readPendingChanges()
    const pkg = buildExportPackage(changes, new Date().toISOString().slice(0, 10))
    // 出厂自校验：导出的包必须能过自己的离线 schema 校验
    const check = validateExportPackage(pkg)
    if (!check.ok) {
      setError(`自校验失败：${check.errors.join('；')}`)
      return
    }
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cdz-sync-${pkg.baseDate}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setLastExport(pkg)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <FileDown size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-700">手动导出同步包</p>
          <p className="text-xs text-blue-500 mt-1">导出本机待同步变更为 JSON（新增/修改/删除三态，按业务主键去重计数）。变更监听入库后续单接入，当前队列为空时导出空包。</p>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      <button
        onClick={handleExport}
        className="w-full py-2.5 text-sm text-white rounded-lg flex items-center justify-center gap-1.5"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <FileDown size={14} />
        导出同步包 JSON
      </button>
      {lastExport && (
        <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <Check size={15} className="mt-0.5 shrink-0" />
          <p>已导出并通过自校验：共 {lastExport.counts.total} 条（新增 {lastExport.counts.upserts} / 删除 {lastExport.counts.deletes}），schema v{lastExport.schemaVersion}</p>
        </div>
      )}
    </div>
  )
}
