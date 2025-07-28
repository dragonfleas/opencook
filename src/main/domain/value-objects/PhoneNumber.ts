import { InvalidProfileError } from '../errors/ProfileErrors'

export class PhoneNumber {
  private static readonly PHONE_REGEX = /^\+?[\d\s\-().]+$/

  private constructor(private readonly _value: string) {}

  static create(phoneNumber?: string): PhoneNumber | undefined {
    if (!phoneNumber) {
      return undefined
    }

    const cleaned = phoneNumber.trim().replace(/[\s\-().]/g, '')

    if (!cleaned) {
      return undefined
    }

    if (!this.PHONE_REGEX.test(phoneNumber)) {
      throw new InvalidProfileError('phoneNumber', 'Invalid phone number format')
    }

    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new InvalidProfileError('phoneNumber', 'Phone number must be between 10 and 15 digits')
    }

    return new PhoneNumber(phoneNumber.trim())
  }

  get value(): string {
    return this._value
  }

  get digits(): string {
    return this._value.replace(/[\s\-().+]/g, '')
  }

  equals(other: PhoneNumber): boolean {
    return this.digits === other.digits
  }

  toString(): string {
    return this._value
  }
}
