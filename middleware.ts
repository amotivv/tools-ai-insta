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
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Redirect to sign-in if no token
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", request.url)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Auth middleware error:", error)
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
