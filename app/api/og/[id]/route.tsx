import { ImageResponse } from 'next/og'
import { kv } from '@vercel/kv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SharedFeed {
  aiProfile: {
    name: string
    photoSubject: string
    photoStyle: string
    avatarUrl: string
  }
  posts: {
    id: string
    image: string | null
    likes: number
    comments: string[]
  }[]
}

export async function GET(request: Request) {
  try {
    console.log("[OG] Request URL:", request.url)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    console.log("[OG] Feed ID:", id)

    if (!id) {
      return new Response('Missing feed ID', { status: 400 })
    }

    // Get the feed data from KV
    console.log("[OG] Fetching feed from KV:", id)
    const feed = await kv.get<SharedFeed>(`feed:${id}`)
    console.log("[OG] Feed data:", feed)

    if (!feed) {
      return new Response('Feed not found', { status: 404 })
    }

    // Try to fetch and convert the first image
    let imageData: string | undefined
    try {
      if (feed.posts[0]?.image) {
        console.log("[OG] Fetching image:", feed.posts[0].image)
        const imageResponse = await fetch(feed.posts[0].image)
        if (imageResponse.ok) {
          const buffer = await imageResponse.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
          const contentType = imageResponse.headers.get('content-type') || 'image/png'
          imageData = `data:${contentType};base64,${base64}`
          console.log("[OG] Image converted to data URL")
        }
      }
    } catch (error) {
      console.error("[OG] Error fetching image:", error)
    }

    console.log("[OG] Generating image response")
    const response = new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '1200',
            height: '630',
            display: 'flex'
          }}
        >
          <div style={{ 
            flex: '1', 
            background: 'linear-gradient(45deg, #4f46e5, #9333ea)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {imageData ? (
              <img
                src={imageData}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                color: 'white',
                fontSize: '72px',
                fontWeight: 'bold'
              }}>
                AI
              </div>
            )}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(45deg, rgba(79,70,229,0.2), rgba(147,51,234,0.2))'
            }} />
          </div>
          <div
            style={{
              flex: '1',
              padding: '40px',
              background: '#F8F8F8',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <h1
              style={{ 
                color: '#333333',
                fontSize: '48px',
                marginBottom: '20px',
                lineHeight: 1.2
              }}
            >
              {feed.aiProfile.name}'s AI Feed
            </h1>
            <p
              style={{ 
                color: '#666666',
                fontSize: '24px',
                marginBottom: '40px',
                lineHeight: 1.4
              }}
            >
              Generated with AI-stagram
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #4f46e5, #9333ea)'
                }}
              />
              <span style={{ color: '#333333', fontSize: '20px' }}>
                AI-stagram
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    )
    console.log("[OG] Image response generated successfully")
    return response
  } catch (error) {
    console.error('[OG] Error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: request.url
    })
    
    // Return a fallback image response instead of an error
    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '1200',
            height: '630',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4f46e5, #9333ea)',
              marginBottom: '24px'
            }}
          />
          <h1
            style={{
              fontSize: '48px',
              color: '#333333',
              marginBottom: '16px',
              textAlign: 'center'
            }}
          >
            AI-stagram Feed
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#666666',
              textAlign: 'center'
            }}
          >
            Generated with AI
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    )
  }
}
