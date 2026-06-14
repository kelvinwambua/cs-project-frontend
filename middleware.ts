import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify, createRemoteJWKSet } from "jose"

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/jwks`)
)

const API_URL = process.env.NEXT_PUBLIC_API_URL!

async function getRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("dispatch.jwt")?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: API_URL,
      audience: API_URL,
    })
    return (payload as any).role ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedRoutes = ["/driver", "/business", "/admin"]
  const authRoutes = ["/login", "/register", "/verify"]

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  const sessionCookie =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value

  const isAuthenticated = !!sessionCookie

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && (isProtectedRoute || isAuthRoute)) {
    const role = await getRole(request)

    if (!role && isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (role) {
      if (pathname.startsWith("/driver") && role !== "driver") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      if (pathname.startsWith("/business") && role !== "business") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      if (pathname.startsWith("/admin") && role !== "admin") {
        return NextResponse.redirect(new URL("/login", request.url))
      }

      if (isAuthRoute) {
        if (role === "driver")
          return NextResponse.redirect(
            new URL("/driver/dashboard", request.url)
          )
        if (role === "business")
          return NextResponse.redirect(
            new URL("/business/dashboard", request.url)
          )
        if (role === "admin")
          return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/driver/:path*",
    "/business/:path*",
    "/admin/:path*",
    "/verify",
    "/login",
    "/register",
    "/register/:path*",
  ],
}
