import Link from "next/link"
import { Building2 } from "lucide-react"

import { Footer } from "@/components/footer"
import { AuthForm } from "@/components/auth/auth-form"

export default function RegisterBusinessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="mb-4 flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Business account
            </span>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
              Register your business
            </h1>
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              Enter your email to get started. No password needed.
            </p>
          </div>

          <AuthForm mode="register" role="business" />

          <p className="mt-8 text-center font-sans text-sm text-muted-foreground">
            Looking to drive instead?{" "}
            <Link
              href="/register/driver"
              className="text-primary underline-offset-4 hover:underline"
            >
              Become a driver
            </Link>{" "}
            instead.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
