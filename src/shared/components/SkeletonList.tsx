/** P0-145：列表骨架屏——灰块脉冲，仅加载>0.3s才渲染（防闪烁由调用方门控） */
export default function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="加载中">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--short" />
        </div>
      ))}
    </div>
  )
}
