import { SkeletonCard } from '@/components/shared/skeleton-card'

export default function DashboardLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
