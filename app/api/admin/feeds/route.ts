import { NextResponse } from "next/server"
import { withAdmin } from "../middleware"
import { prisma } from "@/lib/prisma"

// GET /api/admin/feeds - List all shared feeds
async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where = userId ? { userId } : {}

  const [feeds, total] = await Promise.all([
    prisma.sharedFeed.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.sharedFeed.count({ where })
  ])

  return NextResponse.json({
    feeds,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit
    }
  })
}

// PATCH /api/admin/feeds/:id - Update feed status
async function PATCH(req: Request) {
  const { feedId, isActive } = await req.json()

  const feed = await prisma.sharedFeed.update({
    where: { id: feedId },
    data: { isActive },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  return NextResponse.json({ feed })
}

export { GET, PATCH }

// Wrap handlers with admin middleware
export const runtime = "edge"
export const GET_wrapped = withAdmin(GET)
export const PATCH_wrapped = withAdmin(PATCH)
