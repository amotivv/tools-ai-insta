import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  const { feed } = await request.json()

  const id = nanoid()
  const metadata = {
    ...feed,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  }

  // Store for 30 days (in seconds)
  await kv.set(`feed:${id}`, JSON.stringify(metadata), { ex: 30 * 24 * 60 * 60 }) 

  const shareUrl = `/shared/${id}`

  return NextResponse.json({ shareUrl })
}