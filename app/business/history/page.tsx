"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  Navigation,
  Clock,
  Ruler,
  Banknote,
  User,
} from "lucide-react"
import { deliveriesApi } from "@/lib/api"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type HistoryDelivery = {
  id: string
  status: "delivered" | "cancelled"
  recipientName: string
  recipientPhone: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  dropoffAddress: string
  dropoffLat: number
  dropoffLng: number
  distanceKm: number
  estimatedMinutes: number
  price: string
  updatedAt: string
}

const STATUS_CONFIG = {
  delivered: {
    variant: "outline" as const,
    label: "Delivered",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled: {
    variant: "destructive" as const,
    label: "Cancelled",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
}

function RouteMap({
  pickup,
  dropoff,
}: {
  pickup: { lat: number; lng: number }
  dropoff: { lat: number; lng: number }
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([pickup.lng, pickup.lat])
    bounds.extend([dropoff.lng, dropoff.lat])

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
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng])

  return <div ref={mapContainer} className="h-full w-full" />
}

function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-[560px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function BusinessHistoryPage() {
  const [history, setHistory] = useState<HistoryDelivery[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "delivered" | "cancelled">("all")

  useEffect(() => {
    deliveriesApi
      .businessHistory()
      .then((data: HistoryDelivery[]) => setHistory(data))
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Could not load delivery history"
        )
      )
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!history) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <Skeleton className="mb-4 h-8 w-32" />
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <HistorySkeleton />
      </div>
    )
  }

  const filtered = history.filter((d) =>
    filter === "all" ? true : d.status === filter
  )
  const mostRecent = history[0]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/business/requests">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to requests
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            Delivery history
          </h1>
          <p className="text-sm text-muted-foreground">
            Completed and cancelled deliveries
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card className="overflow-hidden p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d) => {
                      const status = STATUS_CONFIG[d.status]
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-muted">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm leading-tight font-medium">
                                  {d.recipientName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(d.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1.5">
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            KES {d.price}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-32 text-center text-sm text-muted-foreground"
                        >
                          No deliveries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-6 flex flex-col gap-4">
              {mostRecent ? (
                <>
                  <Card className="overflow-hidden p-0">
                    <CardHeader className="border-b bg-muted/30 px-5 py-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                          Most recent route
                        </h2>
                        <Badge
                          variant={STATUS_CONFIG[mostRecent.status].variant}
                          className="gap-1.5"
                        >
                          {STATUS_CONFIG[mostRecent.status].icon}
                          {STATUS_CONFIG[mostRecent.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <div className="h-[420px]">
                      <RouteMap
                        pickup={{
                          lat: mostRecent.pickupLat,
                          lng: mostRecent.pickupLng,
                        }}
                        dropoff={{
                          lat: mostRecent.dropoffLat,
                          lng: mostRecent.dropoffLng,
                        }}
                      />
                    </div>
                    <Separator />
                    <CardContent className="grid grid-cols-3 divide-x p-0">
                      <div className="flex flex-col items-center gap-1 py-4">
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-lg font-bold tabular-nums">
                          {Number(mostRecent.distanceKm).toFixed(1)}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase">
                          km
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 py-4">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-lg font-bold tabular-nums">
                          ~{Math.round(mostRecent.estimatedMinutes)}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase">
                          min
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 py-4">
                        <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-lg font-bold tabular-nums">
                          {mostRecent.price}
                        </span>
                        <span className="text-[11px] text-muted-foreground uppercase">
                          KES
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex flex-col gap-4 p-5">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                          <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Pickup
                          </span>
                          <span className="text-sm leading-snug font-medium">
                            {mostRecent.pickupAddress}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 h-4 border-l border-dashed" />
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-muted">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Dropoff
                          </span>
                          <span className="text-sm leading-snug font-medium">
                            {mostRecent.dropoffAddress}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex h-[560px] items-center justify-center rounded-xl border text-sm text-muted-foreground">
                  No completed deliveries yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
