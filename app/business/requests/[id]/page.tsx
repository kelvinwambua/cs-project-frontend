import { redirect } from "next/navigation"
import Link from "next/link"
import { cookies } from "next/headers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Package,
  Plus,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  CreditCard,
} from "lucide-react"

const STATUS_CONFIG: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline"
    label: string
  }
> = {
  awaiting_payment: { variant: "secondary", label: "Awaiting payment" },
  pending: { variant: "secondary", label: "Pending" },
  accepted: { variant: "default", label: "Accepted" },
  picked_up: { variant: "default", label: "Picked up" },
  delivered: { variant: "outline", label: "Delivered" },
  cancelled: { variant: "destructive", label: "Cancelled" },
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  awaiting_payment: <CreditCard className="h-3.5 w-3.5" />,
  pending: <Loader2 className="h-3.5 w-3.5" />,
  accepted: <Truck className="h-3.5 w-3.5" />,
  picked_up: <Truck className="h-3.5 w-3.5" />,
  delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <XCircle className="h-3.5 w-3.5" />,
}

async function getDeliveries(cookieHeader: string) {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/deliveries`,
    { headers: { cookie: cookieHeader }, cache: "no-store" }
  )
  if (!res.ok) return null
  return res.json()
}

async function cancelDelivery(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/deliveries/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({ action: "cancel" }),
    }
  )
  redirect("/business/requests")
}

export default async function BusinessRequestsPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const deliveries = await getDeliveries(cookieHeader)

  if (deliveries === null) redirect("/login")

  const pending = deliveries.filter(
    (d: any) => d.status === "pending" || d.status === "awaiting_payment"
  ).length
  const active = deliveries.filter(
    (d: any) => d.status === "accepted" || d.status === "picked_up"
  ).length
  const delivered = deliveries.filter(
    (d: any) => d.status === "delivered"
  ).length

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Deliveries
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage and track all your delivery requests
              </p>
            </div>
            <Button asChild>
              <Link href="/business/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                New delivery
              </Link>
            </Button>
          </div>

          {deliveries.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Pending
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums">
                  {pending}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  In transit
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums">
                  {active}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Delivered
                </p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums">
                  {delivered}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-6">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold">No deliveries yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Create your first delivery and a nearby driver will be assigned
              automatically.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/business/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                New delivery
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">Recipient</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">ETA</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d: any) => {
                  const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending
                  const locationSummary = [d.dropoffNeighborhood, d.dropoffCity]
                    .filter(Boolean)
                    .join(", ")

                  return (
                    <TableRow key={d.id} className="group">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {d.recipientName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {d.recipientPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[220px] truncate text-sm">
                          {locationSummary || d.dropoffAddress}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {Number(d.distanceKm).toFixed(1)} km
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        ~{Math.round(d.estimatedMinutes)} min
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        KES {d.price}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cfg.variant} className="gap-1.5">
                          {STATUS_ICON[d.status]}
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {(d.status === "pending" ||
                            d.status === "awaiting_payment") && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Cancel this delivery?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    The delivery for{" "}
                                    <span className="font-medium text-foreground">
                                      {d.recipientName}
                                    </span>{" "}
                                    will be cancelled. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                                  <form action={cancelDelivery}>
                                    <input
                                      type="hidden"
                                      name="id"
                                      value={d.id}
                                    />
                                    <AlertDialogAction
                                      type="submit"
                                      className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                                    >
                                      Cancel delivery
                                    </AlertDialogAction>
                                  </form>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                            asChild
                          >
                            <Link href={`/business/requests/${d.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
