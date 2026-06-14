"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Link2, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

type AuthMethod = "magic-link" | "otp"

interface AuthFormProps {
  mode: "register" | "login"
  role?: "driver" | "business"
}

export function AuthForm({ mode, role }: AuthFormProps) {
  const router = useRouter()
  const [method, setMethod] = React.useState<AuthMethod>("magic-link")
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) {
      toast.error("Enter your email address")
      return
    }

    setLoading(true)

    try {
      if (method === "magic-link") {
        const callbackURL =
          mode === "register" && role
            ? `${origin}/verify?role=${role}`
            : `${origin}/verify`

        const { error } = await authClient.signIn.magicLink({
          email,
          callbackURL,
        })

        if (error) {
          toast.error(error.message ?? "Could not send magic link")
          return
        }

        toast.success("Check your email for a sign-in link")
      } else {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "sign-in",
          ...(mode === "register" && role ? { role } : {}),
        })

        if (error) {
          toast.error(error.message ?? "Could not send code")
          return
        }

        toast.success("Check your email for a verification code")

        const params = new URLSearchParams({ email })
        if (mode === "register" && role) {
          params.set("role", role)
        }
        router.push(`/verify-otp?${params.toString()}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase"
        >
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="font-sans"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
          Sign-in method
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("magic-link")}
            className={cn(
              "flex flex-col items-start gap-2 border p-4 text-left transition-colors",
              method === "magic-link"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-foreground/30"
            )}
          >
            <Link2 className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold">
              Magic link
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              We&apos;ll email you a sign-in link
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMethod("otp")}
            className={cn(
              "flex flex-col items-start gap-2 border p-4 text-left transition-colors",
              method === "otp"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-foreground/30"
            )}
          >
            <KeyRound className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold">
              Email code
            </span>
            <span className="font-sans text-xs text-muted-foreground">
              We&apos;ll email you a 6-digit code
            </span>
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={loading} className="font-mono">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : method === "magic-link" ? (
          "Send magic link"
        ) : (
          "Send code"
        )}
      </Button>
    </form>
  )
}
