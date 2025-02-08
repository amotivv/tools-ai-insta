"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { put } from '@vercel/blob'
import './config'
import { prisma } from "@/lib/prisma"
import { auth } from "./api/auth/[...nextauth]/route"
import { kv } from "@vercel/kv"

async function logOpenAICall(
  type: 'SUBJECTS' | 'STYLES' | 'PROMPTS',
  input: string,
  output: string,
  startTime: number,
  tokenUsage: { prompt: number; completion: number; total: number }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) return

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) return

    // @ts-ignore - Prisma will recognize OpenAILog after regenerating client
    await prisma.openAILog.create({
      data: {
        type,
        input,
        output,
        userId: user.id,
        duration: Date.now() - startTime,
        promptTokens: tokenUsage.prompt,
        completionTokens: tokenUsage.completion,
        totalTokens: tokenUsage.total
      }
    })
  } catch (error) {
    console.error("Error logging OpenAI call:", error)
  }
}

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

interface PredictionResponse {
  id: string
  output: string[] | null
  status: "starting" | "processing" | "succeeded" | "failed"
  error: string | null
}

interface ErrorResponse {
  success: false
  error: string
}

interface SuccessResponse<T> {
  success: true
  data: T
}

type ActionResponse<T> = SuccessResponse<T> | ErrorResponse

export async function generatePhotoSubjects(aiType: string): Promise<ActionResponse<string[]>> {
  const startTime = Date.now()
  const prompt = `Generate 10 engaging photo subjects related to "${aiType}".
    - Each subject should be 1-3 words
    - Consider both common and unique aspects of the theme
    - Focus on visually distinctive and captivating subjects
    - Ensure variety while maintaining thematic relevance
    Return only the subjects, separated by commas.`

  try {
    const { text, usage } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are a creative AI assistant specializing in visual arts and photography. You understand how to break down themes and concepts into compelling visual subjects.",
      prompt,
    })

    const subjects = text.split(",").map((subject) => subject.trim())
    
    await logOpenAICall(
      'SUBJECTS',
      prompt,
      text,
      startTime,
      {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0
      }
    )

    return {
      success: true,
      data: subjects
    }
  } catch (error) {
    console.error("Error generating photo subjects:", error)
    return {
      success: false,
      error: "Failed to generate photo subjects. Please try again."
    }
  }
}

export async function generatePhotoStyles(aiType: string, photoSubject: string): Promise<ActionResponse<string[]>> {
  const startTime = Date.now()
  const prompt = `Generate 8 distinct photography or artistic styles that would work well for "${photoSubject}" in the context of ${aiType}.
    - Each style should be 1-3 words
    - Mix technical approaches (e.g., "macro shot") with visual aesthetics (e.g., "dark moody")
    - Consider lighting, composition, and mood that enhance the subject
    - Focus on styles that create visual impact
    Return only the styles, separated by commas.`

  try {
    const { text, usage } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are a creative AI assistant specializing in photography and visual aesthetics. You understand both technical photography approaches and artistic visual styles.",
      prompt,
    })

    const styles = text.split(",").map((style) => style.trim())
    
    await logOpenAICall(
      'STYLES',
      prompt,
      text,
      startTime,
      {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0
      }
    )

    return {
      success: true,
      data: styles
    }
  } catch (error) {
    console.error("Error generating photo styles:", error)
    return {
      success: false,
      error: "Failed to generate photo styles. Please try again."
    }
  }
}

export async function generatePrompts(
  aiProfile: { type: string; photoSubject: string; photoStyle: string; name: string },
  count = 20,
): Promise<ActionResponse<string[]>> {
  const startTime = Date.now()
  const prompt = `Create ${count} image generation prompts combining ${aiProfile.type} with ${aiProfile.photoSubject} in ${aiProfile.photoStyle} style.
    
    Requirements:
    - Each prompt should be under 100 characters
    - Focus on natural and authentic compositions
    - Include specific lighting and atmosphere details
    - Consider perspective and framing
    - Emphasize both subject and environment
    - Avoid text or graphics in the image
    
    Important:
    - Do NOT number the prompts
    - Do NOT include any numbers or ordering
    - Start each prompt directly with the description
    
    Format:
    [description], [lighting], [angle/composition]
    
    Example:
    Vintage car on empty street, golden hour light, low angle
    
    Return one prompt per line, following this exact format.`

  try {
    const { text, usage } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are an expert prompt engineer specializing in image generation. You understand how to craft detailed visual descriptions that combine subjects, styles, and compositions into cohesive scenes.",
      prompt,
    })

    const prompts = text.split("\n").filter(Boolean)
    
    await logOpenAICall(
      'PROMPTS',
      prompt,
      text,
      startTime,
      {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0
      }
    )

    return {
      success: true,
      data: prompts
    }
  } catch (error) {
    console.error("Error generating prompts:", error)
    return {
      success: false,
      error: "Failed to generate prompts. Please try again."
    }
  }
}

export async function likeImage(imageId: string): Promise<ActionResponse<number>> {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      console.error("No user email in session")
      return {
        success: false,
        error: "Authentication required"
      }
    }

    console.log("[Like] Updating likes for image:", imageId)

    const updatedImage = await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        likes: {
          increment: 1
        }
      }
    })

    console.log("[Like] Updated likes count:", updatedImage.likes)

    return {
      success: true,
      data: updatedImage.likes
    }
  } catch (error) {
    console.error("[Like] Error updating likes:", error)
    return {
      success: false,
      error: "Failed to update likes. Please try again."
    }
  }
}

interface GeneratedImageResponse {
  url: string
  aspectRatio: string
}

export async function generateImage(prompt: string, postId?: string): Promise<ActionResponse<GeneratedImageResponse>> {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      console.error("No user email in session")
      return {
        success: false,
        error: "Authentication required"
      }
    }

    if (!REPLICATE_API_TOKEN) {
      console.error("Missing Replicate API token")
      return {
        success: false,
        error: "API configuration error. Please try again later."
      }
    }

    // Check KV cache first
    const cacheKey = `image:${session.user.email}:${prompt}`
    const cachedImage = await kv.get(cacheKey)
    if (cachedImage) {
      // For cached images, assume default aspect ratio
      return { 
        success: true, 
        data: {
          url: cachedImage as string,
          aspectRatio: "1:1"
        }
      }
    }

    console.log("[Generate] Starting image generation for prompt:", prompt.slice(0, 50) + "...")
    
    // Get user and their preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { preferences: true }
    })

    if (!user) {
      return {
        success: false,
        error: "User not found"
      }
    }

    // Use premium settings if available, otherwise use defaults
    // Get preferences with proper type conversion
    const preferences = user.preferences || {
      modelType: "flux-schnell",
      inferenceSteps: 2,
      guidanceScale: 5.5,
      aspectRatio: "1:1",
      safetyCheckerEnabled: true
    }

    // Convert Decimal to number for the API
    const modelType = preferences.modelType
    const inferenceSteps = preferences.inferenceSteps
    const guidanceScale = Number(preferences.guidanceScale)
    const aspectRatio = preferences.aspectRatio
    const safetyCheckerEnabled = preferences.safetyCheckerEnabled

    // Validate inference steps based on model type
    const modelLimits = {
      "flux-schnell": { min: 2, max: 4 },
      "flux-dev": { min: 18, max: 50 }
    } as const
    const limits = modelLimits[modelType as keyof typeof modelLimits]
    const validatedSteps = Math.min(Math.max(inferenceSteps, limits.min), limits.max)

    const response = await fetch(`https://api.replicate.com/v1/models/black-forest-labs/${modelType}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          guidance_scale: guidanceScale,
          num_inference_steps: validatedSteps,
          output_format: "webp",
          output_quality: 80,
          disable_safety_checker: !safetyCheckerEnabled,
          aspect_ratio: aspectRatio,
          go_fast: modelType === "flux-schnell",
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Replicate API error response:", error)
      throw new Error(error.detail || "Failed to start image generation")
    }

    const prediction = await response.json()
    console.log("[Generate] Prediction started:", prediction.id)

    const startTime = Date.now()
    while (Date.now() - startTime < 30000) {
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      })

      if (!pollResponse.ok) {
        const error = await pollResponse.json()
        throw new Error(error.detail || "Failed to check generation status")
      }

      const status: PredictionResponse = await pollResponse.json()
      console.log("[Generate] Status check:", {
        id: prediction.id,
        status: status.status,
        hasOutput: !!status.output
      })

      if (status.status === "succeeded" && status.output && status.output[0]) {
        console.log("[Generate] Generation succeeded, downloading image...")
        const replicateUrl = status.output[0]
        const response = await fetch(replicateUrl)
        const imageBlob = await response.blob()

        const blobKey = `ai-images/${session.user.email}/${Date.now()}.png`
        console.log("[Generate] Image downloaded, uploading to blob storage...")
        const { url } = await put(
          blobKey,
          imageBlob,
          {
            access: 'public',
            addRandomSuffix: true
          }
        )

        try {
          console.log("[Generate] Uploaded to blob storage, storing metadata...")
          
          // Store in KV cache
          await kv.set(cacheKey, url)
          console.log("[Generate] Stored in KV cache")

          // Get user from database
          const user = await prisma.user.findUnique({
            where: { 
              email: session.user.email as string 
            }
          })

          if (!user) {
            throw new Error("User not found in database")
          }

          console.log("[Generate] Found user record:", user.id)

          // Store in database with provided ID
          const dbImage = await prisma.generatedImage.create({
            data: {
              id: postId || `post_${Date.now()}`, // Use provided ID or generate one
              userId: user.id,
              prompt,
              imageUrl: url,
              blobKey,
              cacheKey,
              isPublic: true,
              likes: 0 // Start with 0 likes
            }
          })

          console.log("[Generate] Image stored successfully:", {
            id: dbImage.id,
            url: dbImage.imageUrl,
            aspectRatio: aspectRatio
          })

          // Return both the URL and aspect ratio
          return { 
            success: true, 
            data: {
              url,
              aspectRatio
            }
          }
        } catch (storageError) {
          console.error("[Generate] Error storing image data:", storageError)
          // Still return success since image was generated
          return { 
            success: true, 
            data: {
              url,
              aspectRatio: "1:1"
            }
          }
        }
      }

      if (status.status === "failed") {
        return {
          success: false,
          error: status.error || "Image generation failed"
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return {
      success: false,
      error: "Image generation timed out"
    }
  } catch (error) {
    console.error("Error generating or storing image:", error)
    return {
      success: false,
      error: "Failed to generate image. Please try again."
    }
  }
}
