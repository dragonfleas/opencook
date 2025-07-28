import { InvalidProfileError } from '../errors/ProfileErrors'

export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  private constructor(private readonly _value: string) {}

  static create(email: string): Email {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      throw new InvalidProfileError('email', 'Email cannot be empty')
    }

    if (!this.EMAIL_REGEX.test(trimmedEmail)) {
      throw new InvalidProfileError('email', 'Invalid email format')
    }

    if (trimmedEmail.length > 254) {
      throw new InvalidProfileError('email', 'Email is too long (max 254 characters)')
    }

    return new Email(trimmedEmail)
  }

  get value(): string {
    return this._value
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
