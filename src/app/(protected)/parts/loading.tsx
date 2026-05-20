import { SkeletonRow } from '@/components/shared/skeleton-card'

export default function PartsLoading() {
  return (
    <div className="space-y-1 py-2">
      {Array.from({ length: 8 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
