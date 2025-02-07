import { NextResponse } from "next/server"
import { withAdmin } from "../middleware"
import { prisma } from "@/lib/prisma"

// GET /api/admin/users - List all users
async function GET() {
  const users = await prisma.user.findMany({
    include: {
      accounts: {
        select: {
          provider: true,
          scope: true
        }
      },
      generatedImages: {
        select: {
          id: true
        }
      },
      sharedFeeds: {
        select: {
          id: true,
          views: true
        }
      },
      _count: {
        select: {
          generatedImages: true,
          sharedFeeds: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({ users })
}

// PATCH /api/admin/users/:id - Update user status
async function PATCH(req: Request) {
  const { userId, isActive } = await req.json()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      email: true,
      isActive: true
    }
  })

  return NextResponse.json({ user })
}

export { GET, PATCH }

// Wrap handlers with admin middleware
export const runtime = "edge"
export const GET_wrapped = withAdmin(GET)
export const PATCH_wrapped = withAdmin(PATCH)
