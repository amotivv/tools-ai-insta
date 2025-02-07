import { DefaultSession, DefaultUser } from "next-auth"
import { UserTier } from "@prisma/client"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      tier: UserTier
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    tier: UserTier
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tier?: UserTier
  }
}
