import { useUIStore } from '@/stores/uiStore'
import type { CompanyKey } from '@/shared/utils/company'

const OPTIONS: { key: CompanyKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'benyang', label: '本杨' },
  { key: 'daomei', label: '到美' },
]

/** P0-220：统计/财务/对账顶部公司切换（uiStore 持久化） */
export default function CompanyFilter() {
  const currentCompany = useUIStore((s) => s.currentCompany)
  const setCurrentCompany = useUIStore((s) => s.setCurrentCompany)
  return (
    <div className="flex gap-2 mb-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setCurrentCompany(opt.key)}
          className={`px-4 py-1.5 text-xs font-medium rounded-full ${
            currentCompany === opt.key ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
