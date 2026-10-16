import { useState } from 'react'
import { ArrowLeft, FileText, Wallet, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ReconciliationTable } from '../components/ReconciliationTable'
import { ReceivablesManager } from '../components/ReceivablesManager'
import { CostDetail } from '../components/CostDetail'

type TabKey = 'reconciliation' | 'receivables' | 'cost'

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'reconciliation', label: '对账表', icon: FileText },
  { key: 'receivables', label: '回款管理', icon: Wallet },
  { key: 'cost', label: '成本明细', icon: Package },
]

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('reconciliation')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stats')} className="p-1 -ml-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800">财务对账</h1>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={14} />{tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'reconciliation' && <ReconciliationTable />}
        {activeTab === 'receivables' && <ReceivablesManager />}
        {activeTab === 'cost' && <CostDetail />}
      </div>
    </div>
  )
}
