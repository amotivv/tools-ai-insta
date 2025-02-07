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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new Response('Missing feed ID', { status: 400 })
    }

    const feed = await kv.get<SharedFeed>(`feed:${id}`)
    if (!feed) {
      return new Response('Feed not found', { status: 404 })
    }

    return new ImageResponse(
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
            color: 'white',
            fontSize: '72px',
            fontWeight: 'bold'
          }}>
            {feed.aiProfile.photoSubject}
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
              {feed.aiProfile.photoStyle} photos generated with AI-stagram
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
  } catch (error) {
    console.error('[OG] Error:', error)
    
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
