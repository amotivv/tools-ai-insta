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
    
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.append('Access-Control-Allow-Credentials', 'true')
    response.headers.append('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
    
    return response
  } catch (error) {
    console.error("[Middleware] Auth error:", error)
    // On error, redirect to sign-in as a fallback
      const signInUrl = new URL("/auth/signin", "https://v0-insta-ai.vercel.app")
      signInUrl.searchParams.set("callbackUrl", "https://v0-insta-ai.vercel.app")
      return NextResponse.redirect(signInUrl.toString())
  }
}

export const config = {
  matcher: []
}
