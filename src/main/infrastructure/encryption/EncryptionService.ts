import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'
import os from 'os'

/**
 * Interface for encryption services providing symmetric encryption capabilities.
 *
 * This interface defines the contract for encrypting and decrypting sensitive data
 * such as payment method information, ensuring data security in the application.
 *
 * @since 1.0.0
 */
export interface EncryptionService {
  /**
   * Encrypts a plaintext string.
   *
   * @param data - The plaintext string to encrypt
   * @returns The encrypted string representation
   *
   * @throws {Error} When encryption operation fails
   */
  encrypt(data: string): string

  /**
   * Decrypts an encrypted string back to plaintext.
   *
   * @param encryptedData - The encrypted string to decrypt
   * @returns The original plaintext string
   *
   * @throws {Error} When decryption operation fails or data is corrupted
   */
  decrypt(encryptedData: string): string

  /**
   * Creates a cryptographic hash of the input data.
   *
   * @param data - The data to hash
   * @returns The hexadecimal hash string
   */
  hash(data: string): string
}

/**
 * AES-256-CBC encryption service implementation.
 *
 * This service provides secure encryption for sensitive data using the AES-256-CBC
 * algorithm. It automatically generates initialization vectors and derives encryption
 * keys either from a provided master key or from machine characteristics.
 *
 * @example
 * ```typescript
 * const encryptionService = new AESEncryptionService('my-master-key');
 *
 * const sensitive = '{"cardNumber": "4111111111111111"}';
 * const encrypted = encryptionService.encrypt(sensitive);
 * const decrypted = encryptionService.decrypt(encrypted);
 * console.log(decrypted === sensitive); // true
 * ```
 *
 * @since 1.0.0
 */
export class AESEncryptionService implements EncryptionService {
  /** AES encryption algorithm identifier */
  private readonly algorithm = 'aes-256-cbc'

  /** 256-bit encryption key derived from master key or machine ID */
  private readonly key: Buffer

  /**
   * Creates a new AESEncryptionService instance.
   *
   * The service derives a 256-bit encryption key either from the provided master key
   * or from machine characteristics for consistency across application restarts.
   *
   * @param masterKey - Optional master key for key derivation. If not provided,
   *                   uses machine characteristics to generate a consistent key
   *
   * @example
   * ```typescript
   * // With explicit master key
   * const service1 = new AESEncryptionService('my-secret-key');
   *
   * // With machine-derived key
   * const service2 = new AESEncryptionService();
   * ```
   */
  constructor(masterKey?: string) {
    // Generate or derive encryption key
    if (masterKey) {
      this.key = createHash('sha256').update(masterKey).digest()
    } else {
      // In production, this should come from secure key management
      // For now, generate a consistent key based on machine characteristics
      const machineId = this.getMachineId()
      this.key = createHash('sha256').update(machineId).digest()
    }
  }

  /**
   * Encrypts plaintext data using AES-256-CBC encryption.
   *
   * This method generates a random initialization vector (IV) for each encryption
   * operation and prepends it to the encrypted data for later decryption.
   *
   * @param data - The plaintext string to encrypt
   * @returns Encrypted string in format "iv:encryptedData" (hex encoded)
   *
   * @throws {Error} When encryption operation fails
   *
   * @example
   * ```typescript
   * const encrypted = service.encrypt('sensitive data');
   * console.log(encrypted); // "a1b2c3d4...:e5f6g7h8..."
   * ```
   */
  encrypt(data: string): string {
    try {
      const iv = randomBytes(16)
      const cipher = createCipheriv(this.algorithm, this.key, iv)

      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      // Prepend IV to encrypted data
      return iv.toString('hex') + ':' + encrypted
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':')
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format')
      }

      const iv = Buffer.from(parts[0], 'hex')
      const encryptedText = parts[1]

      const decipher = createDecipheriv(this.algorithm, this.key, iv)

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

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new AESEncryptionService()
  }
  return encryptionServiceInstance
}

export function initializeEncryptionService(masterKey?: string): void {
  encryptionServiceInstance = new AESEncryptionService(masterKey)
}
