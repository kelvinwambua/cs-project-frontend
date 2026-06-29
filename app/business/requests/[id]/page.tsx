import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
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
} from "lucide-react"

const STATUS_STYLES: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline"
    label: string
  }
> = {
  pending: { variant: "secondary", label: "Waiting for driver" },
  accepted: { variant: "default", label: "Driver assigned" },
  picked_up: { variant: "default", label: "Package picked up" },
  delivered: { variant: "outline", label: "Delivered" },
  cancelled: { variant: "destructive", label: "Cancelled" },
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

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1 pb-1">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm font-medium">{address}</span>
        {(typeLabel || building || neighborhood || city) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {TypeIcon && typeLabel && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <TypeIcon className="h-3 w-3" />
                {typeLabel}
              </span>
            )}
            {building && (
              <span className="text-xs text-muted-foreground">{building}</span>
            )}
            {neighborhood && (
              <span className="text-xs text-muted-foreground">
                {neighborhood}
              </span>
            )}
            {city && (
              <span className="text-xs text-muted-foreground">{city}</span>
            )}
          </div>
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

  const status = STATUS_STYLES[delivery.status] ?? STATUS_STYLES.pending

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-xl px-4 py-4">
          <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2">
            <Link href="/business/requests">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              All deliveries
            </Link>
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {delivery.recipientName}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {delivery.recipientPhone}
              </p>
            </div>
            <Badge variant={status.variant} className="mt-1 shrink-0">
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-6">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Recipient
            </h2>
          </div>
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{delivery.recipientName}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {delivery.recipientPhone}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
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
            <div className="ml-4 flex items-center gap-3">
              <div className="ml-0.5 w-px self-stretch bg-border" />
            </div>
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

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid grid-cols-3 divide-x">
            <div className="flex flex-col items-center gap-1.5 py-5">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold tracking-tight">
                {Number(delivery.distanceKm).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">km</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 py-5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold tracking-tight">
                ~{Math.round(delivery.estimatedMinutes)}
              </span>
              <span className="text-xs text-muted-foreground">min</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 py-5">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold tracking-tight">
                {delivery.price}
              </span>
              <span className="text-xs text-muted-foreground">KES</span>
            </div>
          </div>
        </div>

        {delivery.notes && (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Notes
              </h2>
            </div>
            <div className="flex items-start gap-3 p-5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm">{delivery.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
