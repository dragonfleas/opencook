import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export class DatabaseConnection {
  private static instance: DatabaseConnection
  private db: Database<sqlite3.Database, sqlite3.Statement> | null = null

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  async initialize(): Promise<void> {
    if (this.db) {
      return // Already initialized
    }

    const dbPath = this.getDatabasePath()

    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Enable foreign keys and WAL mode for better performance
    await this.db.exec('PRAGMA foreign_keys = ON')
    await this.db.exec('PRAGMA journal_mode = WAL')
    await this.db.exec('PRAGMA synchronous = NORMAL')
    await this.db.exec('PRAGMA cache_size = 1000')
    await this.db.exec('PRAGMA temp_store = MEMORY')

    // Run schema initialization
    await this.runSchema()
  }

  private getDatabasePath(): string {
    const userDataPath = app.getPath('userData')
    return join(userDataPath, 'opencook.db')
  }

  private async runSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    // Split schema by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      await this.db.exec(statement)
    }
  }

  getDatabase(): Database<sqlite3.Database, sqlite3.Statement> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.db
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }

  async beginTransaction(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    await this.db.exec('BEGIN TRANSACTION')
  }

  async commitTransaction(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    await this.db.exec('COMMIT')
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    await this.db.exec('ROLLBACK')
  }
}
