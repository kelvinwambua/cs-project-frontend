"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  MapPin,
  Phone,
  User,
  Package,
  Ban,
  MoreHorizontal,
  ArrowRight,
  Loader2,
  RefreshCw,
  PackageSearch,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { Delivery, DeliveryStatus, deliveriesApi } from "@/lib/api"

function resolveLocation(
  neighborhood: string | null,
  city: string | null,
  address: string
): string {
  if (neighborhood) return neighborhood
  if (city) return city
  return address.length > 22 ? `${address.slice(0, 22)}…` : address
}

const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    className: string
  }
> = {
  awaiting_payment: {
    label: "Awaiting payment",
    variant: "outline",
    className:
      "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  },
  pending: {
    label: "Pending",
    variant: "outline",
    className:
      "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
  },
  accepted: {
    label: "Accepted",
    variant: "outline",
    className:
      "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  },
  picked_up: {
    label: "Picked Up",
    variant: "outline",
    className:
      "border-violet-400 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400",
  },
  delivered: {
    label: "Delivered",
    variant: "outline",
    className:
      "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    className:
      "border-red-400 text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
  },
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

function RouteCell({ delivery }: { delivery: Delivery }) {
  const from = resolveLocation(
    delivery.pickupNeighborhood,
    delivery.pickupCity,
    delivery.pickupAddress
  )
  const to = resolveLocation(
    delivery.dropoffNeighborhood,
    delivery.dropoffCity,
    delivery.dropoffAddress
  )
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="max-w-[90px] truncate text-muted-foreground">
        {from}
      </span>
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
      <span className="max-w-[90px] truncate font-medium">{to}</span>
    </div>
  )
}

function DeliverySheet({
  delivery,
  open,
  onOpenChange,
  onCancel,
  cancelling,
}: {
  delivery: Delivery | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onCancel: (id: string) => void
  cancelling: boolean
}) {
  if (!delivery) return null

  const pickup = {
    label: resolveLocation(
      delivery.pickupNeighborhood,
      delivery.pickupCity,
      delivery.pickupAddress
    ),
    full: delivery.pickupAddress,
  }
  const dropoff = {
    label: resolveLocation(
      delivery.dropoffNeighborhood,
      delivery.dropoffCity,
      delivery.dropoffAddress
    ),
    full: delivery.dropoffAddress,
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Delivery details
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {delivery.id}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={delivery.status} />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(delivery.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Recipient
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm leading-none font-medium">
                  {delivery.recipientName}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {delivery.recipientPhone}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Route
            </p>
            <div className="relative space-y-4 pl-6">
              <div className="absolute top-2 bottom-2 left-2 w-px bg-border" />
              <div className="relative">
                <div className="absolute top-1 -left-[18px] h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium">{pickup.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pickup.full}
                </p>
              </div>
              <div className="relative">
                <div className="absolute top-1 -left-[18px] h-2 w-2 rounded-full bg-red-500" />
                <p className="text-sm font-medium">{dropoff.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dropoff.full}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-sm font-semibold">
                {delivery.distanceKm.toFixed(1)} km
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="text-sm font-semibold">
                {Math.round(delivery.estimatedMinutes)} min
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-semibold">KES {delivery.price}</p>
            </div>
          </div>

          {delivery.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Notes
                </p>
                <p className="text-sm text-muted-foreground">
                  {delivery.notes}
                </p>
              </div>
            </>
          )}

          {(delivery.status === "pending" ||
            delivery.status === "awaiting_payment") && (
            <>
              <Separator />
              <Button
                variant="destructive"
                className="w-full"
                disabled={cancelling}
                onClick={() => onCancel(delivery.id)}
              >
                {cancelling ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Cancel delivery
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function DeliveriesTable() {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">(
    "all"
  )
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["deliveries"],
    queryFn: deliveriesApi.list,
  })

  const { mutate: cancelDelivery, isPending: cancelling } = useMutation({
    mutationFn: deliveriesApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] })
      setCancelTarget(null)
      setSheetOpen(false)
      toast.success("Delivery cancelled")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (d) => statusFilter === "all" || d.status === statusFilter
      ),
    [data, statusFilter]
  )

  const columns = useMemo<ColumnDef<Delivery>[]>(
    () => [
      {
        accessorKey: "recipientName",
        header: "Recipient",
        cell: ({ row }) => (
          <div className="min-w-[130px] space-y-0.5">
            <p className="text-sm leading-none font-medium">
              {row.original.recipientName}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-2.5 w-2.5" />
              {row.original.recipientPhone}
            </p>
          </div>
        ),
      },
      {
        id: "route",
        header: "Route",
        cell: ({ row }) => <RouteCell delivery={row.original} />,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-semibold tabular-nums">
            KES {row.original.price}
          </span>
        ),
        sortingFn: (a, b) =>
          parseFloat(a.original.price) - parseFloat(b.original.price),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.createdAt), {
              addSuffix: true,
            })}
          </span>
        ),
        sortingFn: (a, b) =>
          new Date(a.original.createdAt).getTime() -
          new Date(b.original.createdAt).getTime(),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const d = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedDelivery(d)
                    setSheetOpen(true)
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                {(d.status === "pending" ||
                  d.status === "awaiting_payment") && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setCancelTarget(d.id)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [setSelectedDelivery, setSheetOpen, setCancelTarget]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search recipient…"
            value={
              (table.getColumn("recipientName")?.getFilterValue() as string) ??
              ""
            }
            onChange={(e) =>
              table.getColumn("recipientName")?.setFilterValue(e.target.value)
            }
            className="h-9 max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as DeliveryStatus | "all")}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="picked_up">Picked up</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id === "recipientName" ? "Recipient" : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 text-xs font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-6">
                  <TableSkeleton />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    Failed to load deliveries.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refetch()}
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center"
                >
                  <PackageSearch className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium">No deliveries found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {statusFilter !== "all"
                      ? "Try a different status filter."
                      : "Create your first delivery to get started."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedDelivery(row.original)
                    setSheetOpen(true)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3"
                      onClick={
                        cell.column.id === "actions"
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filtered.length} {filtered.length === 1 ? "delivery" : "deliveries"}
          {statusFilter !== "all" &&
            ` · ${STATUS_CONFIG[statusFilter].label.toLowerCase()}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8"
          >
            Previous
          </Button>
          <span className="px-3 text-xs">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8"
          >
            Next
          </Button>
        </div>
      </div>

      <DeliverySheet
        delivery={selectedDelivery}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCancel={(id) => setCancelTarget(id)}
        cancelling={cancelling}
      />

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              The delivery will be removed from the queue. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
              onClick={() => cancelTarget && cancelDelivery(cancelTarget)}
              disabled={cancelling}
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
