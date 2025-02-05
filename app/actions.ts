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

export async function generateImage(prompt: string): Promise<ActionResponse<string>> {
  if (!REPLICATE_API_TOKEN) {
    return {
      success: false,
      error: "API configuration error. Please try again later."
    }
  }

  try {
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

      if (status.status === "succeeded" && status.output && status.output[0]) {
        const replicateUrl = status.output[0]
        const response = await fetch(replicateUrl)
        const imageBlob = await response.blob()

        const { url } = await put(
          `ai-images/${Date.now()}.png`,
          imageBlob,
          {
            access: 'public',
            addRandomSuffix: true
          }
        )

        return { success: true, data: url }
      }

      if (status.status === "failed") {
        return {
          success: false,
          error: status.error || "Image generation failed"
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
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

