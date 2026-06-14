import Link from "next/link"
import { Bike } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthForm } from "@/components/auth/auth-form"

export default function RegisterDriverPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="mb-4 flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
              <Bike className="h-5 w-5" />
            </div>
            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Driver account
            </span>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
              Become a driver
            </h1>
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              Enter your email to get started. No password needed.
            </p>
          </div>

          <AuthForm mode="register" role="driver" />

          <p className="mt-8 text-center font-sans text-sm text-muted-foreground">
            Not a driver?{" "}
            <Link
              href="/register/business"
              className="text-primary underline-offset-4 hover:underline"
            >
              Register your business
            </Link>{" "}
            instead.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
