"use client"

import { useCallback, useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Navigation,
  CheckCircle2,
  Banknote,
  Wallet,
  MapPin,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") + "/api/deliveries" ||
  "http://localhost:3000/api/deliveries"

type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "cancelled"

interface Delivery {
  id: string
  businessId: string
  driverId: string | null
  recipientName: string
  recipientPhone: string
  pickupAddress: string
  dropoffAddress: string
  notes: string | null
  distanceKm: number
  estimatedMinutes: number
  price: string
  status: DeliveryStatus
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKsh(price: string | number) {
  const value = typeof price === "string" ? parseFloat(price) : price
  return `Ksh ${Math.round(value)}`
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

function isThisWeek(iso: string, ref: Date) {
  const d = new Date(iso)
  const startOfWeek = new Date(ref)
  const day = (ref.getDay() + 6) % 7 // Monday = 0
  startOfWeek.setDate(ref.getDate() - day)
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}

export default function DriverDashboardPage() {
  const [active, setActive] = useState<Delivery | null>(null)
  const [availableJobs, setAvailableJobs] = useState<Delivery[]>([])
  const [history, setHistory] = useState<Delivery[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [activeRes, availableRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/active`, { credentials: "include" }),
        fetch(`${API_BASE}/available-deliveries`, { credentials: "include" }),
        fetch(`${API_BASE}/history`, { credentials: "include" }),
      ])

      // /active returns 404 when there's nothing active — that's expected,
      // not an error.
      if (activeRes.ok) {
        setActive(await activeRes.json())
      } else if (activeRes.status === 404) {
        setActive(null)
      } else {
        throw new Error("Could not load your active delivery.")
      }

      if (!availableRes.ok) throw new Error("Could not load available jobs.")
      setAvailableJobs(await availableRes.json())

      if (!historyRes.ok) throw new Error("Could not load delivery history.")
      setHistory(await historyRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function acceptDelivery(id: string) {
    setAcceptingId(id)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Could not accept this delivery.")
      }
      const accepted: Delivery = await res.json()
      setActive(accepted)
      setAvailableJobs((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not accept this delivery."
      )
    } finally {
      setAcceptingId(null)
    }
  }

  const now = new Date()
  const delivered = history.filter((d) => d.status === "delivered")
  const deliveriesToday = delivered.filter((d) => isSameDay(d.updatedAt, now))
  const deliveriesThisWeek = delivered.filter((d) =>
    isThisWeek(d.updatedAt, now)
  )
  const earningsToday = deliveriesToday.reduce(
    (sum, d) => sum + parseFloat(d.price),
    0
  )
  const earningsThisWeek = deliveriesThisWeek.reduce(
    (sum, d) => sum + parseFloat(d.price),
    0
  )

  const stats = [
    {
      label: "Deliveries today",
      value: String(deliveriesToday.length),
      icon: CheckCircle2,
    },
    {
      label: "This week",
      value: String(deliveriesThisWeek.length),
      icon: Navigation,
    },
    {
      label: "Earnings today",
      value: formatKsh(earningsToday),
      icon: Banknote,
    },
    {
      label: "Earnings this week",
      value: formatKsh(earningsThisWeek),
      icon: Wallet,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {now.toLocaleDateString("en-KE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 border border-border px-4 py-2">
          {/* Not wired to a backend field yet — see note in chat. */}
          <Switch id="availability" defaultChecked />
          <Label
            htmlFor="availability"
            className="cursor-pointer font-mono text-xs"
          >
            Available
          </Label>
        </div>
      </div>

      {error && <p className="font-mono text-sm text-destructive">{error}</p>}

      {active && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base">
                Active delivery
              </CardTitle>
              <Badge className="font-mono text-xs uppercase">
                {active.status.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription className="font-mono text-xs">
              #{active.id} · {active.distanceKm.toFixed(1)} km ·{" "}
              {formatKsh(active.price)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{active.pickupAddress}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{active.dropoffAddress}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="font-mono text-xs">
                {stat.label}
              </CardDescription>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-bold">
                {loading ? "—" : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base">
                Available jobs
              </CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                Open delivery requests near you
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/driver/requests" className="font-mono text-xs">
                View all
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : availableJobs.length === 0 ? (
            <div className="border border-dashed border-border px-6 py-10 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                No deliveries available right now.
              </p>
            </div>
          ) : (
            availableJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between border border-border p-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{job.id}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      ·
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {job.distanceKm.toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{job.pickupAddress}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{job.dropoffAddress}</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatKsh(job.price)} · {formatRelative(job.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="ml-4 shrink-0 font-mono text-xs"
                  onClick={() => acceptDelivery(job.id)}
                  disabled={!!active || acceptingId === job.id}
                  title={
                    active ? "Finish your active delivery first" : undefined
                  }
                >
                  {acceptingId === job.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Accept"
                  )}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            Recent deliveries
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Your completed jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="border border-dashed border-border px-6 py-10 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                Completed deliveries will show up here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 font-mono text-xs">ID</TableHead>
                  <TableHead className="font-mono text-xs">Drop-off</TableHead>
                  <TableHead className="font-mono text-xs">Status</TableHead>
                  <TableHead className="pr-6 text-right font-mono text-xs">
                    Earned
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, 5).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                      #{d.id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.dropoffAddress}
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
