"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const roleFromUrl = searchParams.get("role")
  const [otp, setOtp] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email || !otp) {
      toast.error("Enter the code sent to your email")
      return
    }

    setLoading(true)

    try {
      const { error } = await authClient.signIn.emailOtp({
        email,
        otp,
      })

      if (error) {
        toast.error(error.message ?? "Invalid or expired code")
        return
      }

      await authClient.getSession({
        fetchOptions: {
          onSuccess: async (ctx) => {
            const jwt = ctx.response.headers.get("set-auth-jwt")
            if (jwt) {
              document.cookie = `dispatch.jwt=${jwt}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
            }

            if (roleFromUrl && ["driver", "business"].includes(roleFromUrl)) {
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/set-role`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: roleFromUrl }),
              })

              await authClient.getSession({
                fetchOptions: {
                  onSuccess: (freshCtx) => {
                    const freshJwt =
                      freshCtx.response.headers.get("set-auth-jwt")
                    if (freshJwt) {
                      document.cookie = `dispatch.jwt=${freshJwt}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
                    }
                  },
                },
              })
            }

            const effectiveRole = roleFromUrl ?? (ctx.data?.user as any)?.role

            toast.success("Signed in")

            if (effectiveRole === "driver") {
              router.push("/driver/dashboard")
            } else if (effectiveRole === "business") {
              router.push("/business/dashboard")
            } else if (effectiveRole === "admin") {
              router.push("/admin/dashboard")
            } else {
              router.push("/")
            }
          },
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Check your email
            </span>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
              Enter verification code
            </h1>
            <p className="mt-3 font-sans text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <span className="text-foreground">{email || "your email"}</span>.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="otp"
                className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase"
              >
                Verification code
              </Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                maxLength={6}
                required
                className="font-mono text-lg tracking-[0.3em]"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="font-mono"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and continue"
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
