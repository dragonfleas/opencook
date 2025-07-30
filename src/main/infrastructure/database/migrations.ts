import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { readFileSync, existsSync, readdirSync } from 'fs'

/**
 * Migration service for running Drizzle migrations.
 * Handles database schema updates and version management.
 */
export class MigrationService {
  private static getMigrationPath(): string {
    if (typeof app !== 'undefined' && app.isPackaged) {
      return join(process.resourcesPath, 'drizzle')
    }
    return join(process.cwd(), 'drizzle')
  }

  /**
   * Runs pending migrations against the database.
   * Uses Drizzle's built-in migrator when available, falls back to manual SQL execution.
   * @param databaseUrl - The database connection URL
   * @throws {Error} If migration fails
   */
  static async runMigrations(databaseUrl?: string): Promise<void> {
    const dbUrl = databaseUrl || `file:${join(app.getPath('userData'), 'opencook.db')}`

    console.log('Running database migrations...')
    console.log('Database URL:', dbUrl)
    console.log('Migration path:', this.getMigrationPath())

    try {
      // Create better-sqlite3 database and drizzle instance for migrations
      const client = new Database(dbUrl.replace('file:', ''))
      const db = drizzle(client)

      // Try to use Drizzle's built-in migrator first
      try {
        await migrate(db, { migrationsFolder: this.getMigrationPath() })
        console.log('✅ Database migrations completed successfully using Drizzle migrator')
      } catch (migratorError) {
        console.warn(
          'Drizzle migrator failed, falling back to manual SQL execution:',
          migratorError
        )

        // Fallback: manually execute SQL migration files
        await this.runSqlMigrationsManually(client)
        console.log('✅ Database migrations completed successfully using manual SQL execution')
      }

      // Close the client
      client.close()
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Manually executes SQL migration files in order.
   * This is a fallback for packaged Electron apps where the migrator might not work.
   * @param client - The database client
   * @private
   */
  private static async runSqlMigrationsManually(client: Database.Database): Promise<void> {
    const migrationPath = this.getMigrationPath()
    if (!existsSync(migrationPath)) {
      console.log('No migration directory found, skipping migrations')
      return
    }

    // Get all .sql files in the migration directory
    const migrationFiles = readdirSync(migrationPath)
      .filter((file) => file.endsWith('.sql'))
      .sort() // Execute in alphabetical order (Drizzle uses timestamps)

    if (migrationFiles.length === 0) {
      console.log('No SQL migration files found')
      return
    }

    console.log(`Found ${migrationFiles.length} migration files:`, migrationFiles)

    // Create migrations tracking table if it doesn't exist
    client.exec(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)

    // Execute each migration file
    for (const file of migrationFiles) {
      const filePath = join(migrationPath, file)
      const migrationSql = readFileSync(filePath, 'utf-8')

      // Check if this migration has already been applied
      const existingMigration = client
        .prepare('SELECT hash FROM __drizzle_migrations WHERE hash = ?')
        .all(file)

      if (existingMigration.length > 0) {
        console.log(`⏭️  Migration ${file} already applied, skipping`)
        continue
      }

      console.log(`🔄 Applying migration: ${file}`)

      // Split migration into individual statements (Drizzle uses --> statement-breakpoint)
      const statements = migrationSql
        .split('--> statement-breakpoint')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0)

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          client.exec(statement)
        }
      }

      // Record that this migration has been applied
      client
        .prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)')
        .run(file, Date.now())

      console.log(`✅ Migration ${file} applied successfully`)
    }
  }

  /**
   * Gets the migration directory path.
   * @returns The absolute path to migration files
   */
  static getPublicMigrationPath(): string {
    return this.getMigrationPath()
  }
}
