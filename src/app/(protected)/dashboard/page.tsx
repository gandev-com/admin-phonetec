import { KPIStrip }          from '@/components/dashboard/kpi-strip'
import { UrgentAlert }       from '@/components/dashboard/urgent-alert'
import { ActiveOrdersBoard } from '@/components/dashboard/active-orders-board'
import { RecentFeed }        from '@/components/dashboard/recent-feed'

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Urgent orders alert — renders only when there are urgent orders */}
      <UrgentAlert />

      {/* KPI row */}
      <KPIStrip />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActiveOrdersBoard />
        </div>
        <RecentFeed />
      </div>
    </div>
  )
}

