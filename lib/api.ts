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
