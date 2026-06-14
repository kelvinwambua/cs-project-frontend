import { redirect } from "next/navigation"
import Link from "next/link"
import { cookies } from "next/headers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package, Plus } from "lucide-react"

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  accepted: "default",
  picked_up: "default",
  delivered: "outline",
  cancelled: "destructive",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked Up",
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Delivery Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            {deliveries.length} total
          </p>
        </div>
        <Button asChild>
          <Link href="/business/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>
      {deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No deliveries yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first delivery request to get started.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/business/requests/new">New Request</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {deliveries.map((d: any) => (
            <Link key={d.id} href={`/business/requests/${d.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="truncate font-medium">{d.recipientName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {d.dropoffAddress}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {Number(d.distanceKm).toFixed(1)} km
                        </span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="text-xs text-muted-foreground">
                          ~{Math.round(d.estimatedMinutes)} min
                        </span>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="text-xs font-medium">
                          KES {d.price}
                        </span>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[d.status]}>
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
