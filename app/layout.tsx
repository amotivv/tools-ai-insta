import { Toaster } from "sonner"
import type React from "react"
import "./globals.css"
import { Providers } from "./providers"

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
