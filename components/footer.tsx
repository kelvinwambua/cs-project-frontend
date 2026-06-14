import Link from "next/link"

const PRODUCT_LINKS = [
  { label: "For businesses", href: "/business" },
  { label: "For drivers", href: "/driver" },
  { label: "Track delivery", href: "/track" },
]

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg leading-none font-semibold">
                Dispatch
              </span>
            </div>
            <p className="max-w-xs font-mono text-xs leading-relaxed text-muted-foreground">
              Delivery coordination for Kenyan SMEs. Create requests, assign
              drivers, track every order in real time.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Platform
            </span>
            <nav className="flex flex-col gap-2">
              {PRODUCT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-sm text-foreground/80 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3"></div>

          <div className="flex flex-col gap-3"></div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Dispatch.
          </span>
        </div>
      </div>
    </footer>
  )
}
