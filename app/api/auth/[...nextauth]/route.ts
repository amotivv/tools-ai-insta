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
  debug: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  events: {
    async signIn(message) {
      console.log("[NextAuth] Sign in:", message)
    },
    async signOut(message) {
      console.log("[NextAuth] Sign out:", message)
    },
    async session(message) {
      console.log("[NextAuth] Session:", message)
    }
  },
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
      console.log("[NextAuth] Sign In Callback:", { 
        user,
        account,
        profile
      })

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

        console.log("[NextAuth] User record:", { id: dbUser.id, email: dbUser.email })
        return true
      } catch (error) {
        console.error("[NextAuth] Error:", error)
        return true // Still allow sign in even if DB fails
      }
    },
    async jwt({ token, user, account }) {
      console.log("[NextAuth] JWT Callback:", { 
        hasUser: !!user, 
        hasAccount: !!account,
        token 
      })
      
      if (account && user) {
        // Use the database user ID
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email as string }
        })
        token.id = dbUser?.id || user.id
        token.tier = "BASIC"
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      console.log("[NextAuth] Session Callback:", { 
        hasUser: !!session?.user,
        token 
      })
      
      if (session.user) {
        session.user.id = token.id as string
        session.user.tier = token.tier as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig

export const { handlers: { GET, POST }, auth } = NextAuth(config)
