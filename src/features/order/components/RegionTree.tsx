import { useMemo, useState } from 'react'
import type { Order } from '@/types'
import { buildRegionTree, nodesAtPath } from './regionTreeModel'

// P0-265-C：区域层级树——按 extractAreaChain 层级聚合计数，逐级下钻，父级收起（只显当前层级），不强制展开整树
export default function RegionTree({
  orders,
  onSelectRegion,
}: {
  orders: Order[]
  onSelectRegion?: (path: string[] | null) => void
}) {
  const [path, setPath] = useState<string[]>([])

  const tree = useMemo(() => buildRegionTree(orders), [orders])
  const nodes = useMemo(() => nodesAtPath(tree, path), [tree, path])

  const select = (name: string) => {
    const np = [...path, name]
    setPath(np)
    onSelectRegion?.(np)
  }
  const up = () => {
    const np = path.slice(0, -1)
    setPath(np)
    onSelectRegion?.(np.length ? np : null)
  }
  const reset = () => {
    setPath([])
    onSelectRegion?.(null)
  }

  return (
    <div className="mx-3 mt-2 border border-gray-200 rounded-lg bg-white text-xs">
      <div className="flex flex-wrap items-center gap-1.5 p-2">
        <span className="text-gray-400">区域</span>
        {path.length > 0 && (
          <>
            <button onClick={reset} className="px-2 py-1 rounded-full border border-gray-200 text-gray-500">全部</button>
            {path.map((seg, i) => (
              <button
                key={i}
                onClick={() => {
                  const np = path.slice(0, i + 1)
                  setPath(np)
                  onSelectRegion?.(np)
                }}
                className={`px-2 py-1 rounded-full border ${i === path.length - 1 ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-500'}`}
              >
                {seg}
              </button>
            ))}
            <button onClick={up} className="px-2 py-1 rounded-full border border-gray-200 text-gray-500">← 收起上级</button>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 p-2 pt-0">
        {nodes.length === 0 && <span className="text-gray-400 py-1">（无下级区域）</span>}
        {nodes.map((n) => (
          <button
            key={n.name}
            onClick={() => select(n.name)}
            className="px-2.5 py-1 border border-blue-200 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1"
          >
            {n.name}
            <span className="text-[10px] text-blue-500">{n.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
