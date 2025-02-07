import { Toaster } from "sonner"
import type React from "react"
import "./globals.css"
import { Providers } from "./providers"

export const metadata = {
  metadataBase: new URL('https://v0-insta-ai.vercel.app'),
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
      url: 'https://v0-insta-ai.vercel.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'AI-stagram - Create your AI Instagram feed'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI-stagram',
    description: 'Create your AI-powered Instagram feed',
    images: ['https://v0-insta-ai.vercel.app/og-image.png'],
    creator: '@aistagram'
  },
  icons: {
    icon: 'https://v0-insta-ai.vercel.app/placeholder-logo.svg',
    shortcut: 'https://v0-insta-ai.vercel.app/placeholder-logo.svg',
    apple: 'https://v0-insta-ai.vercel.app/placeholder-logo.svg',
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
