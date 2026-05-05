export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-surface-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-surface-100" />
        <div className="h-4 w-32 rounded bg-surface-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-surface-100" />
        <div className="h-3 w-3/4 rounded bg-surface-100" />
        <div className="h-3 w-1/2 rounded bg-surface-100" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 px-5 py-3">
      <div className="h-3 w-24 rounded bg-surface-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-40 rounded bg-surface-100" />
        <div className="h-2.5 w-28 rounded bg-surface-100" />
      </div>
      <div className="h-5 w-16 rounded-full bg-surface-100" />
      <div className="h-3 w-10 rounded bg-surface-100" />
    </div>
  )
}
