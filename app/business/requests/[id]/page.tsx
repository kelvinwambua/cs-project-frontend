import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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
  pending: "Waiting for driver",
  accepted: "Driver assigned",
  picked_up: "Package picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

async function getDelivery(id: string, cookieHeader: string) {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/deliveries/${id}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }
  )
  if (res.status === 404) return null
  if (!res.ok) return undefined
  return res.json()
}

export default async function BusinessRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const delivery = await getDelivery(id, cookieHeader)

  if (delivery === undefined) redirect("/login")
  if (delivery === null) notFound()

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/business/requests">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Delivery to {delivery.recipientName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {delivery.recipientPhone}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[delivery.status]}>
            {STATUS_LABEL[delivery.status]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Route</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Pickup
              </p>
              <p className="text-sm">{delivery.pickupAddress}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Dropoff
              </p>
              <p className="text-sm">{delivery.dropoffAddress}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Distance
              </p>
              <p className="text-sm font-semibold">
                {Number(delivery.distanceKm).toFixed(1)} km
              </p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Est. Time
              </p>
              <p className="text-sm font-semibold">
                ~{Math.round(delivery.estimatedMinutes)} min
              </p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Price
              </p>
              <p className="text-sm font-semibold">KES {delivery.price}</p>
            </div>
          </CardContent>
        </Card>

        {delivery.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{delivery.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
