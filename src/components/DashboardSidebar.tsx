"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useClerk } from "@clerk/nextjs"
import { 
  LayoutDashboard, 
  Monitor, 
  Bell, 
  Settings, 
  User,
  LogOut
} from "lucide-react"

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Monitors', href: '/dashboard/monitors', icon: Monitor },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-background px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            Website Change Alert
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="mt-auto">
              <div className="space-y-1">
                <Link
                  href="/dashboard/profile"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                >
                  <User className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Profile
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-x-3 text-muted-foreground hover:text-foreground"
                  onClick={() => signOut({ redirectUrl: '/' })}
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}