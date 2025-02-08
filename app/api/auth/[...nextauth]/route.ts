import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"
import { DefaultSession } from "next-auth"
import { prisma } from "@/lib/prisma"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      tier: string
    } & DefaultSession["user"]
  }
}

const config = {
  debug: false,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Ensure user exists in database
        const dbUser = await prisma.user.upsert({
          where: { 
            email: user.email as string 
          },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            id: user.id || undefined, // Let Prisma generate if not provided
            email: user.email,
            name: user.name,
            image: user.image,
          }
        })

        // Preserve admin scope if it exists
        if (account) {
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          })

          const scope = existingAccount?.scope?.includes('admin') 
            ? `${account.scope},admin`
            : account.scope
            
          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }
            },
            update: {
              ...account,
              scope,
              userId: dbUser.id,
            },
            create: {
              ...account,
              userId: dbUser.id,
            }
          })
        }

        return true
      } catch (error) {
        console.error("[NextAuth] Error:", error)
        return true // Still allow sign in even if DB fails
      }
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        // Use the database user ID
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string }
        })
        token.id = dbUser?.id || user.id
        token.tier = dbUser?.tier || "BASIC"
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // Get fresh user data on each session
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string }
        })
        
        session.user.id = token.id as string
        session.user.tier = dbUser?.tier || "BASIC"
        
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig

export const { handlers: { GET, POST }, auth } = NextAuth(config)
