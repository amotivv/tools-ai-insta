import { ImageResponse } from 'next/og'
import { kv } from '@vercel/kv'

export const runtime = 'edge'

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

const ibmPlexMono = fetch(
  new URL('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&display=swap')
).then((res) => res.arrayBuffer())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new Response('Missing feed ID', { status: 400 })
    }

    // Get the feed data from KV
    const feed = await kv.get<SharedFeed>(`feed:${id}`)

    if (!feed) {
      return new Response('Feed not found', { status: 404 })
    }

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
    const firstImage = feed.posts[0]?.image || `${baseUrl}/placeholder.jpg`
    const font = await ibmPlexMono

    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '1200',
            height: '630',
            display: 'flex',
            fontFamily: 'IBM Plex Mono'
          }}
        >
          <div style={{ flex: '1', position: 'relative' }}>
            <img
              src={firstImage}
              alt=""
              style={{
                objectFit: 'cover',
                width: '100%',
                height: '100%'
              }}
            />
            {/* Add a subtle gradient overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))'
              }}
            />
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
              <img
                src={`${baseUrl}/placeholder-logo.svg`}
                alt=""
                style={{ width: '32px', height: '32px' }}
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
        height: 630,
        fonts: [
          {
            name: 'IBM Plex Mono',
            data: font,
            style: 'normal'
          }
        ]
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Error generating image', { status: 500 })
  }
}
