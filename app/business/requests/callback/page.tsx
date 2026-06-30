import { redirect } from "next/navigation"

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const { reference } = await searchParams
  if (!reference) {
    redirect("/business/requests?payment=invalid")
  }
  const apiUrl = process.env.API_URL ?? "http://localhost:3000"
  redirect(
    `${apiUrl}/api/deliveries/callback?reference=${encodeURIComponent(reference)}`
  )
}
