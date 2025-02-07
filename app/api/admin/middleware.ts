import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function withAdmin(handler: Function) {
  return async function (req: Request) {
    try {
      const session = await auth()
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return handler(req)
    } catch (error) {
      console.error("[Admin] Error:", error)
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    }
  }
}
