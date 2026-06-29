"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowUpRight, Loader2, MapPin, Package, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useRouter } from "next/navigation"

interface Delivery {
  id: string
  pickupAddress: string
  dropoffAddress: string
  packageDescription?: string
  status: "pending"
  createdAt: string
  fare?: number
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function SectionEyebrow({ label }: { label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-border px-6 py-10 text-center">
      <p className="font-mono text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function AvailableDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const router = useRouter()

  const BASE_URL = "http://localhost:3000/api"

  const loadAvailable = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await fetch(`${BASE_URL}/deliveries/available-deliveries`, {
        credentials: "include",
      })

      if (res.status === 403) {
        setForbidden(true)
        return
      }
      if (!res.ok) throw new Error("Could not load available deliveries.")

      const data: Delivery[] = await res.json()
      setDeliveries(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load available deliveries."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAvailable()
  }, [loadAvailable])

  async function acceptDelivery(id: string) {
    setAcceptingId(id)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/deliveries/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "accept",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)

        throw new Error(data?.error ?? "Could not accept this delivery.")
      }

      // Redirect to the driver's active delivery page.
      // That page should call GET /api/deliveries/active.
      router.push("/driver/active-delivery")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not accept this delivery."
      )
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                  Driver dashboard
                </span>
                <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Available deliveries
                </h1>
                <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-muted-foreground">
                  Open requests waiting for a driver, ordered newest first.
                  Accept one to add it to your active deliveries.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="group font-mono"
                onClick={loadAvailable}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-90" />
                )}
                Refresh
              </Button>
            </div>

            {error && (
              <p className="mt-6 font-mono text-sm text-destructive">{error}</p>
            )}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionEyebrow
              label={
                loading
                  ? "Loading"
                  : `${deliveries.length} request${deliveries.length === 1 ? "" : "s"}`
              }
            />

            {forbidden ? (
              <EmptyState message="Only drivers can see available deliveries." />
            ) : loading ? (
              <EmptyState message="Loading..." />
            ) : deliveries.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex flex-col gap-4 border border-border p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                        #{delivery.id}
                      </span>
                      {delivery.fare != null && (
                        <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                          KES {delivery.fare}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="font-sans text-sm text-foreground">
                          {delivery.pickupAddress}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-sans text-sm text-foreground">
                          {delivery.dropoffAddress}
                        </span>
                      </div>
                    </div>

                    {delivery.packageDescription && (
                      <div className="flex items-start gap-2">
                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-sans text-sm text-muted-foreground">
                          {delivery.packageDescription}
                        </span>
                      </div>
                    )}

                    <span className="font-mono text-xs text-muted-foreground">
                      Requested {formatTime(delivery.createdAt)}
                    </span>

                    <Button
                      size="sm"
                      className="group mt-2 w-fit font-mono"
                      onClick={() => acceptDelivery(delivery.id)}
                      disabled={acceptingId === delivery.id}
                    >
                      {acceptingId === delivery.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Accept delivery
                          <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No deliveries available right now. Check back shortly." />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
