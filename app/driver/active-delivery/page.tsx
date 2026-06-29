"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, MapPin, Package, Navigation, User, Clock } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

const BASE_URL = "http://localhost:3000/api"

interface ActiveDelivery {
  id: string
  pickupAddress: string
  dropoffAddress: string
  packageDescription?: string
  status: string
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

export default function ActiveDeliveryPage() {
  const [delivery, setDelivery] = useState<ActiveDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDelivery = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/deliveries/active`, {
        credentials: "include",
      })

      if (res.status === 404) {
        setDelivery(null)
        return
      }

      if (!res.ok) {
        throw new Error("Could not load active delivery.")
      }

      const data: ActiveDelivery = await res.json()
      setDelivery(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load active delivery."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDelivery()
  }, [loadDelivery])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Driver Dashboard
            </span>

            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Active Delivery
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Complete your current delivery and keep your location updated
              while travelling.
            </p>

            {error && (
              <p className="mt-6 font-mono text-sm text-destructive">{error}</p>
            )}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionEyebrow
              label={
                loading
                  ? "Loading"
                  : delivery
                    ? "Current Delivery"
                    : "No Active Delivery"
              }
            />

            {loading ? (
              <EmptyState message="Loading delivery..." />
            ) : !delivery ? (
              <EmptyState message="You don't currently have an active delivery." />
            ) : (
              <div className="space-y-8">
                <div className="border border-border p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                      Delivery #{delivery.id}
                    </span>

                    <span className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
                      {delivery.status}
                    </span>
                  </div>

                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <div className="flex gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-mono text-xs text-muted-foreground uppercase">
                            Pickup
                          </p>
                          <p className="text-sm">{delivery.pickupAddress}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <MapPin className="mt-1 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-mono text-xs text-muted-foreground uppercase">
                            Drop-off
                          </p>
                          <p className="text-sm">{delivery.dropoffAddress}</p>
                        </div>
                      </div>

                      {delivery.packageDescription && (
                        <div className="flex gap-3">
                          <Package className="mt-1 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-mono text-xs text-muted-foreground uppercase">
                              Package
                            </p>
                            <p className="text-sm">
                              {delivery.packageDescription}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="flex gap-3">
                        <Clock className="mt-1 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-mono text-xs text-muted-foreground uppercase">
                            Requested
                          </p>
                          <p className="text-sm">
                            {formatTime(delivery.createdAt)}
                          </p>
                        </div>
                      </div>

                      {delivery.fare != null && (
                        <div className="flex gap-3">
                          <User className="mt-1 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-mono text-xs text-muted-foreground uppercase">
                              Fare
                            </p>
                            <p className="text-sm">KES {delivery.fare}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Button>
                      <Navigation className="mr-2 h-4 w-4" />
                      Open Navigation
                    </Button>

                    <Button variant="outline">Arrived at Pickup</Button>

                    <Button variant="outline">Picked Up</Button>

                    <Button variant="outline">Arrived at Destination</Button>

                    <Button>Complete Delivery</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
