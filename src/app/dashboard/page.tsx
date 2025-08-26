import { Button } from "@/components/ui/button"
import { Plus, Monitor, Bell, TrendingUp, Clock } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard Overview
        </h1>
        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your monitors.
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-primary/10 p-3">
              <Monitor className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Active Monitors</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">0</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-orange-500/10 p-3">
              <Bell className="h-6 w-6 text-orange-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Recent Alerts</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">0</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-green-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-green-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Changes Detected</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">0</p>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border bg-background p-6">
          <dt>
            <div className="absolute rounded-md bg-blue-500/10 p-3">
              <Clock className="h-6 w-6 text-blue-500" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-muted-foreground">Last Check</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-foreground">--</p>
          </dd>
        </div>
      </div>

      {/* Empty state */}
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <Monitor className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No monitors yet</h3>
        <p className="mt-2 text-muted-foreground">
          Get started by creating your first website monitor.
        </p>
        <div className="mt-6">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Monitor
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium text-foreground">Recent Activity</h2>
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No activity yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor activity will appear here once you set up your first monitor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}