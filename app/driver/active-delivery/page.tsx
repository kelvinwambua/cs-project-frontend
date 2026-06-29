"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Loader2,
  MapPin,
  Package,
  Navigation,
  User,
  Clock,
  X,
  CheckCircle,
  Truck,
  KeyRound,
  Send,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

const BASE_URL = "http://localhost:3000/api"

interface ActiveDelivery {
  id: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  recipientName?: string
  recipientPhone?: string
  notes?: string
  status: "accepted" | "picked_up" | "delivered" | "cancelled" | string
  createdAt: string
  price?: string
  distanceKm?: number
  estimatedMinutes?: number
}

interface DriverLocation {
  lat: number
  lng: number
  recordedAt: string
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Inline map modal using Mapbox GL JS (loaded dynamically)
// Requires NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local
// ---------------------------------------------------------------------------

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string

interface MapModalProps {
  delivery: ActiveDelivery
  driverLocation: DriverLocation | null
  onClose: () => void
}

function MapModal({ delivery, driverLocation, onClose }: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const loadMapbox = async () => {
      // Inject Mapbox GL CSS once
      if (!document.getElementById("mapbox-css")) {
        const link = document.createElement("link")
        link.id = "mapbox-css"
        link.rel = "stylesheet"
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
        document.head.appendChild(link)
      }

      // Inject Mapbox GL JS once
      if (!(window as any).mapboxgl) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load Mapbox GL"))
          document.body.appendChild(script)
        })
      }

      const mapboxgl = (window as any).mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [
          (delivery.pickupLng + delivery.dropoffLng) / 2,
          (delivery.pickupLat + delivery.dropoffLat) / 2,
        ],
        zoom: 12,
      })

      mapInstance.current = map

      map.on("load", () => {
        // ── Pickup marker (green) ──
        const pickupEl = document.createElement("div")
        pickupEl.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer"
        new mapboxgl.Marker({ element: pickupEl })
          .setLngLat([delivery.pickupLng, delivery.pickupLat])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>Pickup</strong><br/>${delivery.pickupAddress}`
            )
          )
          .addTo(map)

        // ── Drop-off marker (red) ──
        const dropoffEl = document.createElement("div")
        dropoffEl.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer"
        new mapboxgl.Marker({ element: dropoffEl })
          .setLngLat([delivery.dropoffLng, delivery.dropoffLat])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>Drop-off</strong><br/>${delivery.dropoffAddress}`
            )
          )
          .addTo(map)

        // ── Driver marker (blue) — if location is available ──
        if (driverLocation) {
          const driverEl = document.createElement("div")
          driverEl.style.cssText =
            "width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);cursor:pointer"
          driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl })
            .setLngLat([driverLocation.lng, driverLocation.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 12 }).setHTML(
                "<strong>Your Location</strong>"
              )
            )
            .addTo(map)
        }

        // ── Fit bounds to show all points ──
        const bounds = new mapboxgl.LngLatBounds()
        bounds.extend([delivery.pickupLng, delivery.pickupLat])
        bounds.extend([delivery.dropoffLng, delivery.dropoffLat])
        if (driverLocation) {
          bounds.extend([driverLocation.lng, driverLocation.lat])
        }
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
      })
    }

    loadMapbox().catch(console.error)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        driverMarkerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery])

  // Live-update the driver marker position without re-mounting the map
  useEffect(() => {
    if (!driverLocation || !mapInstance.current) return
    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([
        driverLocation.lng,
        driverLocation.lat,
      ])
    } else {
      // Marker didn't exist yet (location arrived after load)
      const driverEl = document.createElement("div")
      driverEl.style.cssText =
        "width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);cursor:pointer"
      driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            "<strong>Your Location</strong>"
          )
        )
        .addTo(mapInstance.current)
    }
  }, [driverLocation])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-3xl rounded-none border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Route Map
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {delivery.pickupAddress} → {delivery.dropoffAddress}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close map"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-6 border-b border-border px-5 py-2">
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
            Pickup
          </span>
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
            Drop-off
          </span>
          <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
            Your position
          </span>
        </div>

        {/* Map container */}
        <div ref={mapRef} className="h-[420px] w-full" />

        {/* Open in Google Maps link */}
        <div className="border-t border-border px-5 py-3">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${delivery.dropoffLat},${delivery.dropoffLng}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-primary underline-offset-4 hover:underline"
          >
            Open turn-by-turn in Google Maps ↗
          </a>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// OTP verification modal
// ---------------------------------------------------------------------------

interface OtpModalProps {
  delivery: ActiveDelivery
  onSuccess: (updated: ActiveDelivery) => void
  onClose: () => void
}

function OtpModal({ delivery, onSuccess, onClose }: OtpModalProps) {
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"send" | "verify">("send")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentInfo, setSentInfo] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === "verify") inputRef.current?.focus()
  }, [step])

  async function requestOtp() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/deliveries/${delivery.id}/otp`, {
        method: "POST",
        credentials: "include",
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Could not send OTP.")
      setSentInfo(body.message)
      setStep("verify")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP.")
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit code.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${BASE_URL}/deliveries/${delivery.id}/verify-otp`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: otp.trim() }),
        }
      )
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Verification failed.")
      onSuccess(body)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              Confirm Handoff
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Recipient: {delivery.recipientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-6">
          {step === "send" ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                A 6-digit code will be sent via SMS to the recipient&apos;s
                phone number. Ask them to read it out to you.
              </p>
              {error && (
                <p className="font-mono text-xs text-destructive">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={requestOtp}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send OTP to Recipient
              </Button>
            </>
          ) : (
            <>
              {sentInfo && (
                <p className="font-mono text-xs text-green-600">{sentInfo}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code the recipient received.
              </p>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full border border-border bg-transparent px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] transition-colors outline-none focus:border-primary"
              />
              {error && (
                <p className="font-mono text-xs text-destructive">{error}</p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("send")
                    setOtp("")
                    setError(null)
                  }}
                  disabled={loading}
                >
                  Resend
                </Button>
                <Button
                  className="flex-1"
                  onClick={verifyOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Confirm
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ActiveDeliveryPage() {
  const [delivery, setDelivery] = useState<ActiveDelivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null
  )
  const [showMap, setShowMap] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)

  // ------------------------------------------------------------------
  // Load active delivery
  // ------------------------------------------------------------------
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

      if (!res.ok) throw new Error("Could not load active delivery.")

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

  // ------------------------------------------------------------------
  // Poll driver location (business-facing — fetch from server)
  // ------------------------------------------------------------------
  const loadDriverLocation = useCallback(async () => {
    if (!delivery) return
    try {
      const res = await fetch(
        `${BASE_URL}/deliveries/${delivery.id}/location`,
        { credentials: "include" }
      )
      if (!res.ok) return
      const data = await res.json()
      setDriverLocation({
        lat: data.location.lat,
        lng: data.location.lng,
        recordedAt: data.location.recordedAt,
      })
    } catch (err) {
      console.error("Location poll error:", err)
    }
  }, [delivery])

  useEffect(() => {
    if (!delivery) return
    loadDriverLocation()
    const timer = setInterval(loadDriverLocation, 5000)
    return () => clearInterval(timer)
  }, [delivery, loadDriverLocation])

  // ------------------------------------------------------------------
  // Push driver GPS location to the server
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!delivery) return

    // Only push location while delivery is active (not yet delivered/cancelled)
    if (delivery.status === "delivered" || delivery.status === "cancelled") {
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        try {
          await fetch(`${BASE_URL}/deliveries/${delivery.id}/location`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          })
          // Optimistically update local driver location state too
          setDriverLocation({
            lat: coords.latitude,
            lng: coords.longitude,
            recordedAt: new Date().toISOString(),
          })
        } catch (err) {
          console.error("Location push error:", err)
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [delivery?.id, delivery?.status])

  // ------------------------------------------------------------------
  // Delivery action (pick_up / deliver)
  // ------------------------------------------------------------------
  const performAction = async (action: "pick_up") => {
    if (!delivery) return
    setActionLoading(true)
    setActionError(null)

    try {
      const res = await fetch(`${BASE_URL}/deliveries/${delivery.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        // Note: "deliver" action is now handled via OTP flow
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Action failed. Please try again.")
      }

      const updated: ActiveDelivery = await res.json()
      setDelivery(updated)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Action failed. Please try again."
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ------------------------------------------------------------------
  // Derived button states based on delivery status
  // ------------------------------------------------------------------
  const canPickUp = delivery?.status === "accepted"
  const canDeliver = delivery?.status === "picked_up"
  const isComplete = delivery?.status === "delivered"

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {showMap && delivery && (
        <MapModal
          delivery={delivery}
          driverLocation={driverLocation}
          onClose={() => setShowMap(false)}
        />
      )}

      {showOtpModal && delivery && (
        <OtpModal
          delivery={delivery}
          onSuccess={(updated) => {
            setDelivery(updated)
            setShowOtpModal(false)
          }}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      <main className="flex-1">
        {/* Hero */}
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

        {/* Body */}
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
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !delivery ? (
              <EmptyState message="You don't currently have an active delivery." />
            ) : (
              <div className="space-y-8">
                {/* ── Card ── */}
                <div className="border border-border p-6">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
                      Delivery #{delivery.id}
                    </span>
                    <StatusBadge status={delivery.status} />
                  </div>

                  {/* Details grid */}
                  <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                      <InfoRow
                        icon={
                          <MapPin className="mt-0.5 h-4 w-4 text-green-500" />
                        }
                        label="Pickup"
                        value={delivery.pickupAddress}
                      />
                      <InfoRow
                        icon={
                          <MapPin className="mt-0.5 h-4 w-4 text-red-500" />
                        }
                        label="Drop-off"
                        value={delivery.dropoffAddress}
                      />
                      {delivery.notes && (
                        <InfoRow
                          icon={
                            <Package className="mt-0.5 h-4 w-4 text-primary" />
                          }
                          label="Notes"
                          value={delivery.notes}
                        />
                      )}
                    </div>

                    <div className="space-y-6">
                      <InfoRow
                        icon={<Clock className="mt-0.5 h-4 w-4 text-primary" />}
                        label="Requested"
                        value={formatTime(delivery.createdAt)}
                      />
                      {delivery.price && (
                        <InfoRow
                          icon={
                            <User className="mt-0.5 h-4 w-4 text-primary" />
                          }
                          label="Fare"
                          value={`KES ${delivery.price}`}
                        />
                      )}
                      {delivery.distanceKm != null && (
                        <InfoRow
                          icon={
                            <Truck className="mt-0.5 h-4 w-4 text-primary" />
                          }
                          label="Distance"
                          value={`${delivery.distanceKm.toFixed(1)} km · ~${Math.round(delivery.estimatedMinutes ?? 0)} min`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Action error */}
                  {actionError && (
                    <p className="mt-6 font-mono text-xs text-destructive">
                      {actionError}
                    </p>
                  )}

                  {/* Action buttons */}
                  {!isComplete && (
                    <div className="mt-10 flex flex-wrap gap-3">
                      {/* View map */}
                      <Button
                        variant="outline"
                        onClick={() => setShowMap(true)}
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        View Map
                      </Button>

                      {/* Pick up — only when status is "accepted" */}
                      <Button
                        variant="outline"
                        disabled={!canPickUp || actionLoading}
                        onClick={() => performAction("pick_up")}
                      >
                        {actionLoading && canPickUp ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="mr-2 h-4 w-4" />
                        )}
                        Picked Up
                      </Button>

                      {/* Complete delivery — opens OTP flow */}
                      <Button
                        disabled={!canDeliver}
                        onClick={() => setShowOtpModal(true)}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Complete Delivery
                      </Button>
                    </div>
                  )}

                  {/* Completed state */}
                  {isComplete && (
                    <div className="mt-8 flex items-center gap-3 border border-green-500/30 bg-green-500/5 px-4 py-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <p className="font-mono text-sm text-green-600">
                        Delivery completed successfully.
                      </p>
                    </div>
                  )}
                </div>

                {/* Driver location last-seen */}
                {driverLocation && (
                  <p className="font-mono text-xs text-muted-foreground">
                    Location last updated:{" "}
                    {formatTime(driverLocation.recordedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    accepted: "text-yellow-600",
    picked_up: "text-blue-600",
    delivered: "text-green-600",
    cancelled: "text-destructive",
    pending: "text-muted-foreground",
  }
  return (
    <span
      className={`font-mono text-xs tracking-[0.2em] uppercase ${colours[status] ?? "text-primary"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      {icon}
      <div>
        <p className="font-mono text-xs text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}
