import { NextResponse } from "next/server"
import { withAdmin } from "../middleware"
import { listUsers, updateUserStatus, updateUserTier } from "../actions"

export const runtime = "nodejs"

// GET /api/admin/users - List all users
export const GET = withAdmin(async () => {
  try {
    const users = await listUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error("[Admin] Error listing users:", error)
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/users/:id - Update user status or tier
export const PATCH = withAdmin(async (req: Request) => {
  try {
    const { userId, isActive, tier } = await req.json()
    
    let user;
    if (tier !== undefined) {
      user = await updateUserTier(userId, tier)
    } else if (isActive !== undefined) {
      user = await updateUserStatus(userId, isActive)
    } else {
      return NextResponse.json(
        { error: "No update parameters provided" },
        { status: 400 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[Admin] Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
})
