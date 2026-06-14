"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/api"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type PlaceValue = {
  address: string
  placeId: string
  lat: number
  lng: number
}

interface PlacesInputProps {
  label: string
  value: PlaceValue
  onChange: (val: PlaceValue) => void
  placeholder?: string
  error?: string
}

export function PlacesInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: PlacesInputProps) {
  const [inputVal, setInputVal] = useState(value.address)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputVal(value.address)
  }, [value.address])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputVal(val)
    onChange({ address: "", placeId: "", lat: 0, lng: 0 })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val || val.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await apiFetch(
          `/api/places/autocomplete?input=${encodeURIComponent(val)}`
        )
        if (data.suggestions) {
          setSuggestions(data.suggestions)
          setOpen(true)
        }
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = async (suggestion: any) => {
    const placeId = suggestion.placePrediction.placeId
    const description = suggestion.placePrediction.text.text
    setInputVal(description)
    setSuggestions([])
    setOpen(false)
    setLoading(true)
    try {
      const data = await apiFetch(`/api/places/details?placeId=${placeId}`)
      onChange({
        address: data.formattedAddress ?? description,
        placeId,
        lat: data.location.latitude,
        lng: data.location.longitude,
      })
      setInputVal(data.formattedAddress ?? description)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <MapPin
          className={cn(
            "absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        />
        <Input
          value={inputVal}
          onChange={handleInput}
          onFocus={() => setFocused(true)}
          placeholder={placeholder ?? "Search for an address..."}
          autoComplete="off"
          className={cn(
            "h-12 pr-10 pl-10 text-sm transition-all",
            error && "border-destructive focus-visible:ring-destructive",
            open && suggestions.length > 0 && "rounded-b-none"
          )}
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!loading && value.placeId && (
          <div className="absolute top-1/2 right-3 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {open && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%-0.5rem)] right-0 left-0 z-50 rounded-b-lg border border-t-0 bg-background shadow-xl">
          {suggestions.map((s, i) => {
            const main = s.placePrediction.structuredFormat?.mainText?.text
            const secondary =
              s.placePrediction.structuredFormat?.secondaryText?.text
            return (
              <div
                key={s.placePrediction.placeId}
                onMouseDown={() => handleSelect(s)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted",
                  i !== suggestions.length - 1 && "border-b"
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{main}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {secondary}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
