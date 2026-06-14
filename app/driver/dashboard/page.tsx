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
  Star,
  Banknote,
  MapPin,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Deliveries today", value: "6", icon: CheckCircle2 },
  { label: "This week", value: "34", icon: Navigation },
  { label: "Rating", value: "4.9", icon: Star },
  { label: "Earnings today", value: "Ksh 840", icon: Banknote },
]

const availableJobs = [
  {
    id: "REQ-007",
    pickup: "Westlands, Nairobi",
    dropoff: "Kilimani, Nairobi",
    distance: "3.2 km",
    business: "QuickMart Online",
    posted: "2 min ago",
  },
  {
    id: "REQ-009",
    pickup: "CBD, Nairobi",
    dropoff: "South B, Nairobi",
    distance: "5.8 km",
    business: "FreshFarm Deliveries",
    posted: "8 min ago",
  },
  {
    id: "REQ-011",
    pickup: "Upperhill, Nairobi",
    dropoff: "Lavington, Nairobi",
    distance: "4.1 km",
    business: "TechGadgets KE",
    posted: "15 min ago",
  },
]

const recentDeliveries = [
  {
    id: "REQ-006",
    dropoff: "Karen, Nairobi",
    status: "delivered",
    earning: "Ksh 180",
    time: "1 hr ago",
  },
  {
    id: "REQ-005",
    dropoff: "Kasarani, Nairobi",
    status: "delivered",
    earning: "Ksh 220",
    time: "3 hr ago",
  },
  {
    id: "REQ-004",
    dropoff: "Eastleigh, Nairobi",
    status: "delivered",
    earning: "Ksh 140",
    time: "5 hr ago",
  },
]

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Dashboard
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
        <div className="flex items-center gap-3 border border-border px-4 py-2">
          <Switch id="availability" defaultChecked />
          <Label
            htmlFor="availability"
            className="cursor-pointer font-mono text-xs"
          >
            Available
          </Label>
        </div>
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
          {availableJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between border border-border p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {job.id}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ·
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {job.distance}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{job.pickup}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{job.dropoff}</span>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {job.business} · {job.posted}
                </p>
              </div>
              <Button size="sm" className="ml-4 shrink-0 font-mono text-xs">
                Accept
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">
            Recent deliveries
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Your completed jobs today
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
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
              {recentDeliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                    {d.id}
                  </TableCell>
                  <TableCell className="text-sm">{d.dropoff}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      Delivered
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-mono text-xs">
                    {d.earning}
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
