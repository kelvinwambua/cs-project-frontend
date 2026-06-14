"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Inbox,
  Navigation,
  History,
  UserCircle,
  LogOut,
  Menu,
  X,
  Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"

const navItems = [
  { label: "Dashboard", href: "/driver/dashboard", icon: LayoutDashboard },
  { label: "Available Jobs", href: "/driver/requests", icon: Inbox },
  { label: "Active Delivery", href: "/driver/active", icon: Navigation },
  { label: "History", href: "/driver/history", icon: History },
  { label: "Profile", href: "/driver/profile", icon: UserCircle },
]

function SidebarContent({
  onClose,
  isMobile,
}: {
  onClose: () => void
  isMobile: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const handleLinkClick = isMobile ? onClose : () => {}

  async function handleSignOut() {
    await authClient.signOut()
    router.replace("/login")
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tracking-tight">
            Dispatch
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="shrink-0 px-3 py-3">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          Driver
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/driver/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const currentLabel =
    navItems.find((i) =>
      i.href === "/driver/dashboard"
        ? pathname === i.href
        : pathname.startsWith(i.href)
    )?.label ?? "Dashboard"

  async function handleSignOut() {
    await authClient.signOut()
    router.replace("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border lg:flex">
          <SidebarContent
            onClose={() => setSidebarOpen(false)}
            isMobile={false}
          />
        </aside>
      )}

      {!sidebarOpen && (
        <div className="fixed top-2 left-2 z-50 hidden gap-0.5 p-1 lg:flex">
          <div className="absolute inset-0 -z-10 rounded-md bg-background/70 backdrop-blur-sm" />
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} isMobile={true} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">
              {currentLabel}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-mono text-xs font-bold text-primary transition-all hover:bg-primary/20">
                D
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/driver/profile"
                  className="flex items-center gap-2"
                >
                  <UserCircle className="h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
