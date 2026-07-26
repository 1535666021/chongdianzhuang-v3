import { useState } from 'react'
import { useMaterial } from '../hooks/useMaterial'
import CostMaterialList from '../components/CostMaterialList'
import AddonMaterialList from '../components/AddonMaterialList'
import { useNavigate } from 'react-router-dom'
import { Package, Warehouse } from 'lucide-react'
import RestockAlert from '../components/RestockAlert'

type MaterialTab = 'cost' | 'addon'

export default function MaterialList() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<MaterialTab>('cost')
  const {
    costMaterials,
    addonMaterials,
    updateCostPrice,
    updateAddonCostPrice,
    updateAddonFreeQuota,
  } = useMaterial()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            <h1 className="text-lg font-semibold">材料库</h1>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm border border-blue-200 active:bg-blue-100"
          >
            <Warehouse size={14} />
            库存管理
          </button>
        </div>
      </header>

      <div className="p-3">
        <RestockAlert />
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('cost')}
          className={`flex-1 py-3 text-sm font-medium text-center ${
            activeTab === 'cost'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          成本表（{costMaterials.length}）
        </button>
        <button
          onClick={() => setActiveTab('addon')}
          className={`flex-1 py-3 text-sm font-medium text-center ${
            activeTab === 'addon'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500'
          }`}
        >
          增项表（{addonMaterials.length}）
        </button>
      </div>

      <main className="p-3">
        {activeTab === 'cost' ? (
          <CostMaterialList
            materials={costMaterials}
            onUpdateCostPrice={updateCostPrice}
          />
        ) : (
          <AddonMaterialList
            materials={addonMaterials}
            onUpdateCostPrice={updateAddonCostPrice}
            onUpdateFreeQuota={updateAddonFreeQuota}
          />
        )}
      </main>
    </div>
  )
}
