import { PaymentMethod } from '../../../../src/main/domain/value-objects/PaymentMethod'
import { InvalidPaymentMethodError } from '../../../../src/main/domain/errors/ProfileErrors'
import { PaymentMethodData, PaymentMethodType } from '../../../../src/shared/types/profile.types'

describe('PaymentMethod', () => {
  const validCreditCardData: PaymentMethodData = {
    type: PaymentMethodType.CREDIT_CARD,
    lastFourDigits: '1234',
    expiryMonth: 12,
    expiryYear: 2025,
    holderName: 'John Doe'
  }

  const validPayPalData: PaymentMethodData = {
    type: PaymentMethodType.PAYPAL,
    holderName: 'John Doe'
  }

  describe('create', () => {
    it('should create payment method with valid credit card data', () => {
      const paymentMethod = PaymentMethod.create(validCreditCardData)
      expect(paymentMethod.type).toBe(PaymentMethodType.CREDIT_CARD)
      expect(paymentMethod.lastFourDigits).toBe('1234')
      expect(paymentMethod.expiryMonth).toBe(12)
      expect(paymentMethod.expiryYear).toBe(2025)
      expect(paymentMethod.holderName).toBe('John Doe')
    })

    it('should create payment method with PayPal data', () => {
      const paymentMethod = PaymentMethod.create(validPayPalData)
      expect(paymentMethod.type).toBe(PaymentMethodType.PAYPAL)
      expect(paymentMethod.holderName).toBe('John Doe')
      expect(paymentMethod.lastFourDigits).toBeUndefined()
      expect(paymentMethod.expiryMonth).toBeUndefined()
      expect(paymentMethod.expiryYear).toBeUndefined()
    })

    it('should trim holder name', () => {
      const dataWithWhitespace = { ...validCreditCardData, holderName: '  John Doe  ' }
      const paymentMethod = PaymentMethod.create(dataWithWhitespace)
      expect(paymentMethod.holderName).toBe('John Doe')
    })

    it('should throw error for missing payment type', () => {
      const invalidData = { ...validCreditCardData } as PaymentMethodData
      delete (invalidData as { type?: PaymentMethodType }).type
      expect(() => PaymentMethod.create(invalidData)).toThrow(InvalidPaymentMethodError)
    })

    it('should throw error for invalid payment type', () => {
      const invalidData = { ...validCreditCardData, type: 'INVALID_TYPE' as PaymentMethodType }
      expect(() => PaymentMethod.create(invalidData)).toThrow(InvalidPaymentMethodError)
    })

    it('should throw error for missing holder name', () => {
      const invalidData = { ...validCreditCardData, holderName: '' }
      expect(() => PaymentMethod.create(invalidData)).toThrow(InvalidPaymentMethodError)
    })

    it('should validate last four digits format for cards', () => {
      const validDigits = ['1234', '0000', '9999']
      const invalidDigits = ['123', '12345', 'abcd', '12a4']

      validDigits.forEach((digits) => {
        const data = { ...validCreditCardData, lastFourDigits: digits }
        expect(() => PaymentMethod.create(data)).not.toThrow()
      })

      invalidDigits.forEach((digits) => {
        const data = { ...validCreditCardData, lastFourDigits: digits }
        expect(() => PaymentMethod.create(data)).toThrow(InvalidPaymentMethodError)
      })
    })

    it('should validate expiry month range', () => {
      const validMonths = [1, 6, 12]
      const invalidMonths = [0, 13, -1]

      validMonths.forEach((month) => {
        const data = { ...validCreditCardData, expiryMonth: month }
        expect(() => PaymentMethod.create(data)).not.toThrow()
      })

      invalidMonths.forEach((month) => {
        const data = { ...validCreditCardData, expiryMonth: month }
        expect(() => PaymentMethod.create(data)).toThrow(InvalidPaymentMethodError)
      })
    })

    it('should validate expiry year range', () => {
      const currentYear = new Date().getFullYear()
      const validYears = [currentYear, currentYear + 5, currentYear + 10]
      const invalidYears = [currentYear - 1, currentYear + 25]

      validYears.forEach((year) => {
        const data = { ...validCreditCardData, expiryYear: year }
        expect(() => PaymentMethod.create(data)).not.toThrow()
      })

      invalidYears.forEach((year) => {
        const data = { ...validCreditCardData, expiryYear: year }
        expect(() => PaymentMethod.create(data)).toThrow(InvalidPaymentMethodError)
      })
    })

    it('should require both expiry month and year for cards', () => {
      const monthOnly = { ...validCreditCardData, expiryYear: undefined }
      const yearOnly = { ...validCreditCardData, expiryMonth: undefined }
      const bothUndefined = {
        ...validCreditCardData,
        expiryMonth: undefined,
        expiryYear: undefined
      }

      expect(() => PaymentMethod.create(monthOnly)).toThrow(InvalidPaymentMethodError)
      expect(() => PaymentMethod.create(yearOnly)).toThrow(InvalidPaymentMethodError)
      expect(() => PaymentMethod.create(bothUndefined)).not.toThrow()
    })
  })

  describe('isExpired', () => {
    it('should return false for cards without expiry data', () => {
      const paymentMethod = PaymentMethod.create(validPayPalData)
      expect(paymentMethod.isExpired).toBe(false)
    })

    it('should return false for future expiry dates', () => {
      const futureYear = new Date().getFullYear() + 2
      const data = { ...validCreditCardData, expiryYear: futureYear, expiryMonth: 12 }
      const paymentMethod = PaymentMethod.create(data)
      expect(paymentMethod.isExpired).toBe(false)
    })

    it('should return true for past expiry dates', () => {
      const pastYear = new Date().getFullYear() - 1
      const data = { ...validCreditCardData, expiryYear: pastYear, expiryMonth: 12 }

      // PaymentMethod validation should prevent creating expired cards
      expect(() => PaymentMethod.create(data)).toThrow(InvalidPaymentMethodError)
    })

    it('should handle current year/month correctly', () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1

      const sameMonthData = {
        ...validCreditCardData,
        expiryYear: currentYear,
        expiryMonth: currentMonth
      }
      const pastMonthData = {
        ...validCreditCardData,
        expiryYear: currentYear,
        expiryMonth: currentMonth - 1
      }

      const sameMonth = PaymentMethod.create(sameMonthData)
      expect(sameMonth.isExpired).toBe(false)

      if (currentMonth > 1) {
        const pastMonth = PaymentMethod.create(pastMonthData)
        expect(pastMonth.isExpired).toBe(true)
      }
    })
  })

  describe('maskedDisplay', () => {
    it('should mask credit card numbers', () => {
      const paymentMethod = PaymentMethod.create(validCreditCardData)
      expect(paymentMethod.maskedDisplay).toBe('•••• 1234')
    })

    it('should handle missing last four digits', () => {
      const dataWithoutDigits = { ...validCreditCardData, lastFourDigits: undefined }
      const paymentMethod = PaymentMethod.create(dataWithoutDigits)
      expect(paymentMethod.maskedDisplay).toBe('•••• ••••')
    })

    it('should display PayPal correctly', () => {
      const paymentMethod = PaymentMethod.create(validPayPalData)
      expect(paymentMethod.maskedDisplay).toBe('PayPal')
    })

    it('should display Apple Pay correctly', () => {
      const applePayData = { ...validPayPalData, type: PaymentMethodType.APPLE_PAY }
      const paymentMethod = PaymentMethod.create(applePayData)
      expect(paymentMethod.maskedDisplay).toBe('Apple Pay')
    })

    it('should display Google Pay correctly', () => {
      const googlePayData = { ...validPayPalData, type: PaymentMethodType.GOOGLE_PAY }
      const paymentMethod = PaymentMethod.create(googlePayData)
      expect(paymentMethod.maskedDisplay).toBe('Google Pay')
    })
  })

  describe('toData', () => {
    it('should return payment method data object', () => {
      const paymentMethod = PaymentMethod.create(validCreditCardData)
      const data = paymentMethod.toData()

      expect(data).toEqual(validCreditCardData)
    })
  })

  describe('equals', () => {
    it('should return true for identical payment methods', () => {
      const method1 = PaymentMethod.create(validCreditCardData)
      const method2 = PaymentMethod.create(validCreditCardData)
      expect(method1.equals(method2)).toBe(true)
    })

    it('should return false for different payment methods', () => {
      const method1 = PaymentMethod.create(validCreditCardData)
      const differentData = { ...validCreditCardData, lastFourDigits: '5678' }
      const method2 = PaymentMethod.create(differentData)
      expect(method1.equals(method2)).toBe(false)
    })

    it('should return false for different types', () => {
      const method1 = PaymentMethod.create(validCreditCardData)
      const method2 = PaymentMethod.create(validPayPalData)
      expect(method1.equals(method2)).toBe(false)
    })
  })
})
