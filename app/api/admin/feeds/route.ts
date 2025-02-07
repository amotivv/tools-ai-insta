import { NextResponse } from "next/server"
import { withAdmin } from "../middleware"
import { listFeeds, updateFeedStatus } from "../actions"

export const runtime = "nodejs"

// GET /api/admin/feeds - List all shared feeds
export const GET = withAdmin(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await listFeeds(userId || undefined, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Admin] Error listing feeds:", error)
    return NextResponse.json(
      { error: "Failed to list feeds" },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/feeds/:id - Update feed status
export const PATCH = withAdmin(async (req: Request) => {
  try {
    const { feedId, isActive } = await req.json()
    const feed = await updateFeedStatus(feedId, isActive)
    return NextResponse.json({ feed })
  } catch (error) {
    console.error("[Admin] Error updating feed:", error)
    return NextResponse.json(
      { error: "Failed to update feed" },
      { status: 500 }
    )
  }
})
