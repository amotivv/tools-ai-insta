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
            width: '1200',
            height: '630',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            padding: '60px'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4f46e5, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              AI
            </div>
            <span style={{
              color: '#333333',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              AI-stagram
            </span>
          </div>

          {/* Main Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            gap: '60px'
          }}>
            {/* Left Column */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h1 style={{
                color: '#111111',
                fontSize: '64px',
                lineHeight: 1.1,
                margin: '0 0 24px 0',
                letterSpacing: '-0.02em'
              }}>
                {feed.aiProfile.name}'s<br />
                AI Feed
              </h1>
              <p style={{
                color: '#666666',
                fontSize: '32px',
                margin: 0,
                lineHeight: 1.4
              }}>
                {feed.aiProfile.photoStyle} photos of {feed.aiProfile.photoSubject.toLowerCase()}
              </p>
            </div>

            {/* Right Column */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              borderRadius: '24px',
              padding: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                textAlign: 'center',
                opacity: 0.9,
                padding: '0 20px',
                lineHeight: 1.2
              }}>
                {feed.aiProfile.photoSubject}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4f46e5'
            }} />
            <span style={{
              color: '#666666',
              fontSize: '20px'
            }}>
              Generated with AI
            </span>
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
            width: '1200',
            height: '630',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            padding: '60px'
          }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4f46e5, #9333ea)',
              marginBottom: '8px'
            }} />
            <h1 style={{
              color: '#111111',
              fontSize: '48px',
              margin: 0,
              textAlign: 'center'
            }}>
              AI-stagram Feed
            </h1>
            <p style={{
              color: '#666666',
              fontSize: '24px',
              margin: 0,
              textAlign: 'center'
            }}>
              Generated with AI
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    )
  }
}
