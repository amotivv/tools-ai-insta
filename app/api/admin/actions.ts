import { kv } from "@vercel/kv"
import { prisma } from "@/lib/prisma"

export async function listUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      tier: true,
      createdAt: true,
      accounts: {
        select: {
          provider: true,
          scope: true
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
}

export async function listFeeds(userId?: string, page = 1, limit = 20) {
  const where = userId ? { userId } : {}
  const skip = (page - 1) * limit

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

  return {
    feeds,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
      limit
    }
  }
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  return await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      email: true,
      isActive: true,
      tier: true
    }
  })
}

export async function updateUserTier(userId: string, tier: 'BASIC' | 'PREMIUM') {
  return await prisma.user.update({
    where: { id: userId },
    data: { tier },
    select: {
      id: true,
      email: true,
      isActive: true,
      tier: true
    }
  })
}

export async function updateFeedStatus(feedId: string, isActive: boolean) {
  return await prisma.sharedFeed.update({
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
}
