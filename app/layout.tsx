import { Toaster } from "sonner"
import type React from "react"
import "./globals.css"
import { Providers } from "./providers"

export const metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: {
    default: 'AI-stagram',
    template: '%s | AI-stagram'
  },
  description: 'Create your AI-powered Instagram feed',
  keywords: ['AI', 'Instagram', 'Feed Generator', 'AI Images', 'Social Media'],
  authors: [{ name: 'AI-stagram' }],
  creator: 'AI-stagram',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AI-stagram',
    description: 'Create your AI-powered Instagram feed',
    siteName: 'AI-stagram',
    images: [{
      url: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'AI-stagram - Create your AI Instagram feed'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-stagram',
    description: 'Create your AI-powered Instagram feed',
    images: [`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/og-image.png`],
    creator: '@aistagram'
  },
  icons: {
    icon: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/placeholder-logo.svg`,
    shortcut: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/placeholder-logo.svg`,
    apple: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/placeholder-logo.svg`,
  },
  manifest: '/manifest.json'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="font-mono bg-off-white">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
