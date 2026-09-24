import { useNavigate } from 'react-router-dom'
import { useBatchParser, type PreviewEntry } from '../hooks/useBatchParser'
import { toast } from '@/shared/hooks/useToast'
import { ArrowLeft, FileText, Play, Trash2 } from 'lucide-react'

const MATCHED_BY_LABEL = { orderNo: '单号', phone: '电话', name: '姓名' } as const

/** 状态徽标：新增 / 重复跳过（注明与哪条既有单重复）/ 批内重复 */
function StatusBadge({ entry }: { entry: PreviewEntry }) {
  if (entry.status === 'new') {
    return <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">新增✅ 已入库</span>
  }
  if (entry.status === 'existing-dup' && entry.existingMatch) {
    const { matchedBy, existing } = entry.existingMatch
    const text = matchedBy === 'orderNo'
      ? `重复跳过：单号 ${existing.orderNo} 与既有单相同`
      : `重复跳过：与既有单「${existing.customerName || '未识别姓名'} ${existing.phone || ''}」${MATCHED_BY_LABEL[matchedBy]}相同`
    return <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">{text}</span>
  }
  if (entry.status === 'batch-dup' && entry.batchMatch) {
    const { firstIndex, matchedBy } = entry.batchMatch
    return (
      <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
        重复跳过：与本批第 {firstIndex + 1} 条{MATCHED_BY_LABEL[matchedBy]}相同
      </span>
    )
  }
  return null
}

export default function BatchParser() {
  const navigate = useNavigate()
  const { rawText, setRawText, previewEntries, blockCount, isParsing, parse, clear } =
    useBatchParser()

  /** P0-106 一键流程：点一次 = 解析+去重+自动入库+toast汇总 */
  const handleParse = () => {
    const outcome = parse()
    if (!outcome) return
    if (outcome.total === 0) {
      toast.warning('未识别到订单')
      return
    }
    toast.success(`导入完成：新增 ${outcome.added} 条，跳过 ${outcome.skipped} 条（重复）`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部栏 */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">批量导入</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* 输入区 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">粘贴微信群订单文本</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full h-40 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none resize-none"
            placeholder="请粘贴微信群中的订单信息，每行一条...

示例：
姓名：张三 电话：13800138000 地址：巢湖市XX小区
姓名：李四 电话：13900139000 地址：合肥市XX路"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleParse}
              disabled={!rawText.trim() || isParsing}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
            >
              <Play size={16} />
              {isParsing ? '解析中...' : '开始解析'}
            </button>
            <button
              onClick={clear}
              className="flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              <Trash2 size={16} />
              清空
            </button>
          </div>
        </div>

        {/* 导入结果（P0-106：只读回显，无勾选框/确认按钮） */}
        {previewEntries.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">
              导入结果 ({previewEntries.length}条)
              {blockCount > previewEntries.length && (
                <span className="text-xs text-amber-500 ml-2">(识别{previewEntries.length}/{blockCount}条)</span>
              )}
            </h2>
            <div className="space-y-2">
              {previewEntries.map((entry, idx) => {
                const po = entry.order
                const isDup = entry.status !== 'new'
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${isDup ? 'bg-amber-50/60 border border-amber-100' : 'bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium">{po.customerName || '未识别姓名'}</span>
                      <span className="text-gray-500">{po.phone || '未识别电话'}</span>
                    </div>
                    <div className="text-gray-600 mt-1">{po.address || '未识别地址'}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      平台: {po.platformName || '其他'} | 品牌: {po.brandName || '未识别'} | 功率: {po.powerKw || '未识别'}kW | 米数: {po.packageMeters || '未识别'}m
                    </div>
                    {po.remark && (
                      <div className="text-xs text-gray-400 mt-1">备注: {po.remark}</div>
                    )}
                    <div className="mt-1.5">
                      <StatusBadge entry={entry} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-xs text-gray-400 mt-3 leading-relaxed">
              重复单已自动跳过未入库；老客户再装需强制导入时，请先删除旧单后重新导入。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
