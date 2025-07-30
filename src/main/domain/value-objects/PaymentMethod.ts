import { PaymentMethodData, PaymentMethodType } from '../../../shared/types/profile.types'
import { InvalidPaymentMethodError } from '../errors/ProfileErrors'

export class PaymentMethod {
  private constructor(
    private readonly _type: PaymentMethodType,
    private readonly _lastFourDigits: string | undefined,
    private readonly _expiryMonth: number | undefined,
    private readonly _expiryYear: number | undefined,
    private readonly _holderName: string
  ) {}

  static create(data: PaymentMethodData): PaymentMethod {
    this.validate(data)

    return new PaymentMethod(
      data.type,
      data.lastFourDigits,
      data.expiryMonth,
      data.expiryYear,
      data.holderName.trim()
    )
  }

  private static validate(data: PaymentMethodData): void {
    if (!data.type) {
      throw new InvalidPaymentMethodError('Payment method type is required')
    }

    if (!Object.values(PaymentMethodType).includes(data.type)) {
      throw new InvalidPaymentMethodError('Invalid payment method type')
    }

    if (!data.holderName?.trim()) {
      throw new InvalidPaymentMethodError('Card holder name is required')
    }

    // Validate card-specific fields
    if (data.type === PaymentMethodType.CREDIT_CARD || data.type === PaymentMethodType.DEBIT_CARD) {
      if (data.lastFourDigits && !/^\d{4}$/.test(data.lastFourDigits)) {
        throw new InvalidPaymentMethodError('Last four digits must be exactly 4 numbers')
      }

      if (data.expiryMonth !== undefined) {
        if (data.expiryMonth < 1 || data.expiryMonth > 12) {
          throw new InvalidPaymentMethodError('Expiry month must be between 1 and 12')
        }
      }

      if (data.expiryYear !== undefined) {
        const currentYear = new Date().getFullYear()
        if (data.expiryYear < currentYear) {
          throw new InvalidPaymentMethodError('Card has expired')
        }
        if (data.expiryYear > currentYear + 20) {
          throw new InvalidPaymentMethodError('Invalid expiry year')
        }
      }

      // Both expiry fields must be present or both absent
      if ((data.expiryMonth === undefined) !== (data.expiryYear === undefined)) {
        throw new InvalidPaymentMethodError('Both expiry month and year must be provided')
      }
    }
  }

  get type(): PaymentMethodType {
    return this._type
  }

  get lastFourDigits(): string | undefined {
    return this._lastFourDigits
  }

  get expiryMonth(): number | undefined {
    return this._expiryMonth
  }

  get expiryYear(): number | undefined {
    return this._expiryYear
  }

  get holderName(): string {
    return this._holderName
  }

  get isExpired(): boolean {
    if (this._expiryMonth === undefined || this._expiryYear === undefined) {
      return false
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    return (
      this._expiryYear < currentYear ||
      (this._expiryYear === currentYear && this._expiryMonth < currentMonth)
    )
  }

  get maskedDisplay(): string {
    switch (this._type) {
      case PaymentMethodType.CREDIT_CARD:
      case PaymentMethodType.DEBIT_CARD:
        return this._lastFourDigits ? `•••• ${this._lastFourDigits}` : '•••• ••••'
      case PaymentMethodType.PAYPAL:
        return 'PayPal'
      case PaymentMethodType.APPLE_PAY:
        return 'Apple Pay'
      case PaymentMethodType.GOOGLE_PAY:
        return 'Google Pay'
    }
  }

  toData(): PaymentMethodData {
    return {
      type: this._type,
      lastFourDigits: this._lastFourDigits,
      expiryMonth: this._expiryMonth,
      expiryYear: this._expiryYear,
      holderName: this._holderName
    }
  }

  equals(other: PaymentMethod): boolean {
    return (
      this._type === other._type &&
      this._lastFourDigits === other._lastFourDigits &&
      this._expiryMonth === other._expiryMonth &&
      this._expiryYear === other._expiryYear &&
      this._holderName === other._holderName
    )
  }
}
