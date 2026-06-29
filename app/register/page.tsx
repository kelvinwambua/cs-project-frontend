import Link from "next/link"
import { ArrowUpRight, Building2, Bike } from "lucide-react"

import { Footer } from "@/components/footer"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-10">
            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Create an account
            </span>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              How will you use Dispatch?
            </h1>
            <p className="mt-3 font-sans text-sm text-muted-foreground sm:text-base">
              Choose the account type that matches what you&apos;ll be doing on
              the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/register/business"
              className="group flex flex-col gap-4 border border-border p-8 transition-colors hover:border-primary"
            >
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">
                  I&apos;m a business
                </h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                  Create delivery requests, assign drivers, and track every
                  order from pickup to doorstep.
                </p>
              </div>
              <span className="mt-auto flex items-center gap-1 font-mono text-sm text-primary">
                Register your business
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>

            <Link
              href="/register/driver"
              className="group flex flex-col gap-4 border border-border p-8 transition-colors hover:border-primary"
            >
              <Bike className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">
                  I&apos;m a driver
                </h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-muted-foreground">
                  Accept delivery requests near you and update status as you
                  complete each run.
                </p>
              </div>
              <span className="mt-auto flex items-center gap-1 font-mono text-sm text-primary">
                Become a driver
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </div>

          <p className="mt-8 text-center font-sans text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
