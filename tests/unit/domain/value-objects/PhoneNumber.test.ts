import { PhoneNumber } from '../../../../src/main/domain/value-objects/PhoneNumber'
import { InvalidProfileError } from '../../../../src/main/domain/errors/ProfileErrors'

describe('PhoneNumber', () => {
  describe('create', () => {
    it('should return undefined for empty or null phone number', () => {
      expect(PhoneNumber.create()).toBeUndefined()
      expect(PhoneNumber.create('')).toBeUndefined()
      expect(PhoneNumber.create('   ')).toBeUndefined()
    })

    it('should create phone number with valid formats', () => {
      const validNumbers = [
        '1234567890',
        '+1-234-567-8900',
        '(123) 456-7890',
        '+1 (234) 567-8900',
        '123.456.7890'
      ]

      validNumbers.forEach((number) => {
        const phoneNumber = PhoneNumber.create(number)
        expect(phoneNumber).toBeDefined()
        expect(phoneNumber!.value).toBe(number)
      })
    })

    it('should throw error for invalid phone number format', () => {
      const invalidNumbers = ['abc1234567', '123-abc-7890', '123#456#7890', 'not-a-phone']

      invalidNumbers.forEach((number) => {
        expect(() => PhoneNumber.create(number)).toThrow(InvalidProfileError)
      })
    })

    it('should throw error for phone number too short', () => {
      expect(() => PhoneNumber.create('123456789')).toThrow(InvalidProfileError)
    })

    it('should throw error for phone number too long', () => {
      expect(() => PhoneNumber.create('12345678901234567')).toThrow(InvalidProfileError)
    })

    it('should accept phone numbers with exact length limits', () => {
      const tenDigits = '1234567890'
      const fifteenDigits = '123456789012345'

      expect(() => PhoneNumber.create(tenDigits)).not.toThrow()
      expect(() => PhoneNumber.create(fifteenDigits)).not.toThrow()
    })
  })

  describe('digits', () => {
    it('should return only digits from formatted phone number', () => {
      const phoneNumber = PhoneNumber.create('+1 (234) 567-8900')!
      expect(phoneNumber.digits).toBe('12345678900')
    })

    it('should return digits for plain number', () => {
      const phoneNumber = PhoneNumber.create('1234567890')!
      expect(phoneNumber.digits).toBe('1234567890')
    })
  })

  describe('equals', () => {
    it('should return true for phone numbers with same digits', () => {
      const phone1 = PhoneNumber.create('(123) 456-7890')!
      const phone2 = PhoneNumber.create('123-456-7890')!
      expect(phone1.equals(phone2)).toBe(true)
    })

    it('should return false for phone numbers with different digits', () => {
      const phone1 = PhoneNumber.create('1234567890')!
      const phone2 = PhoneNumber.create('1234567891')!
      expect(phone1.equals(phone2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return original formatted value', () => {
      const originalFormat = '+1 (234) 567-8900'
      const phoneNumber = PhoneNumber.create(originalFormat)!
      expect(phoneNumber.toString()).toBe(originalFormat)
    })
  })
})
