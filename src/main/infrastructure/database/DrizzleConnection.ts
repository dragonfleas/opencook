import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { join, dirname } from 'path'
import { app } from 'electron'
import { mkdirSync, existsSync } from 'fs'
import { MigrationService } from './migrations'

/**
 * Drizzle database connection service following Clean Architecture principles.
 * Provides a singleton instance of Drizzle client for the application.
 * Direct replacement for PrismaConnection with identical interface.
 */
export class DrizzleConnection {
  private static instance: DrizzleConnection
  private db: BetterSQLite3Database<Record<string, never>> | null = null
  private client: Database.Database | null = null

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Gets the singleton instance of DrizzleConnection.
   * @returns The singleton DrizzleConnection instance
   */
  static getInstance(): DrizzleConnection {
    if (!DrizzleConnection.instance) {
      DrizzleConnection.instance = new DrizzleConnection()
    }
    return DrizzleConnection.instance
  }

  /**
   * Initializes the Drizzle connection if not already connected.
   * @throws {Error} If connection fails
   */
  async connect(): Promise<void> {
    if (this.db) {
      return
    }

    try {
      // Use absolute path for database file to avoid Windows path issues
      const dbPath = this.getDatabaseUrl()
      console.log('Database connection details:', {
        dbPath,
        userDataDir: app.getPath('userData'),
        cwd: process.cwd(),
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node
      })

      // Create better-sqlite3 database
      console.log('Creating better-sqlite3 database instance...')
      const cleanPath = dbPath.replace('file:', '')
      console.log('Clean database path:', cleanPath)

      // Ensure the directory exists
      const dbDir = dirname(cleanPath)
      if (!existsSync(dbDir)) {
        console.log('Creating database directory:', dbDir)
        mkdirSync(dbDir, { recursive: true })
      }

      this.client = new Database(cleanPath)
      console.log('better-sqlite3 database instance created successfully')

      // Create Drizzle instance
      console.log('Creating Drizzle ORM instance...')
      this.db = drizzle(this.client)
      console.log('Drizzle ORM instance created successfully')

      // Test the connection by running a simple query
      console.log('Testing database connection...')
      const testResult = this.client.prepare('SELECT 1 AS test').get()
      console.log('Database test query result:', testResult)

      // Run database migrations
      console.log('Running database migrations...')
      await this.runMigrations()
      console.log('Database migrations completed')

      console.log('Drizzle database connection established successfully')
    } catch (error) {
      console.error('Failed to connect to database:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as { code?: string })?.code || 'Unknown'
      })

      // Clean up on error
      if (this.client) {
        try {
          this.client.close()
        } catch (closeError) {
          console.error('Error closing database on cleanup:', closeError)
        }
        this.client = null
      }
      this.db = null

      throw new Error(
        `Database connection failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * Gets the Drizzle database instance.
   * @returns The Drizzle database instance
   * @throws {Error} If not connected
   */
  getClient(): BetterSQLite3Database<Record<string, never>> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  /**
   * Closes the database connection.
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close()
      this.client = null
      this.db = null
      console.log('Drizzle database connection closed')
    }
  }

  /**
   * Executes operations within a transaction.
   * @param callback - Function to execute within transaction
   * @returns Promise resolving to the callback result
   * @throws {Error} If not connected or transaction fails
   */
  async transaction<T>(
    callback: (db: BetterSQLite3Database<Record<string, never>>) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }

    return this.db.transaction(async (tx) => {
      // Cast tx to the expected type for callback compatibility
      return callback(tx as BetterSQLite3Database<Record<string, never>>)
    })
  }

  /**
   * Runs database migrations to ensure schema is up to date.
   * @private
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    try {
      await MigrationService.runMigrations(this.getDatabaseUrl())
    } catch (error) {
      console.error('Failed to run migrations:', error)
      throw new Error(`Migration failed: ${error}`)
    }
  }

  /**
   * Gets the current database URL.
   * @private
   */
  private getDatabaseUrl(): string {
    return process.env.DATABASE_URL || `file:${join(app.getPath('userData'), 'opencook.db')}`
  }
}
