import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthForm } from "@/components/auth/auth-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Welcome back
            </span>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
              Log in to Dispatch
            </h1>
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              Enter your email to get started. No password needed.
            </p>
          </div>

          <AuthForm mode="login" />

          <p className="mt-8 text-center font-sans text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
