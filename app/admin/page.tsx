import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminDashboard } from "./admin-dashboard"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  // Check if user has admin scope
  const account = await prisma.account.findFirst({
    where: {
      user: {
        email: session.user.email
      },
      scope: {
        contains: "admin"
      }
    }
  })

  if (!account) {
    redirect("/")
  }

  // Fetch initial data
  const [users, feeds] = await Promise.all([
    prisma.user.findMany({
      include: {
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
      },
      take: 10
    }),
    prisma.sharedFeed.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
  ])

  return <AdminDashboard initialUsers={users} initialFeeds={feeds} />
}
