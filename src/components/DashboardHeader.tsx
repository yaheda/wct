"use client"

import { Button } from "@/components/ui/button"
import { Bell, Menu, Search, User } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-none">
      <div className="flex h-16 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-border lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="relative flex flex-1 items-center">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground pl-3" />
              <input
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 bg-transparent text-sm"
                placeholder="Search monitors..."
                type="search"
                name="search"
              />
            </div>
          </div>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <Button variant="ghost" size="sm" className="relative">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

            {/* Profile dropdown placeholder */}
            <Button variant="ghost" size="sm" className="flex items-center gap-x-2">
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="text-sm font-semibold leading-6 text-foreground" aria-hidden="true">
                  User Name
                </span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}