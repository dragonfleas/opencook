import { Email } from '../../../../src/main/domain/value-objects/Email'
import { InvalidProfileError } from '../../../../src/main/domain/errors/ProfileErrors'

describe('Email', () => {
  describe('create', () => {
    it('should create email with valid address', () => {
      const email = Email.create('test@example.com')
      expect(email.value).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM')
      expect(email.value).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ')
      expect(email.value).toBe('test@example.com')
    })

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow(InvalidProfileError)
      expect(() => Email.create('   ')).toThrow(InvalidProfileError)
    })

    it('should throw error for invalid email format', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid.com',
        'invalid@.com',
        'invalid@com.'
      ]

      invalidEmails.forEach((invalidEmail) => {
        expect(() => Email.create(invalidEmail)).toThrow(InvalidProfileError)
      })
    })

    it('should throw error for email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(() => Email.create(longEmail)).toThrow(InvalidProfileError)
    })

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example123.com',
        'test@subdomain.example.com'
      ]

      validEmails.forEach((validEmail) => {
        expect(() => Email.create(validEmail)).not.toThrow()
      })
    })
  })

  describe('equals', () => {
    it('should return true for identical emails', () => {
      const email1 = Email.create('test@example.com')
      const email2 = Email.create('test@example.com')
      expect(email1.equals(email2)).toBe(true)
    })

    it('should return true for emails that normalize to same value', () => {
      const email1 = Email.create('TEST@EXAMPLE.COM')
      const email2 = Email.create('test@example.com')
      expect(email1.equals(email2)).toBe(true)
    })

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com')
      const email2 = Email.create('test2@example.com')
      expect(email1.equals(email2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return email value as string', () => {
      const email = Email.create('test@example.com')
      expect(email.toString()).toBe('test@example.com')
    })
  })
})
