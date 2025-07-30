/**
 * Test script to verify migration system works correctly.
 * This can be run during development to test migrations.
 */

import { MigrationService } from '../src/main/infrastructure/database/migrations'
import { join } from 'path'
import { existsSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'

async function testMigrations(): Promise<void> {
  console.log('🧪 Testing Drizzle migration system...')

  // Create a temporary database for testing
  const tempDbPath = join(tmpdir(), `test-opencook-${Date.now()}.db`)
  const dbUrl = `file:${tempDbPath}`

  console.log(`📁 Using temporary database: ${tempDbPath}`)

  try {
    // Run migrations
    await MigrationService.runMigrations(dbUrl)

    // Check if database file was created
    if (existsSync(tempDbPath)) {
      console.log('✅ Database file created successfully')

      // Clean up
      unlinkSync(tempDbPath)
      console.log('🧹 Cleaned up temporary database')

      console.log('🎉 Migration test completed successfully!')
    } else {
      throw new Error('Database file was not created')
    }
  } catch (error) {
    console.error('❌ Migration test failed:', error)

    // Clean up on error
    if (existsSync(tempDbPath)) {
      unlinkSync(tempDbPath)
    }

    process.exit(1)
  }
}

// Run the test
testMigrations().catch(console.error)
