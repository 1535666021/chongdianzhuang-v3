import { useMaterial } from '../hooks/useMaterial'
import MaterialCard from '../components/MaterialCard'
import MaterialForm from '../components/MaterialForm'
import { Package } from 'lucide-react'

export default function MaterialList() {
  const {
    customMaterials,
    fixedMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  } = useMaterial()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-blue-600" />
          <h1 className="text-lg font-semibold">材料库</h1>
        </div>
      </header>

      <main className="p-3 space-y-5">
        {/* 固定辅材 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2 px-1">
            固定辅材
            <span className="text-xs text-gray-400 font-normal ml-1">
              ({fixedMaterials.length} 项)
            </span>
          </h2>
          <div>
            {fixedMaterials.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                onUpdate={updateMaterial}
                onDelete={deleteMaterial}
              />
            ))}
          </div>
        </section>

        {/* 自定义辅材 */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-sm font-medium text-gray-500">
              自定义辅材
              <span className="text-xs text-gray-400 font-normal ml-1">
                ({customMaterials.length} 项)
              </span>
            </h2>
          </div>

          <MaterialForm onAdd={addMaterial} />

          <div>
            {customMaterials.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                onUpdate={updateMaterial}
                onDelete={deleteMaterial}
              />
            ))}
            {customMaterials.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-8 bg-white rounded-lg border border-dashed border-gray-200">
                暂无自定义材料，点击上方"新增材料"添加
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
