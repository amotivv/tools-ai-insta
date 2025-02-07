import { Suspense } from "react"
import { InstagramFeed } from "./instagram-feed"
import { auth } from "./api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function Page() {
  console.log("[Page] Checking auth")
  const session = await auth()
  
  console.log("[Page] Session:", {
    exists: !!session,
    user: session?.user,
  })
  
  if (!session) {
    console.log("[Page] No session, redirecting to sign-in")
    redirect('/auth/signin')
  }

  console.log("[Page] Session valid, rendering feed")

  return (
    <main className="max-w-lg mx-auto bg-off-white min-h-screen">
      <Suspense fallback={<FeedSkeleton />}>
        <InstagramFeed />
      </Suspense>
    </main>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-6 p-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-light-gray animate-pulse" />
            <div className="h-4 w-24 bg-light-gray rounded-xl animate-pulse" />
          </div>
          <div className="aspect-square w-full bg-light-gray rounded-2xl animate-pulse" />
        </div>
      ))}
    </div>
  )
}
