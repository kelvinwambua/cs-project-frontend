import Link from "next/link"
import {
  ArrowUpRight,
  Building2,
  Bike,
  MapPin,
  Bell,
  ShieldCheck,
  Radio,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const TRACKER_STEPS = [
  { code: "01", label: "Request created", time: "09:14" },
  { code: "02", label: "Driver accepted", time: "09:17" },
  { code: "03", label: "Package picked up", time: "09:32" },
  { code: "04", label: "In transit", time: "09:33" },
  { code: "05", label: "Delivered", time: "10:05" },
]

const BUSINESS_FEATURES = [
  {
    icon: Building2,
    title: "Create delivery requests",
    description:
      "Log a pickup and dropoff in seconds. Set package details once, send to any available driver.",
  },
  {
    icon: Radio,
    title: "Live order tracking",
    description:
      "Watch every active delivery move on the map as drivers update their location automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Verified drivers only",
    description:
      "Every driver on the platform is reviewed and approved before they can accept a single request.",
  },
]

const DRIVER_FEATURES = [
  {
    icon: Bike,
    title: "Accept open requests",
    description:
      "Browse delivery requests near you and accept the ones that fit your route.",
  },
  {
    icon: MapPin,
    title: "One-tap status updates",
    description:
      "Mark picked up, in transit, and delivered without leaving the job screen.",
  },
  {
    icon: Bell,
    title: "Get paid for completed runs",
    description:
      "Your delivery history is logged automatically, ready for payout reconciliation.",
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-3xl">
              <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                Delivery-as-a-Service &middot; Built for Kenyan SMEs
              </span>
              <h1 className="font-display mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Hand off your deliveries. Keep the visibility.
              </h1>
              <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-muted-foreground">
                Dispatch connects your business with verified delivery drivers,
                so every order moves from pickup to doorstep with a live status
                feed your customers can trust.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group font-mono">
                  <Link href="/register/business">
                    Register your business
                    <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="group font-mono"
                >
                  <Link href="/register/driver">
                    Become a driver
                    <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-secondary/40">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  Live delivery #DSP-10492
                </span>
                <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                  In transit
                </span>
              </div>

              <div className="relative">
                <div className="absolute top-[15px] right-0 left-0 h-px bg-border" />
                <div className="absolute top-[15px] left-0 h-px w-[68%] bg-primary" />
                <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-5 sm:gap-y-0">
                  {TRACKER_STEPS.map((step, index) => {
                    const isComplete = index < 4
                    const isCurrent = index === 3
                    return (
                      <div key={step.code} className="flex flex-col gap-3 pr-4">
                        <div
                          className={
                            isComplete
                              ? "relative z-10 h-[7px] w-[7px] bg-primary"
                              : "relative z-10 h-[7px] w-[7px] border border-border bg-background"
                          }
                        />
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {step.code} &middot; {step.time}
                          </span>
                          <span
                            className={
                              isCurrent
                                ? "font-mono text-sm text-primary"
                                : "font-mono text-sm text-foreground"
                            }
                          >
                            {step.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center gap-4">
              <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                For businesses
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {BUSINESS_FEATURES.map((feature) => (
                <div key={feature.title} className="flex flex-col gap-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="font-display text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Button asChild variant="outline" className="group font-mono">
                <Link href="/register/business">
                  Register your business
                  <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center gap-4">
              <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                For drivers
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {DRIVER_FEATURES.map((feature) => (
                <div key={feature.title} className="flex flex-col gap-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="font-display text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Button asChild variant="outline" className="group font-mono">
                <Link href="/register/driver">
                  Become a driver
                  <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-6 border border-border p-8 sm:flex-row sm:items-center sm:p-12">
              <div>
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  Ready to formalize your deliveries?
                </h2>
                <p className="mt-2 font-sans text-sm text-muted-foreground sm:text-base">
                  Register today and assign your first delivery in minutes.
                </p>
              </div>
              <Button asChild size="lg" className="group font-mono">
                <Link href="/register">
                  Get started
                  <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
