"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlacesInput, type PlaceValue } from "@/components/places-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  Clock,
  Ruler,
  Banknote,
  Home,
  Building2,
  Briefcase,
} from "lucide-react"

type LocationType = "house" | "apartment" | "office"

interface ExtendedPlaceValue extends PlaceValue {
  building?: string
  neighborhood?: string
  city?: string
  locationType?: LocationType
  locationNote?: string
}

const emptyPlace: ExtendedPlaceValue = {
  address: "",
  placeId: "",
  lat: 0,
  lng: 0,
}

interface SavedProfile {
  address: string
  placeId: string
  building?: string
  neighborhood?: string
  city?: string
  locationType?: LocationType
  locationNote?: string
  lat: number
  lng: number
}

interface Props {
  savedProfile: SavedProfile | null
}

const STEPS = [
  { id: 1, title: "Recipient", icon: User },
  { id: 2, title: "Pickup", icon: Navigation },
  { id: 3, title: "Dropoff", icon: MapPin },
  { id: 4, title: "Review", icon: FileText },
]

const LOCATION_TYPES: {
  value: LocationType
  label: string
  icon: typeof Home
}[] = [
  { value: "house", label: "House", icon: Home },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "office", label: "Office", icon: Briefcase },
]

function LocationTypeSelector({
  value,
  onChange,
}: {
  value?: LocationType
  onChange: (v: LocationType) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {LOCATION_TYPES.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 transition-all duration-150",
            value === v
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:border-foreground/40"
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex w-full items-center gap-0">
      {STEPS.map((step, i) => {
        const done = current > step.id
        const active = current === step.id
        return (
          <div
            key={step.id}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200",
                  done && "border-foreground bg-foreground text-background",
                  active && "border-foreground bg-background text-foreground",
                  !done &&
                    !active &&
                    "border-muted-foreground/25 text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active || done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 mb-5 h-px flex-1 transition-colors duration-300",
                  current > step.id ? "bg-foreground" : "bg-border"
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

function LocationFields({
  value,
  onChange,
  errors,
  clearError,
  prefix,
}: {
  value: ExtendedPlaceValue
  onChange: (v: ExtendedPlaceValue) => void
  errors: Record<string, string>
  clearError: (k: string) => void
  prefix: string
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">Location type</Label>
        <LocationTypeSelector
          value={value.locationType}
          onChange={(t) => {
            onChange({ ...value, locationType: t })
            clearError(`${prefix}locationType`)
          }}
        />
        <FieldError message={errors[`${prefix}locationType`]} />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Building / Landmark{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          value={value.building ?? ""}
          onChange={(e) => onChange({ ...value, building: e.target.value })}
          placeholder="e.g. Westcom Point, Garden City Mall"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Neighborhood{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={value.neighborhood ?? ""}
            onChange={(e) =>
              onChange({ ...value, neighborhood: e.target.value })
            }
            placeholder="e.g. Westlands"
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            City{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            value={value.city ?? ""}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="e.g. Nairobi"
            className="h-11"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          Access note{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          value={value.locationNote ?? ""}
          onChange={(e) => onChange({ ...value, locationNote: e.target.value })}
          placeholder="e.g. 3rd floor, blue gate, ask for John"
          className="h-11"
        />
      </div>
    </div>
  )
}

function AddressSummary({
  label,
  place,
  icon: Icon,
}: {
  label: string
  place: ExtendedPlaceValue
  icon: typeof Navigation
}) {
  const typeLabel = LOCATION_TYPES.find(
    (t) => t.value === place.locationType
  )?.label

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="truncate text-sm font-medium">{place.address}</span>
        {(typeLabel || place.building || place.neighborhood) && (
          <span className="text-xs text-muted-foreground">
            {[typeLabel, place.building, place.neighborhood, place.city]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
        {place.locationNote && (
          <span className="text-xs text-muted-foreground italic">
            {place.locationNote}
          </span>
        )}
      </div>
    </div>
  )
}

export default function NewRequestForm({ savedProfile }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [notes, setNotes] = useState("")

  const [pickup, setPickup] = useState<ExtendedPlaceValue>(
    savedProfile
      ? {
          address: savedProfile.address,
          placeId: savedProfile.placeId,
          building: savedProfile.building,
          neighborhood: savedProfile.neighborhood,
          city: savedProfile.city,
          locationType: savedProfile.locationType,
          locationNote: savedProfile.locationNote,
          lat: savedProfile.lat,
          lng: savedProfile.lng,
        }
      : emptyPlace
  )
  const [dropoff, setDropoff] = useState<ExtendedPlaceValue>(emptyPlace)
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
      const result = await apiFetch("/api/deliveries/initiate", {
        method: "POST",
        body: JSON.stringify({
          recipientName,
          recipientPhone,
          pickupAddress: pickup.address,
          pickupPlaceId: pickup.placeId,
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          pickupBuilding: pickup.building || undefined,
          pickupNeighborhood: pickup.neighborhood || undefined,
          pickupCity: pickup.city || undefined,
          pickupLocationType: pickup.locationType || undefined,
          pickupLocationNote: pickup.locationNote || undefined,
          dropoffAddress: dropoff.address,
          dropoffPlaceId: dropoff.placeId,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          dropoffBuilding: dropoff.building || undefined,
          dropoffNeighborhood: dropoff.neighborhood || undefined,
          dropoffCity: dropoff.city || undefined,
          dropoffLocationType: dropoff.locationType || undefined,
          dropoffLocationNote: dropoff.locationNote || undefined,
          notes: notes || undefined,
        }),
      })
      window.location.href = result.authorizationUrl
    } catch (err: any) {
      setErrors({ submit: err.message })
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="mb-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight">
              New delivery
            </h1>
            <span className="text-sm text-muted-foreground">
              Step {step} of {STEPS.length}
            </span>
          </div>
          <StepBar current={step} />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {step === 1 && "Who's receiving this?"}
            {step === 2 && "Where should we pick up from?"}
            {step === 3 && "Where are we delivering to?"}
            {step === 4 && "Confirm your order"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 && "Enter the recipient's contact details."}
            {step === 2 && "Search for the pickup location, then add details."}
            {step === 3 && "Search for the dropoff location, then add details."}
            {step === 4 && "Review everything before placing your order."}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {step === 1 && (
            <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Full name</Label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <Label className="text-sm font-medium">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <PlacesInput
                  label="Pickup address"
                  value={pickup}
                  onChange={(val) => {
                    setPickup((prev) => ({ ...prev, ...val }))
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
                        building: savedProfile.building,
                        neighborhood: savedProfile.neighborhood,
                        city: savedProfile.city,
                        locationType: savedProfile.locationType,
                        locationNote: savedProfile.locationNote,
                        lat: savedProfile.lat,
                        lng: savedProfile.lng,
                      })
                    }
                    className="mt-1 flex items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors hover:bg-muted"
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

              {pickup.placeId && (
                <>
                  <Separator />
                  <LocationFields
                    value={pickup}
                    onChange={setPickup}
                    errors={errors}
                    clearError={clearError}
                    prefix="pickup_"
                  />
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
              <PlacesInput
                label="Dropoff address"
                value={dropoff}
                onChange={(val) => {
                  setDropoff((prev) => ({ ...prev, ...val }))
                  clearError("dropoff")
                }}
                placeholder="Search delivery location..."
                error={errors.dropoff}
              />

              {pickup.address && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-xs text-muted-foreground">
                      Picking up from
                    </span>
                    <span className="truncate text-sm">{pickup.address}</span>
                  </div>
                </div>
              )}

              {dropoff.placeId && (
                <>
                  <Separator />
                  <LocationFields
                    value={dropoff}
                    onChange={setDropoff}
                    errors={errors}
                    clearError={clearError}
                    prefix="dropoff_"
                  />
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Recipient
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{recipientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {recipientPhone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Route
                </h3>
                <div className="flex flex-col gap-3">
                  <AddressSummary
                    label="Pickup"
                    place={pickup}
                    icon={Navigation}
                  />
                  <div className="flex justify-center">
                    <div className="h-5 w-px bg-border" />
                  </div>
                  <AddressSummary
                    label="Dropoff"
                    place={dropoff}
                    icon={MapPin}
                  />
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Additional notes
                </h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Fragile package, call on arrival, leave at door..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {previewLoading && (
                <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card p-5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Calculating route...
                  </span>
                </div>
              )}

              {preview && !previewLoading && (
                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="border-b px-5 py-3">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Route estimate
                    </p>
                  </div>
                  <div className="grid grid-cols-3 divide-x">
                    <div className="flex flex-col items-center gap-1.5 py-5">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold tracking-tight">
                        {Number(preview.distanceKm).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">km</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 py-5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold tracking-tight">
                        {Math.round(preview.estimatedMinutes)}
                      </span>
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 py-5">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold tracking-tight">
                        {preview.price}
                      </span>
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
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={back}
              className="h-12 gap-2 px-5"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button onClick={next} className="ml-auto h-12 gap-2 px-6">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || previewLoading}
              className="ml-auto h-12 gap-2 px-6"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Placing order...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm delivery
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
