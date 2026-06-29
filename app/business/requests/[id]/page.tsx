import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import BusinessRequestDetail from "./BusinessRequestDetail"

async function getDelivery(id: string, cookieHeader: string) {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/deliveries/${id}`,
    { headers: { cookie: cookieHeader }, cache: "no-store" }
  )
  if (res.status === 404) return null
  if (!res.ok) return undefined
  return res.json()
}

async function getLocation(id: string, cookieHeader: string) {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/deliveries/${id}/location`,
    { headers: { cookie: cookieHeader }, cache: "no-store" }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function BusinessRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const [delivery, locationData] = await Promise.all([
    getDelivery(id, cookieHeader),
    getLocation(id, cookieHeader),
  ])

  if (delivery === undefined) redirect("/login")
  if (delivery === null) notFound()

  return (
    <BusinessRequestDetail
      delivery={delivery}
      driverLocation={locationData?.location ?? null}
    />
  )
}
