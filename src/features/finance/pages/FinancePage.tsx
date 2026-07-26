import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, DollarSign, Package } from 'lucide-react'
import { useFinance } from '../hooks/useFinance'
import ReconciliationTable from '../components/ReconciliationTable'
import ReceivablesManager from '../components/ReceivablesManager'
import CostDetail from '../components/CostDetail'

type FinanceTab = 'reconciliation' | 'receivables' | 'cost'
const TABS: { key: FinanceTab; label: string; icon: typeof FileText }[] = [
  { key: 'reconciliation', label: '对账表', icon: FileText },
  { key: 'receivables', label: '回款管理', icon: DollarSign },
  { key: 'cost', label: '成本明细', icon: Package },
]

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('reconciliation')
  const navigate = useNavigate()
  const { monthlyReconciliation, totalReconciliation } = useFinance()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stats')} className="p-1 -ml-1 text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></button>
          <h1 className="text-lg font-bold text-gray-800">财务对账</h1>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="bg-white rounded-xl p-1 shadow-sm flex">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${isActive ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Icon size={14} />{tab.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="px-4">
        {activeTab === 'reconciliation' && <ReconciliationTable data={monthlyReconciliation} total={totalReconciliation} />}
        {activeTab === 'receivables' && <ReceivablesManager />}
        {activeTab === 'cost' && <CostDetail />}
      </div>
    </div>
  )
}
