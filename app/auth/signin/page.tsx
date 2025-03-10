"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  
  console.log("[SignIn] Params:", {
    callbackUrl,
    searchParams: Object.fromEntries(searchParams.entries())
  })

  const handleSignIn = () => {
    console.log("[SignIn] Starting GitHub sign in with callback:", callbackUrl)
    signIn("github", { 
      callbackUrl: callbackUrl.replace(/\/$/, ""), // Remove trailing slash if present
      redirect: true,
    })
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-96 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Sign in to AI-stagram</h1>
          <p className="text-gray-500">
            Get access to premium features like custom AI photo subjects
          </p>
        </div>

        <div className="space-y-4">
          <Button
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
            onClick={handleSignIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            Continue with GitHub
          </Button>

          <div className="text-center text-sm text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96 p-6">
          <div className="text-center">Loading...</div>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
