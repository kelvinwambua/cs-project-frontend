"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlacesInput, type PlaceValue } from "@/components/places-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  User,
  Phone,
  MapPin,
  Navigation,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Package,
  Clock,
  Ruler,
} from "lucide-react"

const emptyPlace: PlaceValue = { address: "", placeId: "", lat: 0, lng: 0 }

interface Props {
  savedProfile: {
    address: string
    placeId: string
    lat: number
    lng: number
  } | null
}

const STEPS = [
  {
    id: 1,
    title: "Recipient",
    description: "Who receives this delivery?",
    icon: User,
  },
  {
    id: 2,
    title: "Pickup",
    description: "Where are we collecting from?",
    icon: Navigation,
  },
  {
    id: 3,
    title: "Dropoff",
    description: "Where are we delivering to?",
    icon: MapPin,
  },
  { id: 4, title: "Notes", description: "Any extra details?", icon: FileText },
]

function StepIndicator({
  current,
  steps,
}: {
  current: number
  steps: typeof STEPS
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = current > step.id
        const active = current === step.id
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-background text-primary",
                  !done &&
                    !active &&
                    "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : done
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {i !== steps.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-0.5 w-12 transition-all duration-500",
                  current > step.id ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

export default function NewRequestForm({ savedProfile }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [pickup, setPickup] = useState<PlaceValue>(
    savedProfile
      ? {
          address: savedProfile.address,
          placeId: savedProfile.placeId,
          lat: savedProfile.lat,
          lng: savedProfile.lng,
        }
      : emptyPlace
  )
  const [dropoff, setDropoff] = useState<PlaceValue>(emptyPlace)
  const [preview, setPreview] = useState<{
    distanceKm: number
    estimatedMinutes: number
    price: string
  } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const clearError = (key: string) =>
    setErrors((e) => {
      const n = { ...e }
      delete n[key]
      return n
    })

  const validateStep = () => {
    const errs: Record<string, string> = {}
    if (step === 1) {
      if (!recipientName.trim()) errs.recipientName = "Name is required"
      if (!recipientPhone.trim()) errs.recipientPhone = "Phone is required"
    }
    if (step === 2 && !pickup.placeId)
      errs.pickup = "Select a valid pickup address"
    if (step === 3 && !dropoff.placeId)
      errs.dropoff = "Select a valid dropoff address"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const fetchPreview = async () => {
    if (!pickup.placeId || !dropoff.placeId) return
    setPreviewLoading(true)
    try {
      const data = await apiFetch("/api/deliveries/preview", {
        method: "POST",
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
        }),
      })
      setPreview(data)
    } finally {
      setPreviewLoading(false)
    }
  }

  const next = async () => {
    if (!validateStep()) return
    if (step === 3) await fetchPreview()
    setStep((s) => s + 1)
  }

  const back = () => {
    setErrors({})
    setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await apiFetch("/api/deliveries", {
        method: "POST",
        body: JSON.stringify({
          recipientName,
          recipientPhone,
          pickupAddress: pickup.address,
          pickupPlaceId: pickup.placeId,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffAddress: dropoff.address,
          dropoffPlaceId: dropoff.placeId,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          notes: notes || undefined,
        }),
      })
      router.push(`/business/requests/${result.id}`)
    } catch (err: any) {
      setErrors({ submit: err.message })
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">New Delivery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {STEPS[step - 1].description}
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <StepIndicator current={step} steps={STEPS} />
        </div>

        <div className="rounded-2xl border bg-background shadow-sm">
          {step === 1 && (
            <div className="flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={recipientName}
                    onChange={(e) => {
                      setRecipientName(e.target.value)
                      clearError("recipientName")
                    }}
                    placeholder="John Doe"
                    className={cn(
                      "h-12 pl-10",
                      errors.recipientName && "border-destructive"
                    )}
                  />
                </div>
                <FieldError message={errors.recipientName} />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={recipientPhone}
                    onChange={(e) => {
                      setRecipientPhone(e.target.value)
                      clearError("recipientPhone")
                    }}
                    placeholder="+254700000000"
                    className={cn(
                      "h-12 pl-10",
                      errors.recipientPhone && "border-destructive"
                    )}
                  />
                </div>
                <FieldError message={errors.recipientPhone} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5 p-6">
              <PlacesInput
                label="Pickup Address"
                value={pickup}
                onChange={(val) => {
                  setPickup(val)
                  clearError("pickup")
                }}
                placeholder="Search pickup location..."
                error={errors.pickup}
              />
              {savedProfile && pickup.placeId !== savedProfile.placeId && (
                <button
                  type="button"
                  onClick={() =>
                    setPickup({
                      address: savedProfile.address,
                      placeId: savedProfile.placeId,
                      lat: savedProfile.lat,
                      lng: savedProfile.lng,
                    })
                  }
                  className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-xs font-medium">
                      Use last pickup location
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {savedProfile.address}
                    </span>
                  </div>
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5 p-6">
              <PlacesInput
                label="Dropoff Address"
                value={dropoff}
                onChange={(val) => {
                  setDropoff(val)
                  clearError("dropoff")
                }}
                placeholder="Search delivery location..."
                error={errors.dropoff}
              />
              {pickup.address && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Picking up from
                  </p>
                  <div className="flex items-center gap-2">
                    <Navigation className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm">{pickup.address}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Additional Notes{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fragile package, call on arrival, leave at door..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Order Summary</p>
                <div className="divide-y rounded-xl border bg-muted/30">
                  <div className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs text-muted-foreground">
                        Recipient
                      </span>
                      <span className="truncate text-sm font-medium">
                        {recipientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {recipientPhone}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                      <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs text-muted-foreground">
                        Pickup
                      </span>
                      <span className="truncate text-sm">{pickup.address}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-xs text-muted-foreground">
                        Dropoff
                      </span>
                      <span className="truncate text-sm">
                        {dropoff.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {previewLoading && (
                <div className="flex items-center justify-center gap-2 rounded-xl border p-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Calculating route...
                  </span>
                </div>
              )}

              {preview && !previewLoading && (
                <div className="overflow-hidden rounded-xl border">
                  <div className="border-b bg-primary/5 px-4 py-2.5">
                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                      Route Details
                    </p>
                  </div>
                  <div className="grid grid-cols-3 divide-x">
                    <div className="flex flex-col items-center gap-1 p-4">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-bold">
                        {Number(preview.distanceKm).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">km</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-bold">
                        {Math.round(preview.estimatedMinutes)}
                      </span>
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-4">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-lg font-bold">{preview.price}</span>
                      <span className="text-xs text-muted-foreground">KES</span>
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <p className="text-center text-sm text-destructive">
                  {errors.submit}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t p-4">
            {step > 1 ? (
              <Button variant="outline" onClick={back} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button onClick={next} className="ml-auto gap-2">
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting || previewLoading}
                className="ml-auto gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm Delivery
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
