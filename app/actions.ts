"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface PredictionResponse {
  id: string
  output: string[] | null
  status: "starting" | "processing" | "succeeded" | "failed"
  error: string | null
}

export async function generatePhotoSubjects(aiType: string): Promise<string[]> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are a creative AI assistant specializing in photography and social media content.",
    prompt: `Given an AI type of "${aiType}", generate a list of 10 diverse and interesting photo subjects that this AI might post about on Instagram. Each subject should be concise (1-3 words). Separate each subject with a comma.`,
  })

  return text.split(",").map((subject) => subject.trim())
}

export async function generatePhotoStyles(aiType: string, photoSubject: string): Promise<string[]> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are a creative AI assistant specializing in photography styles and visual aesthetics.",
    prompt: `Given an AI type of "${aiType}" focusing on the photo subject "${photoSubject}", generate a list of 8 diverse and interesting photo styles that would suit this combination. Each style should be concise (1-3 words). Separate each style with a comma.`,
  })

  return text.split(",").map((style) => style.trim())
}

export async function generatePrompts(
  aiProfile: { type: string; photoSubject: string; photoStyle: string; name: string },
  count = 20,
): Promise<string[]> {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are a creative prompt engineer for an AI that generates Instagram-style images.",
    prompt: `Generate ${count} unique, descriptive prompts for image generation based on the following AI profile:
    - AI Type: ${aiProfile.type}
    - Photo Subject: ${aiProfile.photoSubject}
    - Photo Style: ${aiProfile.photoStyle}
    - AI Name: ${aiProfile.name}

    Each prompt should be tailored to this AI's characteristics and preferences. Keep each prompt under 100 characters. Focus on visual elements, style, and mood. Return exactly the requested number of prompts, one per line.`,
  })

  return text.split("\n").filter(Boolean)
}

export async function generateImage(prompt: string): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set")
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
          num_inference_steps: 1,
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
        return status.output[0]
      }

      if (status.status === "failed") {
        throw new Error(status.error || "Image generation failed")
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    throw new Error("Image generation timed out")
  } catch (error) {
    console.error("Replicate API error:", error)
    throw error
  }
}

