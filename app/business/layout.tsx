"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Package,
  Truck,
  History,
  Settings,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  TrendingUp,
  Users,
  CreditCard,
  Headphones,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import Image from "next/image"

const deliveryNavItems = [
  { label: "Overview", href: "/business/dashboard", icon: Home },
  { label: "Requests", href: "/business/requests", icon: Package },
  { label: "Deliveries", href: "/business/deliveries", icon: Truck },
  { label: "History", href: "/business/history", icon: History },
]

const accountNavItems = [
  { label: "Analytics", href: "/business/analytics", icon: TrendingUp },
  { label: "Team", href: "/business/team", icon: Users },
  { label: "Billing", href: "/business/billing", icon: CreditCard },
  { label: "Support", href: "/business/support", icon: Headphones },
]

function NavSection({
  title,
  items,
  defaultOpen = true,
  onLinkClick,
  exactMatch,
}: {
  title: string
  items: { label: string; href: string; icon: React.ElementType }[]
  defaultOpen?: boolean
  onLinkClick: () => void
  exactMatch?: string[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground">
          <span>{title}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-0.5">
        {items.map((item) => {
          const exact = exactMatch?.includes(item.href)
          const isActive = exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
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
      </CollapsibleContent>
    </Collapsible>
  )
}

function SidebarContent({
  onClose,
  isMobile,
  session,
  onSignOut,
}: {
  onClose: () => void
  isMobile: boolean
  session: { user: { email: string; name?: string } } | null
  onSignOut: () => void
}) {
  const pathname = usePathname()
  const handleLinkClick = isMobile ? onClose : () => {}
  const initials = session?.user?.email
    ? session.user.email.slice(0, 2).toUpperCase()
    : "??"

  const bottomLinks = [
    { label: "Notifications", href: "/business/notifications", icon: Bell },
    { label: "Settings", href: "/business/settings", icon: Settings },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight">Dispatch</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        <NavSection
          title="Deliveries"
          items={deliveryNavItems}
          onLinkClick={handleLinkClick}
          exactMatch={["/business"]}
        />
        <NavSection
          title="Account"
          items={accountNavItems}
          defaultOpen={false}
          onLinkClick={handleLinkClick}
        />
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-border p-2">
        {bottomLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
              <div className="flex-1 overflow-hidden text-left">
                <p className="truncate text-xs leading-tight font-medium text-foreground">
                  {session?.user?.email ?? "Loading..."}
                </p>
                <p className="truncate text-xs leading-tight text-muted-foreground capitalize">
                  {session?.user?.name ?? ""}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link
                href="/business/profile"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive focus:text-destructive"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const initials = session?.user?.email
    ? session.user.email.slice(0, 2).toUpperCase()
    : "??"

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isOpen && (
        <div className="pointer-events-auto fixed top-2 left-2 z-50 hidden flex-row gap-0.5 p-1 lg:flex">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-lg bg-sidebar/50 backdrop-blur-sm" />
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-muted/40 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md transition-all hover:bg-muted/40">
            <div className="flex size-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary">
              {initials}
            </div>
          </button>
        </div>
      )}

      {isOpen && (
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          <SidebarContent
            onClose={() => setIsOpen(false)}
            isMobile={false}
            session={session ?? null}
            onSignOut={handleSignOut}
          />
        </aside>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          onClose={() => setMobileOpen(false)}
          isMobile={true}
          session={session ?? null}
          onSignOut={handleSignOut}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto">
          {!isOpen && <div className="hidden shrink-0 lg:block lg:h-12" />}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
