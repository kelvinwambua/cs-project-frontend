const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? "Request failed")
  }
  return res.json()
}

export type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "cancelled"

export interface Delivery {
  id: string
  businessId: string
  driverId: string | null
  recipientName: string
  recipientPhone: string
  pickupAddress: string
  pickupNeighborhood: string | null
  pickupCity: string | null
  dropoffAddress: string
  dropoffNeighborhood: string | null
  dropoffCity: string | null
  notes: string | null
  distanceKm: number
  estimatedMinutes: number
  price: string
  status: DeliveryStatus
  createdAt: string
  updatedAt: string
}

export interface BusinessOverview {
  total: number
  delivered: number
  cancelled: number
  pending: number
  completionRate: string
  cancellationRate: string
  totalSpend: string
  avgOrderValue: string
  avgDistanceKm: string
  avgEstimatedMinutes: string
}

export interface VolumePoint {
  period: string
  total: number
  delivered: number
  cancelled: number
  spend: string
}

export interface HistoryResponse {
  data: Delivery[]
  total: number
  limit: number
  offset: number
}

export const analyticsApi = {
  businessOverview: (): Promise<BusinessOverview> =>
    apiFetch("/api/analytics/business/overview"),

  businessVolume: (
    period: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<VolumePoint[]> =>
    apiFetch(`/api/analytics/business/volume?period=${period}`),

  businessHistory: (params?: {
    limit?: number
    offset?: number
    status?: DeliveryStatus
  }): Promise<HistoryResponse> => {
    const q = new URLSearchParams()
    if (params?.limit) q.set("limit", String(params.limit))
    if (params?.offset) q.set("offset", String(params.offset))
    if (params?.status) q.set("status", params.status)
    return apiFetch(`/api/analytics/business/history?${q.toString()}`)
  },
}

export const deliveriesApi = {
  list: (): Promise<Delivery[]> => apiFetch("/api/deliveries"),
  get: (id: string): Promise<Delivery> => apiFetch(`/api/deliveries/${id}`),
  create: (body: unknown): Promise<Delivery> =>
    apiFetch("/api/deliveries", { method: "POST", body: JSON.stringify(body) }),
  cancel: (id: string): Promise<Delivery> =>
    apiFetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel" }),
    }),
  preview: (body: {
    pickupLat: number
    pickupLng: number
    dropoffLat: number
    dropoffLng: number
  }) =>
    apiFetch("/api/deliveries/preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),
}
