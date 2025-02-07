"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { put } from '@vercel/blob'
import './config'


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
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are a creative AI assistant specializing in content strategy and social media trends. You understand different content creator niches and their unique visual storytelling needs.",
      prompt: `Generate 10 trending and engaging photo subjects for an AI that posts as a "${aiType}" content creator on Instagram.
    - Each subject should be 1-3 words
    - Focus on subjects that would resonate with ${aiType}'s target audience
    - Ensure variety while maintaining niche relevance
    - Consider current social media trends
    Return only the subjects, separated by commas.`,
    })

    return {
      success: true,
      data: text.split(",").map((subject) => subject.trim())
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
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are a creative AI assistant specializing in photography and visual aesthetics. You understand both technical photography terms and popular Instagram aesthetic trends.",
      prompt: `Generate 8 distinct photography styles for a "${aiType}" Instagram creator showcasing "${photoSubject}".
    - Each style should be 1-3 words
    - Mix technical terms (e.g., "macro shot") with aesthetic terms (e.g., "dark moody")
    - Consider the subject matter and creator type
    - Focus on visually distinctive styles
    Return only the styles, separated by commas.`,
    })

    return {
      success: true,
      data: text.split(",").map((style) => style.trim())
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
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: "You are an expert prompt engineer specializing in image generation for social media. You understand how to craft prompts that produce consistent, high-quality, Instagram-worthy images.",
      prompt: `Create ${count} image generation prompts for an Instagram AI creator:
    Profile:
    - Type: ${aiProfile.type}
    - Subject: ${aiProfile.photoSubject}
    - Style: ${aiProfile.photoStyle}
    - Name: ${aiProfile.name}

    Requirements:
    - Each prompt should be under 100 characters
    - Focus on visual aesthetics and composition
    - Maintain consistency with the creator's style
    - Include lighting, angle, and mood cues
    - Avoid text or graphics in the image
    - Ensure Instagram-friendly composition
    
    Return one prompt per line.`,
    })

    return {
      success: true,
      data: text.split("\n").filter(Boolean)
    }
  } catch (error) {
    console.error("Error generating prompts:", error)
    return {
      success: false,
      error: "Failed to generate prompts. Please try again."
    }
  }
}

import { auth } from "./api/auth/[...nextauth]/route"
import { kv } from "@vercel/kv"
import { prisma } from "@/lib/prisma"

export async function generateImage(prompt: string): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.error("No user session found")
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
    const cacheKey = `image:${session.user.id}:${prompt}`
    const cachedImage = await kv.get(cacheKey)
    if (cachedImage) {
      return { success: true, data: cachedImage as string }
    }

    console.log("[Generate] Starting image generation for prompt:", prompt.slice(0, 50) + "...")
    
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs: 1,
          guidance_scale: 5.5,
          num_inference_steps: 2,
          output_format: "webp",
          output_quality: 80,
          disable_safety_checker: false,
          aspect_ratio: "1:1",
          go_fast: true,
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

        const blobKey = `ai-images/${session.user.id}/${Date.now()}.png`
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

          // Store in database
          const dbImage = await prisma.generatedImage.create({
            data: {
              userId: session.user.id,
              prompt,
              imageUrl: url,
              blobKey,
              cacheKey,
              isPublic: true
            }
          })

          console.log("[Generate] Image stored successfully:", {
            id: dbImage.id,
            url: dbImage.imageUrl
          })

          return { success: true, data: url }
        } catch (storageError) {
          console.error("[Generate] Error storing image data:", storageError)
          // Still return success since image was generated
          return { success: true, data: url }
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
