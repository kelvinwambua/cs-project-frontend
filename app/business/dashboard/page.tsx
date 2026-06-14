import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  PackagePlus,
  Clock,
  CheckCircle2,
  Truck,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    label: "Active deliveries",
    value: "4",
    icon: Truck,
    delta: "+1 from yesterday",
  },
  {
    label: "Completed today",
    value: "12",
    icon: CheckCircle2,
    delta: "+3 from yesterday",
  },
  {
    label: "Pending dispatch",
    value: "2",
    icon: Clock,
    delta: "Awaiting driver",
  },
  {
    label: "This month",
    value: "89",
    icon: TrendingUp,
    delta: "+14% vs last month",
  },
]

const recentRequests = [
  {
    id: "REQ-001",
    pickup: "Westlands, Nairobi",
    dropoff: "Kilimani, Nairobi",
    status: "in_transit",
    driver: "James M.",
    time: "14 min ago",
  },
  {
    id: "REQ-002",
    pickup: "CBD, Nairobi",
    dropoff: "South B, Nairobi",
    status: "pending",
    driver: "—",
    time: "32 min ago",
  },
  {
    id: "REQ-003",
    pickup: "Eastleigh, Nairobi",
    dropoff: "Kasarani, Nairobi",
    status: "delivered",
    driver: "Peter K.",
    time: "1 hr ago",
  },
  {
    id: "REQ-004",
    pickup: "Gigiri, Nairobi",
    dropoff: "Karen, Nairobi",
    status: "accepted",
    driver: "David O.",
    time: "2 hr ago",
  },
]

const statusConfig: Record<
  string,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  accepted: { label: "Accepted", variant: "secondary" },
  in_transit: { label: "In Transit", variant: "default" },
  delivered: { label: "Delivered", variant: "secondary" },
}

export default function BusinessDashboardPage() {
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
                {stat.value}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {stat.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base">
                Recent requests
              </CardTitle>
              <CardDescription className="mt-1 font-mono text-xs">
                Latest delivery activity
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/business/requests" className="font-mono text-xs">
                View all
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 font-mono text-xs">ID</TableHead>
                <TableHead className="font-mono text-xs">Pickup</TableHead>
                <TableHead className="font-mono text-xs">Drop-off</TableHead>
                <TableHead className="font-mono text-xs">Driver</TableHead>
                <TableHead className="font-mono text-xs">Status</TableHead>
                <TableHead className="pr-6 text-right font-mono text-xs">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                    {req.id}
                  </TableCell>
                  <TableCell className="text-sm">{req.pickup}</TableCell>
                  <TableCell className="text-sm">{req.dropoff}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {req.driver}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig[req.status].variant}
                      className="font-mono text-xs"
                    >
                      {statusConfig[req.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-mono text-xs text-muted-foreground">
                    {req.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
