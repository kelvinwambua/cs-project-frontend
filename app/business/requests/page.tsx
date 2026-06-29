import { redirect } from "next/navigation"
import Link from "next/link"
import { cookies } from "next/headers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Plus, MapPin, Clock, Ruler } from "lucide-react"

const STATUS_STYLES: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  pending: { variant: "secondary", dot: "bg-muted-foreground" },
  accepted: { variant: "default", dot: "bg-foreground" },
  picked_up: { variant: "default", dot: "bg-foreground" },
  delivered: { variant: "outline", dot: "bg-muted-foreground" },
  cancelled: { variant: "destructive", dot: "bg-destructive-foreground" },
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

async function getDeliveries(cookieHeader: string) {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/deliveries`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function BusinessRequestsPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const deliveries = await getDeliveries(cookieHeader)

  if (deliveries === null) redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {deliveries.length === 0
                  ? "No deliveries yet"
                  : `${deliveries.length} order${deliveries.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Button asChild className="h-10 gap-2">
              <Link href="/business/requests/new">
                <Plus className="h-4 w-4" />
                New delivery
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold">No deliveries yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Create your first delivery request and a driver will be assigned
              to you.
            </p>
            <Button className="mt-6 gap-2" asChild>
              <Link href="/business/requests/new">
                <Plus className="h-4 w-4" />
                New delivery
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
            {deliveries.map((d: any) => {
              const style = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending
              const locationSummary = [
                d.dropoffBuilding,
                d.dropoffNeighborhood,
                d.dropoffCity,
              ]
                .filter(Boolean)
                .join(", ")

              return (
                <Link
                  key={d.id}
                  href={`/business/requests/${d.id}`}
                  className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm leading-none font-semibold">
                        {d.recipientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {locationSummary || d.dropoffAddress}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Ruler className="h-3 w-3" />
                        {Number(d.distanceKm).toFixed(1)} km
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />~
                        {Math.round(d.estimatedMinutes)} min
                      </span>
                      <span className="h-3 w-px bg-border" />
                      <span className="text-xs font-semibold">
                        KES {d.price}
                      </span>
                    </div>
                  </div>
                  <Badge variant={style.variant} className="mt-0.5 shrink-0">
                    {STATUS_LABEL[d.status]}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
