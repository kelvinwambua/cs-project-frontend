"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Banknote,
  CheckCircle2,
  Loader2,
  Package,
  Pencil,
  Percent,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { analyticsApi, payoutsApi, BankOption, DeliveryStatus } from "@/lib/api"

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; className: string }
> = {
  awaiting_payment: {
    label: "Awaiting payment",
    className:
      "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  },
  pending: {
    label: "Pending",
    className:
      "border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
  },
  accepted: {
    label: "Accepted",
    className:
      "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  },
  picked_up: {
    label: "Picked up",
    className:
      "border-violet-400 text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400",
  },
  delivered: {
    label: "Delivered",
    className:
      "border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
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

function maskAccountNumber(num: string) {
  if (num.length <= 4) return num
  const visible = 4
  const masked = "•".repeat(Math.max(num.length - visible - 2, 3))
  return `${num.slice(0, 2)}${masked}${num.slice(-visible)}`
}

function formatPeriod(
  period: string,
  granularity: "daily" | "weekly" | "monthly"
) {
  const date = new Date(period)
  if (granularity === "monthly") return format(date, "MMM yyyy")
  return format(date, "MMM d")
}

const chartConfig = {
  earnings: {
    label: "Earnings (KES)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface PayoutFormState {
  bankCode: string
  bankName: string
  accountNumber: string
  resolvedName: string | null
  verified: boolean
}

const EMPTY_FORM: PayoutFormState = {
  bankCode: "",
  bankName: "",
  accountNumber: "",
  resolvedName: null,
  verified: false,
}

export default function DriverEarningsPage() {
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<PayoutFormState>(EMPTY_FORM)

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["payout-account"],
    queryFn: payoutsApi.getBankAccount,
  })

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["driver-overview"],
    queryFn: analyticsApi.driverOverview,
  })

  const { data: volume, isLoading: volumeLoading } = useQuery({
    queryKey: ["driver-volume", period],
    queryFn: () => analyticsApi.driverVolume(period),
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["driver-history"],
    queryFn: () => analyticsApi.driverHistory({ limit: 10 }),
  })

  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: payoutsApi.listBanks,
    enabled: dialogOpen,
  })

  const { mutate: verifyAccount, isPending: verifying } = useMutation({
    mutationFn: payoutsApi.verifyAccount,
    onSuccess: (data) => {
      setForm((f) => ({ ...f, resolvedName: data.accountName, verified: true }))
    },
    onError: (err: Error) => {
      setForm((f) => ({ ...f, resolvedName: null, verified: false }))
      toast.error(err.message)
    },
  })

  const { mutate: saveAccount, isPending: saving } = useMutation({
    mutationFn: payoutsApi.saveBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-account"] })
      setDialogOpen(false)
      toast.success("Payout account saved")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  useEffect(() => {
    if (!dialogOpen) return
    if (account) {
      setForm({
        bankCode: account.bankCode,
        bankName: account.bankName ?? "",
        accountNumber: account.accountNumber,
        resolvedName: null,
        verified: false,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [dialogOpen, account])

  const isEditing = !!account

  const chartData = useMemo(
    () =>
      (volume ?? []).map((v) => ({
        period: formatPeriod(v.period, period),
        earnings: Number(v.earnings),
      })),
    [volume, period]
  )

  const canSave =
    form.verified && form.bankCode && form.accountNumber.length >= 6 && !saving

  function handleAccountNumberChange(value: string) {
    setForm((f) => ({
      ...f,
      accountNumber: value,
      resolvedName: null,
      verified: false,
    }))
  }

  function handleBankChange(code: string) {
    const bank = banks?.find((b) => b.code === code)
    setForm((f) => ({
      ...f,
      bankCode: code,
      bankName: bank?.name ?? "",
      resolvedName: null,
      verified: false,
    }))
  }

  function handleVerify() {
    if (!form.bankCode || form.accountNumber.length < 6) return
    verifyAccount({
      accountNumber: form.accountNumber,
      bankCode: form.bankCode,
    })
  }

  function handleSave() {
    if (!canSave || !form.resolvedName) return
    saveAccount({
      accountNumber: form.accountNumber,
      bankCode: form.bankCode,
      bankName: form.bankName,
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
          <p className="text-sm text-muted-foreground">
            Track your delivery earnings and manage your payout account.
          </p>
        </div>
      </div>

      {accountLoading ? (
        <Skeleton className="h-28 w-full rounded-lg" />
      ) : account ? (
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <Banknote className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{account.accountName}</p>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {account.bankName ?? "Bank"} ·{" "}
                  {maskAccountNumber(account.accountNumber)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No payout account yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your bank details so we know where to send your earnings.
              </p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Add payout details
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Wallet className="h-3.5 w-3.5" />
              Net earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-xl font-semibold tabular-nums">
                KES {overview?.totalEarnings}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Percent className="h-3.5 w-3.5" />
              Platform fee
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <p className="text-xl font-semibold tabular-nums">
                KES {overview?.platformFee}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5" />
              Delivered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-xl font-semibold tabular-nums">
                {overview?.delivered}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Completion rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-xl font-semibold tabular-nums">
                {overview?.completionRate}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Earnings over time</CardTitle>
            <CardDescription>
              Net of the{" "}
              {((overview?.platformCommissionRate ?? 0.2) * 100).toFixed(0)}%
              platform fee
            </CardDescription>
          </div>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as typeof period)}
          >
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {volumeLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No earnings data yet.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="earnings"
                  fill="var(--color-earnings)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent deliveries</CardTitle>
          <CardDescription>Your last 10 deliveries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3} className="py-3">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : history && history.data.length > 0 ? (
                history.data.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm">{d.recipientName}</TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      KES {d.price}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No deliveries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit payout account" : "Add payout account"}
            </DialogTitle>
            <DialogDescription>
              We verify your account details before saving them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select value={form.bankCode} onValueChange={handleBankChange}>
                <SelectTrigger id="bank">
                  <SelectValue
                    placeholder={
                      banksLoading ? "Loading banks…" : "Select a bank"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {banksLoading ? (
                    <div className="space-y-1 p-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    (banks ?? []).map((b: BankOption) => (
                      <SelectItem key={b.code} value={b.code}>
                        {b.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account number</Label>
              <Input
                id="accountNumber"
                value={form.accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="e.g. 0123456789"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={
                !form.bankCode || form.accountNumber.length < 6 || verifying
              }
              onClick={handleVerify}
            >
              {verifying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Verify account
            </Button>

            {form.verified && form.resolvedName && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">
                    {form.resolvedName}
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80">
                    Account verified
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!canSave} onClick={handleSave}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save payout account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
