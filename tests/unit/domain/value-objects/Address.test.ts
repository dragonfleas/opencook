import { Address } from '../../../../src/main/domain/value-objects/Address'
import { InvalidAddressError } from '../../../../src/main/domain/errors/ProfileErrors'
import { AddressData } from '../../../../src/shared/types/profile.types'

describe('Address', () => {
  const validAddressData: AddressData = {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  }

  describe('create', () => {
    it('should create address with valid data', () => {
      const address = Address.create(validAddressData)
      expect(address.firstName).toBe('John')
      expect(address.lastName).toBe('Doe')
      expect(address.addressLine1).toBe('123 Main St')
      expect(address.addressLine2).toBe('Apt 4B')
      expect(address.city).toBe('New York')
      expect(address.state).toBe('NY')
      expect(address.postalCode).toBe('10001')
      expect(address.country).toBe('US')
    })

    it('should trim whitespace from all fields', () => {
      const dataWithWhitespace: AddressData = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        addressLine1: '  123 Main St  ',
        addressLine2: '  Apt 4B  ',
        city: '  New York  ',
        state: '  ny  ',
        postalCode: '  10001  ',
        country: '  us  '
      }

      const address = Address.create(dataWithWhitespace)
      expect(address.firstName).toBe('John')
      expect(address.lastName).toBe('Doe')
      expect(address.state).toBe('NY')
      expect(address.country).toBe('US')
    })

    it('should handle optional addressLine2', () => {
      const dataWithoutLine2 = { ...validAddressData, addressLine2: undefined }
      const address = Address.create(dataWithoutLine2)
      expect(address.addressLine2).toBeUndefined()
    })

    it('should throw error for missing required fields', () => {
      const requiredFields = [
        'firstName',
        'lastName',
        'addressLine1',
        'city',
        'state',
        'postalCode',
        'country'
      ]

      requiredFields.forEach((field) => {
        const invalidData = { ...validAddressData, [field]: '' }
        expect(() => Address.create(invalidData)).toThrow(InvalidAddressError)
      })
    })

    it('should validate US postal code format', () => {
      const validUsCodes = ['12345', '12345-6789']
      const invalidUsCodes = ['1234', '123456', 'ABCDE', '12345-678']

      validUsCodes.forEach((code) => {
        const data = { ...validAddressData, postalCode: code }
        expect(() => Address.create(data)).not.toThrow()
      })

      invalidUsCodes.forEach((code) => {
        const data = { ...validAddressData, postalCode: code }
        expect(() => Address.create(data)).toThrow(InvalidAddressError)
      })
    })

    it('should validate US state code length', () => {
      const validData = { ...validAddressData, state: 'CA' }
      const invalidData = { ...validAddressData, state: 'California' }

      expect(() => Address.create(validData)).not.toThrow()
      expect(() => Address.create(invalidData)).toThrow(InvalidAddressError)
    })

    it('should allow non-US addresses without strict validation', () => {
      const canadianAddress: AddressData = {
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Maple Ave',
        city: 'Toronto',
        state: 'Ontario',
        postalCode: 'M5V 3A8',
        country: 'CA'
      }

      expect(() => Address.create(canadianAddress)).not.toThrow()
    })
  })

  describe('fullName', () => {
    it('should return combined first and last name', () => {
      const address = Address.create(validAddressData)
      expect(address.fullName).toBe('John Doe')
    })
  })

  describe('toData', () => {
    it('should return address data object', () => {
      const address = Address.create(validAddressData)
      const data = address.toData()

      expect(data).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      })
    })
  })

  describe('equals', () => {
    it('should return true for identical addresses', () => {
      const address1 = Address.create(validAddressData)
      const address2 = Address.create(validAddressData)
      expect(address1.equals(address2)).toBe(true)
    })

    it('should return false for different addresses', () => {
      const address1 = Address.create(validAddressData)
      const differentData = { ...validAddressData, firstName: 'Jane' }
      const address2 = Address.create(differentData)
      expect(address1.equals(address2)).toBe(false)
    })

    it('should handle addresses with and without addressLine2', () => {
      const withLine2 = Address.create(validAddressData)
      const withoutLine2 = Address.create({ ...validAddressData, addressLine2: undefined })
      expect(withLine2.equals(withoutLine2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return formatted address string', () => {
      const address = Address.create(validAddressData)
      const expected = ['John Doe', '123 Main St', 'Apt 4B', 'New York, NY 10001', 'US'].join('\n')

      expect(address.toString()).toBe(expected)
    })

    it('should omit empty addressLine2 from string', () => {
      const dataWithoutLine2 = { ...validAddressData, addressLine2: undefined }
      const address = Address.create(dataWithoutLine2)
      const addressString = address.toString()

      expect(addressString).not.toContain('Apt 4B')
      expect(addressString.split('\n')).toHaveLength(4)
    })
  })
})
