import { InvalidProfileError } from '../errors/ProfileErrors'

/**
 * Value object representing a profile name with validation rules.
 *
 * ProfileName ensures that all profile names meet business requirements:
 * - Between 3 and 50 characters in length
 * - Contains only alphanumeric characters, spaces, hyphens, and underscores
 * - Cannot be empty or whitespace-only
 *
 * @example
 * ```typescript
 * const profileName = ProfileName.create('Main Profile');
 * console.log(profileName.value); // 'Main Profile'
 *
 * // Validation examples
 * ProfileName.create('Hi'); // throws InvalidProfileError (too short)
 * ProfileName.create('Profile@Name'); // throws InvalidProfileError (invalid chars)
 * ```
 *
 * @since 1.0.0
 */
export class ProfileName {
  /** Minimum allowed length for profile names */
  private static readonly MIN_LENGTH = 3

  /** Maximum allowed length for profile names */
  private static readonly MAX_LENGTH = 50

  /** Valid character pattern for profile names */
  private static readonly VALID_PATTERN = /^[a-zA-Z0-9\s\-_]+$/

  /**
   * Private constructor to enforce creation through factory method.
   *
   * @param _value - The validated profile name string
   */
  private constructor(private readonly _value: string) {}

  /**
   * Factory method to create a ProfileName instance with validation.
   *
   * @param name - The profile name string to validate and create
   * @returns New ProfileName instance
   *
   * @throws {InvalidProfileError} When name fails validation rules
   *
   * @example
   * ```typescript
   * const name = ProfileName.create('My Profile');
   * console.log(name.value); // 'My Profile'
   * ```
   */
  static create(name: string): ProfileName {
    const trimmedName = name.trim()

    if (!trimmedName) {
      throw new InvalidProfileError('name', 'Profile name cannot be empty')
    }

    if (trimmedName.length < this.MIN_LENGTH) {
      throw new InvalidProfileError(
        'name',
        `Profile name must be at least ${this.MIN_LENGTH} characters`
      )
    }

    if (trimmedName.length > this.MAX_LENGTH) {
      throw new InvalidProfileError(
        'name',
        `Profile name cannot exceed ${this.MAX_LENGTH} characters`
      )
    }

    if (!this.VALID_PATTERN.test(trimmedName)) {
      throw new InvalidProfileError(
        'name',
        'Profile name can only contain letters, numbers, spaces, hyphens, and underscores'
      )
    }

    return new ProfileName(trimmedName)
  }

  /**
   * Gets the validated profile name string.
   *
   * @returns The profile name string
   */
  get value(): string {
    return this._value
  }

  /**
   * Compares this ProfileName with another for equality.
   *
   * @param other - Another ProfileName to compare with
   * @returns True if both ProfileNames have the same value, false otherwise
   */
  equals(other: ProfileName): boolean {
    return this._value === other._value
  }

  /**
   * Returns the string representation of this ProfileName.
   *
   * @returns The profile name string
   */
  toString(): string {
    return this._value
  }
}
