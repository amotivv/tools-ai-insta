import { NextResponse } from "next/server"
import { withAdmin } from "../middleware"
import { prisma } from "@/lib/prisma"

interface OpenAILogWithUser {
  timestamp: Date
  type: 'SUBJECTS' | 'STYLES' | 'PROMPTS'
  input: string
  output: string
  duration: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  user: {
    name: string | null
    email: string | null
  }
}

export async function GET(request: Request) {
  const handler = async (req: Request) => {
    try {
      // @ts-ignore - Prisma will recognize OpenAILog after regenerating client
      const rawLogs: OpenAILogWithUser[] = await prisma.openAILog.findMany({
        orderBy: {
          timestamp: 'desc'
        },
        take: 100, // Limit to last 100 logs
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      // Transform logs to match the expected format
      const logs = rawLogs.map(log => ({
        timestamp: log.timestamp.toISOString(),
        type: log.type.toLowerCase(),
        input: log.input,
        output: log.output,
        duration: log.duration,
        tokens: {
          prompt: log.promptTokens,
          completion: log.completionTokens,
          total: log.totalTokens
        }
      }))

      return NextResponse.json({ logs })
    } catch (error) {
      console.error("[Admin] Error fetching logs:", error)
      return NextResponse.json(
        { error: "Failed to fetch logs" },
        { status: 500 }
      )
    }
  }

  return withAdmin(handler)(request)
}
