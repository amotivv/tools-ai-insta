import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { nanoid } from "nanoid"
import { prisma } from "@/lib/prisma"
import { auth } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { feed } = await request.json()
    const id = nanoid()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    // Store in database
    const sharedFeed = await prisma.sharedFeed.create({
      data: {
        id,
        userId: session.user.id,
        images: feed.posts.map((post: any) => post.id),
        expiresAt,
        metadata: feed,
      }
    })

    // Also store in KV for fast access
    await kv.set(
      `feed:${id}`, 
      JSON.stringify({
        ...feed,
        createdAt: sharedFeed.createdAt.toISOString(),
        expiresAt: sharedFeed.expiresAt.toISOString()
      }), 
      { ex: 30 * 24 * 60 * 60 }
    )

    console.log("[Share] Created shared feed:", {
      id: sharedFeed.id,
      userId: sharedFeed.userId,
      imageCount: sharedFeed.images.length
    })

    const shareUrl = `/shared/${id}`
    return NextResponse.json({ shareUrl })
  } catch (error) {
    console.error("[Share] Error creating shared feed:", error)
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    )
  }
}
