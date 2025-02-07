const { execSync } = require('child_process')

try {
  // Generate Prisma Client during postinstall
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated successfully')

  // Only run migrations in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Running database migrations in development...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Database migrations completed')
  }
} catch (error) {
  console.error('❌ Error in postinstall script:', error)
  process.exit(1)
}
