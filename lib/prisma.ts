import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['error', 'warn'],
  })

  // Test database connection
  client.$connect()
    .then(() => {
      console.log('Successfully connected to database')
    })
    .catch((error: Error) => {
      console.error('Failed to connect to database:', error.message)
    })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle cleanup
// Ensure proper cleanup
process.on('beforeExit', async () => {
  console.log('Disconnecting from database...')
  try {
    await prisma.$disconnect()
    console.log('Successfully disconnected from database')
  } catch (error: unknown) {
    console.error('Error disconnecting from database:', 
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
})
