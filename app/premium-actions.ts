"use server"

import { auth } from "./api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export interface UserPreferences {
  modelType: string
  safetyCheckerEnabled: boolean
  inferenceSteps: number
  guidanceScale: number
  aspectRatio: string
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const session = await auth()
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user?.preferences) {
      // Create default preferences if none exist
      const preferences = await prisma.userPreferences.create({
        data: {
          userId: user!.id,
          modelType: "flux-schnell",
          safetyCheckerEnabled: true,
          inferenceSteps: 2,
          guidanceScale: 5.5,
          aspectRatio: "1:1"
        }
      })
      return preferences
    }

    if (!user.preferences) {
      return null
    }

    // Convert Decimal to number for client components
    return {
      ...user.preferences,
      guidanceScale: Number(user.preferences.guidanceScale)
    }
  } catch (error) {
    console.error("Error getting user preferences:", error)
    return null
  }
}

export async function updateUserPreferences(preferences: UserPreferences): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.email) return false

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user) return false

    // Validate settings based on model type
    const validatedPreferences = {
      ...preferences,
      inferenceSteps: preferences.modelType === "flux-dev" && preferences.inferenceSteps < 18 
        ? 18 
        : preferences.inferenceSteps,
      guidanceScale: Math.max(3, Math.min(6, preferences.guidanceScale))
    }

    if (user.preferences) {
      await prisma.userPreferences.update({
        where: { userId: user.id },
        data: {
          modelType: validatedPreferences.modelType,
          safetyCheckerEnabled: validatedPreferences.safetyCheckerEnabled,
          inferenceSteps: validatedPreferences.inferenceSteps,
          guidanceScale: validatedPreferences.guidanceScale,
          aspectRatio: validatedPreferences.aspectRatio,
        }
      })
    } else {
      await prisma.userPreferences.create({
        data: {
          userId: user.id,
          ...validatedPreferences
        }
      })
    }

    return true
  } catch (error) {
    console.error("Error updating user preferences:", error)
    return false
  }
}

export async function checkUserPremiumStatus(): Promise<boolean> {
  try {
    const session = await auth()
    if (!session?.user?.email) return false

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    return user?.tier === "PREMIUM"
  } catch (error) {
    console.error("Error checking premium status:", error)
    return false
  }
}
