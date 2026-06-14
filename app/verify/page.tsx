"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleFromUrl = searchParams.get("role")
  const [error, setError] = useState(false)

  useEffect(() => {
    async function redirect() {
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

            if (effectiveRole === "driver") {
              router.replace("/driver/dashboard")
            } else if (effectiveRole === "business") {
              router.replace("/business/dashboard")
            } else if (effectiveRole === "admin") {
              router.replace("/admin/dashboard")
            } else {
              setError(true)
            }
          },
          onError: () => {
            setError(true)
          },
        },
      })
    }

    redirect()
  }, [router, roleFromUrl])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="font-mono text-sm text-destructive">
            Verification failed or link has expired.
          </p>
          <a href="/login" className="font-mono text-sm underline">
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="font-mono text-sm text-muted-foreground">Verifying…</p>
      </div>
    </div>
  )
}
