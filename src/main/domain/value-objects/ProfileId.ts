import { ProfileId as IProfileId } from '../../../shared/types/profile.types'
import { InvalidProfileError } from '../errors/ProfileErrors'
import { randomUUID } from 'crypto'

/**
 * Value object representing a unique profile identifier.
 *
 * ProfileId ensures that all profile identifiers are valid UUIDs and provides
 * a type-safe way to work with profile IDs throughout the domain layer.
 *
 * @example
 * ```typescript
 * // Generate a new profile ID
 * const newId = ProfileId.create();
 *
 * // Create from existing ID string
 * const existingId = ProfileId.create('123e4567-e89b-12d3-a456-426614174000');
 *
 * // Compare IDs
 * if (id1.equals(id2)) {
 *   console.log('Same profile');
 * }
 * ```
 *
 * @since 1.0.0
 */
export class ProfileId implements IProfileId {
  /**
   * Private constructor to enforce creation through factory method.
   *
   * @param _value - The UUID string value
   */
  private constructor(private readonly _value: string) {}

  /**
   * Factory method to create a ProfileId instance.
   *
   * If no ID is provided, generates a new UUID. If an ID is provided,
   * validates it as a proper UUID format before creating the instance.
   *
   * @param id - Optional existing UUID string. If not provided, generates new UUID
   * @returns New ProfileId instance
   *
   * @throws {InvalidProfileError} When provided ID is empty or has invalid UUID format
   *
   * @example
   * ```typescript
   * // Generate new ID
   * const newId = ProfileId.create();
   *
   * // Use existing ID
   * const existingId = ProfileId.create('123e4567-e89b-12d3-a456-426614174000');
   * ```
   */
  static create(id?: string): ProfileId {
    if (id !== undefined) {
      if (id === '') {
        throw new InvalidProfileError('id', 'Profile ID cannot be empty')
      }

      // Validate existing ID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        throw new InvalidProfileError('id', 'Invalid profile ID format')
      }
      return new ProfileId(id.toLowerCase())
    }

    // Generate new ID
    return new ProfileId(randomUUID())
  }

  /**
   * Gets the UUID string value of this ProfileId.
   *
   * @returns The UUID string in lowercase format
   */
  get value(): string {
    return this._value
  }

  /**
   * Compares this ProfileId with another for equality.
   *
   * @param other - Another ProfileId to compare with
   * @returns True if both ProfileIds have the same UUID value, false otherwise
   *
   * @example
   * ```typescript
   * const id1 = ProfileId.create('123e4567-e89b-12d3-a456-426614174000');
   * const id2 = ProfileId.create('123e4567-e89b-12d3-a456-426614174000');
   * console.log(id1.equals(id2)); // true
   * ```
   */
  equals(other: ProfileId): boolean {
    return this._value === other._value
  }

  /**
   * Returns the string representation of this ProfileId.
   *
   * @returns The UUID string value
   */
  toString(): string {
    return this._value
  }
}
