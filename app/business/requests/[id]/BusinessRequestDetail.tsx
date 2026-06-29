"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import {
  ArrowLeft,
  Navigation,
  MapPin,
  User,
  Phone,
  Ruler,
  Clock,
  Banknote,
  Home,
  Building2,
  Briefcase,
  FileText,
  XCircle,
  Truck,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deliveriesApi } from "@/lib/api"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline"
    label: string
    icon: React.ReactNode
  }
> = {
  pending: {
    variant: "secondary",
    label: "Waiting for driver",
    icon: <Loader2 className="h-3.5 w-3.5" />,
  },
  accepted: {
    variant: "default",
    label: "Driver assigned",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  picked_up: {
    variant: "default",
    label: "Package picked up",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  delivered: {
    variant: "outline",
    label: "Delivered",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled: {
    variant: "destructive",
    label: "Cancelled",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
}

const LOCATION_TYPE_ICONS: Record<string, typeof Home> = {
  house: Home,
  apartment: Building2,
  office: Briefcase,
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  house: "House",
  apartment: "Apartment",
  office: "Office",
}

type Delivery = {
  id: string
  status: string
  recipientName: string
  recipientPhone: string
  pickupAddress: string
  pickupBuilding?: string | null
  pickupNeighborhood?: string | null
  pickupCity?: string | null
  pickupLocationType?: string | null
  pickupLocationNote?: string | null
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffBuilding?: string | null
  dropoffNeighborhood?: string | null
  dropoffCity?: string | null
  dropoffLocationType?: string | null
  dropoffLocationNote?: string | null
  dropoffLat: number
  dropoffLng: number
  distanceKm: number
  estimatedMinutes: number
  price: string
  notes?: string | null
}

type DriverLocation = {
  lat: number
  lng: number
  recordedAt: string
} | null

function AddressBlock({
  label,
  address,
  building,
  neighborhood,
  city,
  locationType,
  locationNote,
  icon: Icon,
}: {
  label: string
  address: string
  building?: string | null
  neighborhood?: string | null
  city?: string | null
  locationType?: string | null
  locationNote?: string | null
  icon: typeof Navigation
}) {
  const TypeIcon = locationType ? LOCATION_TYPE_ICONS[locationType] : null
  const typeLabel = locationType ? LOCATION_TYPE_LABELS[locationType] : null
  const meta = [typeLabel, building, neighborhood, city].filter(Boolean)

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-0.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 pb-1">
        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm leading-snug font-medium">{address}</span>
        {meta.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {TypeIcon && <TypeIcon className="-mt-px mr-1 inline h-3 w-3" />}
            {meta.join(" · ")}
          </span>
        )}
        {locationNote && (
          <span className="text-xs text-muted-foreground italic">
            {locationNote}
          </span>
        )}
      </div>
    </div>
  )
}

function DeliveryMap({
  pickup,
  dropoff,
  driverLocation,
}: {
  pickup: { lat: number; lng: number }
  dropoff: { lat: number; lng: number }
  driverLocation: DriverLocation
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const driverMarker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([pickup.lng, pickup.lat])
    bounds.extend([dropoff.lng, dropoff.lat])
    if (driverLocation) bounds.extend([driverLocation.lng, driverLocation.lat])

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      bounds,
      fitBoundsOptions: { padding: 60 },
    })

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    )

    map.current.on("load", () => {
      if (!map.current) return

      const pickupEl = document.createElement("div")
      pickupEl.className =
        "flex items-center justify-center w-8 h-8 rounded-full bg-primary border-2 border-background shadow-md"
      pickupEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`

      new mapboxgl.Marker({ element: pickupEl })
        .setLngLat([pickup.lng, pickup.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText("Pickup"))
        .addTo(map.current)

      const dropoffEl = document.createElement("div")
      dropoffEl.className =
        "flex items-center justify-center w-8 h-8 rounded-full bg-destructive border-2 border-background shadow-md"
      dropoffEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`

      new mapboxgl.Marker({ element: dropoffEl })
        .setLngLat([dropoff.lng, dropoff.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText("Dropoff"))
        .addTo(map.current)

      if (driverLocation) {
        const driverEl = document.createElement("div")
        driverEl.className =
          "flex items-center justify-center w-9 h-9 rounded-full bg-background border-2 border-primary shadow-lg"
        driverEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="16" height="13" x="4" y="7" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v5"/><path d="M8 15h8"/></svg>`

        driverMarker.current = new mapboxgl.Marker({ element: driverEl })
          .setLngLat([driverLocation.lng, driverLocation.lat])
          .setPopup(new mapboxgl.Popup({ offset: 18 }).setText("Driver"))
          .addTo(map.current)
      }

      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [pickup.lng, pickup.lat],
              [dropoff.lng, dropoff.lat],
            ],
          },
        },
      })

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "hsl(var(--primary))",
          "line-width": 2.5,
          "line-dasharray": [2, 3],
          "line-opacity": 0.6,
        },
      })
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!driverMarker.current || !driverLocation) return
    driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat])
  }, [driverLocation])

  return <div ref={mapContainer} className="h-full w-full" />
}

export default function BusinessRequestDetail({
  delivery,
  driverLocation,
}: {
  delivery: Delivery
  driverLocation: DriverLocation
}) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!delivery) return null

  const status = STATUS_CONFIG[delivery.status] ?? STATUS_CONFIG.pending
  const showMap =
    delivery.pickupLat &&
    delivery.pickupLng &&
    delivery.dropoffLat &&
    delivery.dropoffLng

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      await deliveriesApi.cancel(delivery.id)
      router.push("/business/requests")
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/business/requests">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All deliveries
            </Link>
          </Button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted">
                <User className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {delivery.recipientName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {delivery.recipientPhone}
                </p>
              </div>
            </div>
            <Badge
              variant={status.variant}
              className="gap-1.5 px-3 py-1 text-sm"
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b bg-muted/30 px-5 py-3">
                <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Route
                </h2>
              </div>
              <div className="flex flex-col gap-4 p-5">
                <AddressBlock
                  label="Pickup"
                  address={delivery.pickupAddress}
                  building={delivery.pickupBuilding}
                  neighborhood={delivery.pickupNeighborhood}
                  city={delivery.pickupCity}
                  locationType={delivery.pickupLocationType}
                  locationNote={delivery.pickupLocationNote}
                  icon={Navigation}
                />
                <div className="ml-4 h-4 border-l border-dashed" />
                <AddressBlock
                  label="Dropoff"
                  address={delivery.dropoffAddress}
                  building={delivery.dropoffBuilding}
                  neighborhood={delivery.dropoffNeighborhood}
                  city={delivery.dropoffCity}
                  locationType={delivery.dropoffLocationType}
                  locationNote={delivery.dropoffLocationNote}
                  icon={MapPin}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="grid grid-cols-3 divide-x">
                <div className="flex flex-col items-center gap-1 py-5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-2xl font-bold tracking-tight tabular-nums">
                    {Number(delivery.distanceKm).toFixed(1)}
                  </span>
                  <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    km
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 py-5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-2xl font-bold tracking-tight tabular-nums">
                    ~{Math.round(delivery.estimatedMinutes)}
                  </span>
                  <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    min
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 py-5">
                  <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-2xl font-bold tracking-tight tabular-nums">
                    {delivery.price}
                  </span>
                  <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    KES
                  </span>
                </div>
              </div>
            </div>

            {delivery.notes && (
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="border-b bg-muted/30 px-5 py-3">
                  <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Notes
                  </h2>
                </div>
                <div className="flex items-start gap-3 p-5">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm leading-relaxed">{delivery.notes}</p>
                </div>
              </div>
            )}

            {delivery.status === "pending" && (
              <div className="flex flex-col gap-2">
                {error && (
                  <p className="text-center text-sm text-destructive">
                    {error}
                  </p>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      disabled={cancelling}
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel delivery
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this delivery?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The delivery for{" "}
                        <span className="font-medium text-foreground">
                          {delivery.recipientName}
                        </span>{" "}
                        will be cancelled. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep it</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                      >
                        {cancelling ? "Cancelling…" : "Yes, cancel"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-6 overflow-hidden rounded-xl border bg-card">
              {showMap ? (
                <>
                  <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
                    <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      Live map
                    </h2>
                    {driverLocation && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        Driver location live
                      </span>
                    )}
                    {!driverLocation &&
                      (delivery.status === "accepted" ||
                        delivery.status === "picked_up") && (
                        <span className="text-xs text-muted-foreground">
                          Waiting for driver location…
                        </span>
                      )}
                  </div>
                  <div className="h-[520px]">
                    <DeliveryMap
                      pickup={{
                        lat: delivery.pickupLat,
                        lng: delivery.pickupLng,
                      }}
                      dropoff={{
                        lat: delivery.dropoffLat,
                        lng: delivery.dropoffLng,
                      }}
                      driverLocation={driverLocation}
                    />
                  </div>
                  <div className="flex items-center gap-5 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                      Pickup
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />
                      Dropoff
                    </span>
                    {driverLocation && (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                        Driver
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-[560px] items-center justify-center text-sm text-muted-foreground">
                  Map unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
