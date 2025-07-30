import { AddressData } from '../../../shared/types/profile.types'
import { InvalidAddressError } from '../errors/ProfileErrors'

export class Address {
  private constructor(
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _addressLine1: string,
    private readonly _addressLine2: string | undefined,
    private readonly _city: string,
    private readonly _state: string,
    private readonly _postalCode: string,
    private readonly _country: string
  ) {}

  static create(data: AddressData): Address {
    this.validate(data)

    return new Address(
      data.firstName.trim(),
      data.lastName.trim(),
      data.addressLine1.trim(),
      data.addressLine2?.trim(),
      data.city.trim(),
      data.state.trim().toUpperCase(),
      data.postalCode.trim(),
      data.country.trim().toUpperCase()
    )
  }

  private static validate(data: AddressData): void {
    if (!data.firstName?.trim()) {
      throw new InvalidAddressError('firstName', 'First name is required')
    }

    if (!data.lastName?.trim()) {
      throw new InvalidAddressError('lastName', 'Last name is required')
    }

    if (!data.addressLine1?.trim()) {
      throw new InvalidAddressError('addressLine1', 'Address line 1 is required')
    }

    if (!data.city?.trim()) {
      throw new InvalidAddressError('city', 'City is required')
    }

    if (!data.state?.trim()) {
      throw new InvalidAddressError('state', 'State is required')
    }

    if (!data.postalCode?.trim()) {
      throw new InvalidAddressError('postalCode', 'Postal code is required')
    }

    if (!data.country?.trim()) {
      throw new InvalidAddressError('country', 'Country is required')
    }

    // US postal code validation
    if (data.country.toUpperCase() === 'US' || data.country.toUpperCase() === 'USA') {
      const usZipRegex = /^\d{5}(-\d{4})?$/
      if (!usZipRegex.test(data.postalCode.trim())) {
        throw new InvalidAddressError('postalCode', 'Invalid US postal code format')
      }
    }

    // State code validation for US
    if (data.country.toUpperCase() === 'US' || data.country.toUpperCase() === 'USA') {
      if (data.state.trim().length !== 2) {
        throw new InvalidAddressError('state', 'US state must be a 2-letter code')
      }
    }
  }

  get firstName(): string {
    return this._firstName
  }

  get lastName(): string {
    return this._lastName
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`
  }

  get addressLine1(): string {
    return this._addressLine1
  }

  get addressLine2(): string | undefined {
    return this._addressLine2
  }

  get city(): string {
    return this._city
  }

  get state(): string {
    return this._state
  }

  get postalCode(): string {
    return this._postalCode
  }

  get country(): string {
    return this._country
  }

  toData(): AddressData {
    return {
      firstName: this._firstName,
      lastName: this._lastName,
      addressLine1: this._addressLine1,
      addressLine2: this._addressLine2,
      city: this._city,
      state: this._state,
      postalCode: this._postalCode,
      country: this._country
    }
  }

  equals(other: Address): boolean {
    return (
      this._firstName === other._firstName &&
      this._lastName === other._lastName &&
      this._addressLine1 === other._addressLine1 &&
      this._addressLine2 === other._addressLine2 &&
      this._city === other._city &&
      this._state === other._state &&
      this._postalCode === other._postalCode &&
      this._country === other._country
    )
  }

  toString(): string {
    const lines = [
      this.fullName,
      this._addressLine1,
      this._addressLine2,
      `${this._city}, ${this._state} ${this._postalCode}`,
      this._country
    ].filter(Boolean)

    return lines.join('\n')
  }
}
