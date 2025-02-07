import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"
import { DefaultSession } from "next-auth"

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
    async signIn({ user, account }) {
      console.log("[NextAuth] Sign In Callback:", { 
        user,
        account 
      })
      return true
    },
    async jwt({ token, user, account }) {
      console.log("[NextAuth] JWT Callback:", { 
        hasUser: !!user, 
        hasAccount: !!account,
        token 
      })
      
      if (account && user) {
        token.id = user.id
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
