import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  const publicPaths = [
    "/api/auth",
    "/auth/signin",
    "/_next",
    "/favicon.ico",
  ]

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  try {
    console.log("[Middleware] Checking path:", pathname)
    
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    console.log("[Middleware] Token exists:", !!token)
    if (token) {
      console.log("[Middleware] Token data:", {
        id: token.id,
        email: token.email,
        name: token.name
      })
    }

    // Redirect to sign-in if no token
    if (!token) {
      console.log("[Middleware] No token, redirecting to sign-in")
      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(signInUrl)
    }

    console.log("[Middleware] Token valid, proceeding")
    return NextResponse.next()
  } catch (error) {
    console.error("[Middleware] Auth error:", error)
    // On error, redirect to sign-in as a fallback
    const signInUrl = new URL("/auth/signin", request.url)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth endpoints)
     * - _next (Next.js internals)
     * - favicon.ico (favicon file)
     * - auth/signin (sign in page)
     */
    "/((?!api/auth|_next|favicon.ico|auth/signin).*)"
  ]
}
