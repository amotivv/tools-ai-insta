const { execSync } = require('child_process')

try {
  // Generate Prisma Client during postinstall
  execSync('npx prisma generate')
  console.log('✅ Prisma Client generated successfully')
} catch (error) {
  console.error('❌ Error generating Prisma Client:', error)
  process.exit(1)
}
