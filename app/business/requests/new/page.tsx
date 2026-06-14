import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import NewRequestForm from "./new-request-form"

async function getSavedProfile(cookieHeader: string) {
  const res = await fetch(
    `${process.env.API_URL ?? "http://localhost:3000"}/api/business-profile`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    }
  )
  if (!res.ok) return null
  return res.json()
}

export default async function NewRequestPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const profile = await getSavedProfile(cookieHeader)
  return <NewRequestForm savedProfile={profile} />
}
