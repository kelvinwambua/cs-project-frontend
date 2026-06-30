"use client"

import * as React from "react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PackagePlus,
  Clock,
  CheckCircle2,
  Truck,
  TrendingUp,
  XCircle,
  Banknote,
  Route,
} from "lucide-react"
import {
  analyticsApi,
  type BusinessOverview,
  type VolumePoint,
  type Delivery,
  type DeliveryStatus,
} from "@/lib/api"

const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  awaiting_payment: { label: "Awaiting payment", variant: "outline" },
  pending: { label: "Pending", variant: "outline" },
  accepted: { label: "Accepted", variant: "secondary" },
  picked_up: { label: "In Transit", variant: "default" },
  delivered: { label: "Delivered", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const

type Period = "daily" | "weekly" | "monthly"

function formatPeriodLabel(period: string, granularity: Period): string {
  try {
    const date = parseISO(period)
    if (granularity === "monthly") return format(date, "MMM yyyy")
    if (granularity === "weekly") return format(date, "dd MMM")
    return format(date, "dd MMM")
  } catch {
    return period
  }
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="font-mono text-xs">{label}</CardDescription>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold">{value}</div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

const PAGE_SIZE = 10

export default function BusinessDashboardPage() {
  const [overview, setOverview] = React.useState<BusinessOverview | null>(null)
  const [volume, setVolume] = React.useState<VolumePoint[]>([])
  const [history, setHistory] = React.useState<Delivery[]>([])
  const [historyTotal, setHistoryTotal] = React.useState(0)
  const [historyOffset, setHistoryOffset] = React.useState(0)
  const [historyStatus, setHistoryStatus] = React.useState<
    DeliveryStatus | "all"
  >("all")
  const [period, setPeriod] = React.useState<Period>("daily")
  const [loading, setLoading] = React.useState(true)
  const [volumeLoading, setVolumeLoading] = React.useState(false)
  const [historyLoading, setHistoryLoading] = React.useState(false)

  React.useEffect(() => {
    async function loadInitial() {
      setLoading(true)
      try {
        const [ov, vol, hist] = await Promise.all([
          analyticsApi.businessOverview(),
          analyticsApi.businessVolume("daily"),
          analyticsApi.businessHistory({ limit: PAGE_SIZE, offset: 0 }),
        ])
        setOverview(ov)
        setVolume(vol)
        setHistory(hist.data)
        setHistoryTotal(hist.total)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  React.useEffect(() => {
    async function loadVolume() {
      setVolumeLoading(true)
      try {
        const vol = await analyticsApi.businessVolume(period)
        setVolume(vol)
      } finally {
        setVolumeLoading(false)
      }
    }
    loadVolume()
  }, [period])

  React.useEffect(() => {
    async function loadHistory() {
      setHistoryLoading(true)
      try {
        const hist = await analyticsApi.businessHistory({
          limit: PAGE_SIZE,
          offset: historyOffset,
          status: historyStatus === "all" ? undefined : historyStatus,
        })
        setHistory(hist.data)
        setHistoryTotal(hist.total)
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [historyOffset, historyStatus])

  const chartData = volume.map((v) => ({
    ...v,
    name: formatPeriodLabel(v.period, period),
    spend: Number(v.spend),
  }))

  const totalPages = Math.ceil(historyTotal / PAGE_SIZE)
  const currentPage = Math.floor(historyOffset / PAGE_SIZE) + 1

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button asChild>
          <Link href="/business/requests/new">
            <PackagePlus className="mr-2 h-4 w-4" />
            New request
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total orders"
          value={String(overview?.total ?? 0)}
          sub={`${overview?.completionRate ?? "0"}% completion rate`}
          icon={Truck}
        />
        <StatCard
          label="Delivered"
          value={String(overview?.delivered ?? 0)}
          sub={`${overview?.cancelled ?? 0} cancelled`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending"
          value={String(overview?.pending ?? 0)}
          sub="Awaiting driver pickup"
          icon={Clock}
        />
        <StatCard
          label="Total spend"
          value={`KES ${Number(overview?.totalSpend ?? 0).toLocaleString()}`}
          sub={`Avg KES ${Number(overview?.avgOrderValue ?? 0).toLocaleString()} / order`}
          icon={Banknote}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-base">
                  Delivery volume
                </CardTitle>
                <CardDescription className="mt-1 font-mono text-xs">
                  Orders over time
                </CardDescription>
              </div>
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
              >
                <SelectTrigger className="w-28 font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="font-mono text-xs"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <div className="flex h-52 items-center justify-center">
                <p className="font-mono text-xs text-muted-foreground">
                  Loading...
                </p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center">
                <p className="font-mono text-xs text-muted-foreground">
                  No data yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="deliveredGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--chart-2))"
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--chart-2))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 4,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="hsl(var(--primary))"
                    fill="url(#totalGrad)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    name="Delivered"
                    stroke="hsl(var(--chart-2))"
                    fill="url(#deliveredGrad)"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              Spend over time
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              KES per period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <div className="flex h-52 items-center justify-center">
                <p className="font-mono text-xs text-muted-foreground">
                  Loading...
                </p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-52 items-center justify-center">
                <p className="font-mono text-xs text-muted-foreground">
                  No data yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(val: number) => [
                      `KES ${val.toLocaleString()}`,
                      "Spend",
                    ]}
                    contentStyle={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 4,
                    }}
                  />
                  <Bar
                    dataKey="spend"
                    name="Spend"
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base">
                Delivery history
              </CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                {historyTotal} total orders
              </CardDescription>
            </div>
            <Select
              value={historyStatus}
              onValueChange={(v) => {
                setHistoryStatus(v as DeliveryStatus | "all")
                setHistoryOffset(0)
              }}
            >
              <SelectTrigger className="w-40 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-mono text-xs">
                  All statuses
                </SelectItem>
                <SelectItem
                  value="awaiting_payment"
                  className="font-mono text-xs"
                >
                  Awaiting payment
                </SelectItem>
                <SelectItem value="pending" className="font-mono text-xs">
                  Pending
                </SelectItem>
                <SelectItem value="accepted" className="font-mono text-xs">
                  Accepted
                </SelectItem>
                <SelectItem value="picked_up" className="font-mono text-xs">
                  In Transit
                </SelectItem>
                <SelectItem value="delivered" className="font-mono text-xs">
                  Delivered
                </SelectItem>
                <SelectItem value="cancelled" className="font-mono text-xs">
                  Cancelled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="font-mono text-xs text-muted-foreground">
                Loading...
              </p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="font-mono text-xs text-muted-foreground">
                No deliveries found
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 font-mono text-xs">ID</TableHead>
                    <TableHead className="font-mono text-xs">
                      Recipient
                    </TableHead>
                    <TableHead className="font-mono text-xs">Pickup</TableHead>
                    <TableHead className="font-mono text-xs">
                      Drop-off
                    </TableHead>
                    <TableHead className="font-mono text-xs">
                      Distance
                    </TableHead>
                    <TableHead className="font-mono text-xs">Price</TableHead>
                    <TableHead className="font-mono text-xs">Status</TableHead>
                    <TableHead className="pr-6 text-right font-mono text-xs">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((d) => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                        {d.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {d.recipientName}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-sm">
                        {d.pickupNeighborhood ?? d.pickupAddress}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-sm">
                        {d.dropoffNeighborhood ?? d.dropoffAddress}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {Number(d.distanceKm).toFixed(1)} km
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        KES {Number(d.price).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_CONFIG[d.status].variant}
                          className="font-mono text-xs"
                        >
                          {STATUS_CONFIG[d.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right font-mono text-xs text-muted-foreground">
                        {format(parseISO(d.createdAt), "dd MMM, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <p className="font-mono text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    disabled={historyOffset === 0}
                    onClick={() =>
                      setHistoryOffset((p) => Math.max(0, p - PAGE_SIZE))
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    disabled={historyOffset + PAGE_SIZE >= historyTotal}
                    onClick={() => setHistoryOffset((p) => p + PAGE_SIZE)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
