import { useState } from 'react'
import { useMaterial } from '../hooks/useMaterial'
import CostMaterialList from '../components/CostMaterialList'
import AddonMaterialList from '../components/AddonMaterialList'
import { Package } from 'lucide-react'

type MaterialTab = 'cost' | 'addon'

export default function MaterialList() {
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
        <div className="flex items-center gap-2">
          <Package size={20} className="text-blue-600" />
          <h1 className="text-lg font-semibold">材料库</h1>
        </div>
      </header>

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
