"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, RefreshCw, MapPin, ArrowRight } from "lucide-react"
import { authClient } from "@/lib/auth-client"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000"
const DELIVERIES_BASE = `${API_ROOT}/api/deliveries`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "cancelled"

interface Delivery {
  id: string
  recipientName: string
  pickupAddress: string
  dropoffAddress: string
  distanceKm: number
  price: string
  status: DeliveryStatus
  createdAt: string
  updatedAt: string
}

type FilterValue = "all" | "delivered" | "cancelled"

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
]

function formatKsh(price: string | number) {
  const value = typeof price === "string" ? parseFloat(price) : price
  return `Ksh ${Math.round(value)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function DriverHistoryPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const user = session?.user

  const [history, setHistory] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterValue>("all")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${DELIVERIES_BASE}/history`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Could not load your delivery history.")
      setHistory(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      filter === "all" ? history : history.filter((d) => d.status === filter),
    [history, filter]
  )

  const totalEarnings = history
    .filter((d) => d.status === "delivered")
    .reduce((sum, d) => sum + parseFloat(d.price), 0)

  if (sessionPending || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="border border-dashed border-border px-6 py-10 text-center">
        <p className="font-mono text-sm text-destructive">
          You need to be signed in to view your delivery history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Delivery history
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {history.length} total · {formatKsh(totalEarnings)} earned
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="group font-mono text-xs"
          onClick={load}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
          )}
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            className="font-mono text-xs"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error && <p className="font-mono text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            {filter === "all"
              ? "All deliveries"
              : FILTERS.find((f) => f.value === filter)?.label}
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Ordered by most recently updated
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="border-t border-dashed border-border px-6 py-10 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                No deliveries to show here yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 font-mono text-xs">ID</TableHead>
                  <TableHead className="font-mono text-xs">Route</TableHead>
                  <TableHead className="font-mono text-xs">Distance</TableHead>
                  <TableHead className="font-mono text-xs">Status</TableHead>
                  <TableHead className="font-mono text-xs">Date</TableHead>
                  <TableHead className="pr-6 text-right font-mono text-xs">
                    Earned
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      #{d.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="max-w-[140px] truncate">
                          {d.pickupAddress}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="max-w-[140px] truncate">
                          {d.dropoffAddress}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.distanceKm.toFixed(1)} km
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          d.status === "delivered" ? "secondary" : "outline"
                        }
                        className="font-mono text-xs"
                      >
                        {d.status === "delivered" ? "Delivered" : "Cancelled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(d.updatedAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-mono text-xs">
                      {d.status === "delivered" ? formatKsh(d.price) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
