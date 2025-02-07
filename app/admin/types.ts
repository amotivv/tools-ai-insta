export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  isActive: boolean
  tier: 'BASIC' | 'PREMIUM'
  createdAt: Date
  accounts: {
    provider: string
    scope: string | null
  }[]
  _count: {
    generatedImages: number
    sharedFeeds: number
  }
}

export interface AdminFeed {
  id: string
  images: string[]
  views: number
  isActive: boolean
  createdAt: Date
  user: {
    name: string | null
    email: string | null
    isActive: boolean
  }
}
