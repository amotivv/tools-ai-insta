import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const ibmPlexMono = fetch(
  new URL('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&display=swap')
).then((res) => res.arrayBuffer())

export async function GET() {
  const font = await ibmPlexMono

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
          justifyContent: 'center',
          fontFamily: 'IBM Plex Mono',
          position: 'relative'
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(45deg, #f8f8f8 25%, transparent 25%, transparent 75%, #f8f8f8 75%, #f8f8f8), linear-gradient(45deg, #f8f8f8 25%, transparent 25%, transparent 75%, #f8f8f8 75%, #f8f8f8)',
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px',
            opacity: 0.2
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            zIndex: 1,
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '48px',
            borderRadius: '16px'
          }}
        >
          <img
            src={new URL('/public/placeholder-logo.svg', import.meta.url).toString()}
            alt=""
            style={{ width: '80px', height: '80px' }}
          />
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #4f46e5, #9333ea)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            AI-stagram
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: '#666666',
              margin: 0,
              textAlign: 'center',
              maxWidth: '80%',
              lineHeight: 1.4
            }}
          >
            Create your AI-powered Instagram feed
          </p>
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
}
