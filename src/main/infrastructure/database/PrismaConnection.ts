import { PrismaClient } from '@prisma/client'

/**
 * Prisma database connection service following Clean Architecture principles.
 * Provides a singleton instance of PrismaClient for the application.
 */
export class PrismaConnection {
  private static instance: PrismaConnection
  private prisma: PrismaClient | null = null

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Gets the singleton instance of PrismaConnection.
   * @returns The singleton PrismaConnection instance
   */
  static getInstance(): PrismaConnection {
    if (!PrismaConnection.instance) {
      PrismaConnection.instance = new PrismaConnection()
    }
    return PrismaConnection.instance
  }

  /**
   * Initializes the Prisma connection if not already connected.
   * @throws {Error} If connection fails
   */
  async connect(): Promise<void> {
    if (this.prisma) {
      return
    }

    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'file:./opencook.db'
          }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
      })

      // Test the connection
      await this.prisma.$connect()

      console.log('Prisma database connection established')
    } catch (error) {
      console.error('Failed to connect to database:', error)
      throw new Error(`Database connection failed: ${error}`)
    }
  }

  /**
   * Gets the Prisma client instance.
   * @returns The Prisma client instance
   * @throws {Error} If not connected
   */
  getClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.prisma
  }

  /**
   * Closes the database connection.
   */
  async disconnect(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
      this.prisma = null
      console.log('Prisma database connection closed')
    }
  }

  /**
   * Executes operations within a transaction.
   * @param callback - Function to execute within transaction
   * @returns Promise resolving to the callback result
   * @throws {Error} If not connected or transaction fails
   */
  async transaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    if (!this.prisma) {
      throw new Error('Database not connected. Call connect() first.')
    }

    return this.prisma.$transaction(async (tx) => {
      return callback(tx as PrismaClient)
    })
  }
}
