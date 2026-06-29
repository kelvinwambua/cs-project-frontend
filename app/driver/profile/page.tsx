"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  XCircle,
  Banknote,
  Navigation,
  Loader2,
  Pencil,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000"
const AUTH_BASE = `${API_ROOT}/api/auth`
const DELIVERIES_BASE = `${API_ROOT}/api/deliveries`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionUser {
  id: string
  name: string
  email: string
  image?: string | null
  role: "driver" | "business"
  createdAt: string
}

type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "cancelled"

interface Delivery {
  id: string
  distanceKm: number
  price: string
  status: DeliveryStatus
  createdAt: string
  updatedAt: string
}

function formatKsh(value: number) {
  return `Ksh ${Math.round(value)}`
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default function DriverProfilePage() {
  const { data: session, isPending } = authClient.useSession()

  const user = session?.user
  const [history, setHistory] = useState<Delivery[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [historyRes] = await Promise.all([
        fetch(`${DELIVERIES_BASE}/history`, { credentials: "include" }),
      ])

      if (!historyRes.ok) throw new Error("Could not load delivery history.")
      setHistory(await historyRes.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveName() {
    if (!nameInput.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`${API_ROOT}/api/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Could not update your name.")
      }
      const updated = await res.json()

      setEditing(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not update your name."
      )
    } finally {
      setSaving(false)
    }
  }

  const delivered = history.filter((d) => d.status === "delivered")
  const cancelled = history.filter((d) => d.status === "cancelled")
  const totalEarnings = delivered.reduce(
    (sum, d) => sum + parseFloat(d.price),
    0
  )
  const totalDistance = delivered.reduce((sum, d) => sum + d.distanceKm, 0)

  const stats = [
    {
      label: "Deliveries completed",
      value: String(delivered.length),
      icon: CheckCircle2,
    },
    { label: "Cancelled", value: String(cancelled.length), icon: XCircle },
    {
      label: "Total earnings",
      value: formatKsh(totalEarnings),
      icon: Banknote,
    },
    {
      label: "Distance covered",
      value: `${totalDistance.toFixed(1)} km`,
      icon: Navigation,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="border border-dashed border-border px-6 py-10 text-center">
        <p className="font-mono text-sm text-destructive">
          {error ?? "Could not load your profile."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Your account and delivery record
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="font-display flex h-16 w-16 shrink-0 items-center justify-center border border-border bg-secondary/40 text-xl font-semibold">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-16 w-16 object-cover"
                />
              ) : (
                initials(user.name)
              )}
            </div>

            <div className="space-y-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 font-sans text-sm"
                  />
                  <Button
                    size="sm"
                    className="font-mono text-xs"
                    onClick={saveName}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="font-mono text-xs"
                    onClick={() => {
                      setEditing(false)
                      setNameInput(user.name)
                      setSaveError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    {user.name}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Edit name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="font-mono text-xs text-muted-foreground">
                {user.email}
              </p>
              {saveError && (
                <p className="font-mono text-xs text-destructive">
                  {saveError}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs uppercase">
              {user.role}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-KE", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
