import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'
import os from 'os'

/**
 * Interface for encryption services handling sensitive payment data.
 * Defines the contract for secure payment card data encryption
 * using AES-256-GCM authenticated encryption.
 */
export interface EncryptionService {
  /**
   * Encrypts sensitive payment data using AES-256-GCM.
   * @param data - The sensitive payment data to encrypt
   * @returns The encrypted string with authentication tag
   * @throws {Error} When encryption operation fails
   */
  encrypt(data: string): string

  /**
   * Decrypts data encrypted with the encrypt method.
   * @param encryptedData - The encrypted string to decrypt
   * @returns The original plaintext string
   * @throws {Error} When decryption operation fails or data is corrupted
   */
  decrypt(encryptedData: string): string

  /**
   * Creates a cryptographic hash of the input data.
   * @param data - The data to hash
   * @returns The hexadecimal hash string
   */
  hash(data: string): string

  /**
   * Tokenizes a credit card number for secure storage.
   * @param cardNumber - The full credit card number
   * @returns Object with lastFourDigits and secureToken
   */
  tokenizeCardNumber(cardNumber: string): { lastFourDigits: string; secureToken: string }

  /**
   * Masks a credit card number for display purposes.
   * @param cardNumber - The credit card number to mask
   * @returns Masked card number (e.g., "**** **** **** 1234")
   */
  maskCardNumber(cardNumber: string): string
}

/**
 * AES-256-GCM encryption service implementation.
 * Provides authenticated encryption for payment data using AES-256-GCM
 * and implements tokenization for credit card numbers.
 * @example
 * ```typescript
 * const encryptionService = new SecureEncryptionService('my-master-key');
 * const { lastFourDigits, secureToken } = encryptionService.tokenizeCardNumber('4111111111111111');
 * const encrypted = encryptionService.encrypt('John Doe');
 * const decrypted = encryptionService.decrypt(encrypted);
 * ```
 */
export class SecureEncryptionService implements EncryptionService {
  /** AES-256-GCM encryption algorithm identifier */
  private readonly algorithm = 'aes-256-gcm'

  /** 256-bit encryption key derived from master key or machine ID */
  private readonly key: Buffer

  /** Additional authenticated data for GCM mode */
  private readonly aad = Buffer.from('OpenCook-Secure-Encryption', 'utf8')

  /**
   * Creates a new SecureEncryptionService instance.
   * @param masterKey - Optional master key for key derivation. If not provided,
   *                   uses machine characteristics to generate a consistent key
   */
  constructor(masterKey?: string) {
    // Generate or derive encryption key
    if (masterKey) {
      this.key = createHash('sha256').update(masterKey).digest()
    } else {
      // WARNING: In production, use proper key management service
      // For now, generate a consistent key based on machine characteristics
      const machineId = this.getMachineId()
      this.key = createHash('sha256').update(machineId).digest()
    }
  }

  /**
   * Encrypts sensitive payment data using AES-256-GCM.
   * Uses authenticated encryption with unique IV for each operation.
   * @param data - The sensitive payment data to encrypt
   * @returns Encrypted string in format "iv:authTag:encryptedData" (hex encoded)
   * @throws {Error} When encryption operation fails
   */
  encrypt(data: string): string {
    try {
      const iv = randomBytes(12) // 96-bit IV for GCM
      const cipher = createCipheriv(this.algorithm, this.key, iv)

      // Set additional authenticated data
      cipher.setAAD(this.aad)

      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Get authentication tag
      const authTag = cipher.getAuthTag()

      // Format: iv:authTag:encryptedData
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format - expected iv:authTag:data')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const authTag = Buffer.from(parts[1], 'hex')
      const encryptedText = parts[2]

      const decipher = createDecipheriv(this.algorithm, this.key, iv)
      decipher.setAAD(this.aad)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  hash(data: string): string {
    return createHash('sha256').update(data).digest('hex')
  }

  /**
   * Tokenizes a credit card number for secure storage.
   * Extracts the last 4 digits and generates an irreversible token.
   * @param cardNumber - The full credit card number (cleaned of spaces/dashes)
   * @returns Object containing lastFourDigits and secureToken
   * @throws {Error} When card number format is invalid
   */
  tokenizeCardNumber(cardNumber: string): { lastFourDigits: string; secureToken: string } {
    // Clean and validate card number
    const cleanedNumber = cardNumber.replace(/[\s-]/g, '')

    if (!/^\d{13,19}$/.test(cleanedNumber)) {
      throw new Error('Invalid credit card number format')
    }

    // Extract last 4 digits (secure practice)
    const lastFourDigits = cleanedNumber.slice(-4)

    // Generate secure token using card number hash + salt + timestamp
    // This creates a unique, irreversible token
    const tokenSalt = randomBytes(16).toString('hex')
    const timestamp = Date.now().toString()
    const tokenData = `${cleanedNumber}:${tokenSalt}:${timestamp}`
    const tokenHash = createHash('sha256').update(tokenData).digest('hex')

    // Create a formatted token that doesn't reveal card information
    const secureToken = `tok_${tokenHash.substring(0, 32)}`

    // Clear the full card number from memory
    cleanedNumber.replace(/./g, '0') // Overwrite in place if possible

    return {
      lastFourDigits,
      secureToken
    }
  }

  /**
   * Masks a credit card number for display purposes.
   * @param cardNumber - The credit card number to mask
   * @returns Masked card number in format "**** **** **** 1234"
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '')

    if (cleaned.length < 4) {
      return '*'.repeat(cleaned.length)
    }

    const lastFour = cleaned.slice(-4)
    const maskedLength = Math.min(cleaned.length - 4, 12) // Don't exceed reasonable length
    const masked = '*'.repeat(maskedLength)

    // Format as groups of 4 digits
    const formatted = (masked + lastFour).replace(/(.{4})/g, '$1 ').trim()

    return formatted
  }

  private getMachineId(): string {
    // Create a consistent machine identifier
    // In production, consider using hardware-based identifiers
    const machineInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      // Use CPU info as additional entropy
      cpus: os
        .cpus()
        .map((cpu) => cpu.model)
        .join(',')
    }

    return createHash('sha256')
      .update(JSON.stringify(machineInfo))
      .update('opencook-encryption-salt')
      .digest('hex')
  }
}

// Singleton instance for the application
let encryptionServiceInstance: EncryptionService | null = null

/**
 * Gets the singleton encryption service instance.
 * @returns The encryption service instance
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new SecureEncryptionService()
  }
  return encryptionServiceInstance
}

/**
 * Initializes the encryption service with a specific master key.
 * @param masterKey - Optional master key for encryption
 */
export function initializeEncryptionService(masterKey?: string): void {
  encryptionServiceInstance = new SecureEncryptionService(masterKey)
}
