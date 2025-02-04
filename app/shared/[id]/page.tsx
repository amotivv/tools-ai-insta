import { kv } from "@vercel/kv"
import { notFound } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Bookmark } from "lucide-react"

interface SharedFeed {
  aiProfile: {
    name: string
    photoSubject: string
    photoStyle: string
    avatarUrl: string
  }
  posts: {
    id: string
    image: string | null
    likes: number
    comments: string[]
  }[]
  createdAt: string
  expiresAt: string
}

export default async function SharedFeedPage({ params }: { params: { id: string } }) {
  try {
    // Get the feed data from KV
    const feed = await kv.get<SharedFeed>(`feed:${params.id}`)

    // Check if feed exists
    if (!feed) {
      notFound()
    }

    // Format the creation date
    const createdDate = new Date(feed.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return (
      <main className="max-w-lg mx-auto bg-white min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Shared AI Instagram Feed</h1>
        <div className="text-sm text-gray-500 mb-4">Created on {createdDate}</div>

        {/* AI Profile Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold">AI Profile</h2>
          <p className="text-sm text-gray-600">
            {feed.aiProfile.name} • {feed.aiProfile.photoSubject} • {feed.aiProfile.photoStyle}
          </p>
        </div>

        <div className="space-y-6">
          {feed.posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {/* Profile Header */}
              <div className="p-4 flex items-center space-x-2">
                <Avatar>
                  <AvatarImage
                    src={feed.aiProfile.avatarUrl}
                    alt={feed.aiProfile.name}
                  />
                  <AvatarFallback>{feed.aiProfile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-semibold">{feed.aiProfile.name}</div>
              </div>

              {/* Image */}
              <div className="aspect-square w-full bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image || "/placeholder.svg"}
                  alt={`AI generated ${feed.aiProfile.photoStyle} image of ${feed.aiProfile.photoSubject}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Interaction Section */}
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Heart className="w-6 h-6" />
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <Bookmark className="w-6 h-6" />
                </div>

                {/* Likes */}
                <div className="text-sm font-semibold">
                  {post.likes.toLocaleString()} likes
                </div>

                {/* Comments */}
                <div className="mt-2">
                  <div className="text-sm font-semibold mb-1">
                    {post.comments.length} comments
                  </div>
                  {post.comments.slice(0, 2).map((comment, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold">user{index + 1}</span> {comment}
                    </div>
                  ))}
                  {post.comments.length > 2 && (
                    <div className="text-sm text-gray-500">
                      View all {post.comments.length} comments
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error fetching shared feed:', error)
    notFound()
  }
}