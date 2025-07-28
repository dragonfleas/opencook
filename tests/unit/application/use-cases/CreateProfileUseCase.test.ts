import { vi, MockedObject } from 'vitest'
import { CreateProfileUseCase } from '../../../../src/main/application/use-cases/CreateProfileUseCase'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import {
  DuplicateProfileError,
  ProfileLimitExceededError
} from '../../../../src/main/domain/errors/ProfileErrors'
import { PaymentMethodType } from '../../../../src/shared/types/profile.types'

describe('CreateProfileUseCase', () => {
  let useCase: CreateProfileUseCase
  let mockRepository: MockedObject<IProfileRepository>

  const validDto = {
    name: 'Test Profile',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'Anytown',
      state: 'NY',
      postalCode: '12345',
      country: 'US'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '456 Oak Ave',
      city: 'Otherville',
      state: 'CA',
      postalCode: '67890',
      country: 'US'
    },
    paymentMethod: {
      type: PaymentMethodType.CREDIT_CARD,
      lastFourDigits: '1111',
      expiryMonth: 12,
      expiryYear: 2025,
      holderName: 'John Doe'
    }
  }

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      findAll: vi.fn(),
      findActive: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      countActive: vi.fn(),
      existsByName: vi.fn()
    }
    useCase = new CreateProfileUseCase(mockRepository)
  })

  describe('execute', () => {
    it('should create a profile successfully', async () => {
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(validDto)

      expect(result.name).toBe('Test Profile')
      expect(result.email).toBe('test@example.com')
      expect(result.phoneNumber).toBe('1234567890')
      expect(result.shippingAddress.addressLine1).toBe('123 Main St')
      expect(result.billingAddress?.addressLine1).toBe('456 Oak Ave')
      expect(result.paymentMethod.maskedDisplay).toBeDefined()
      expect(result.isActive).toBe(true)
      expect(typeof result.createdAt).toBe('string')
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should create a profile without optional billing address', async () => {
      const dtoWithoutBilling = { ...validDto }
      delete dtoWithoutBilling.billingAddress

      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(dtoWithoutBilling)

      expect(result.billingAddress).toBeUndefined()
      expect(result.name).toBe('Test Profile')
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should create a profile without optional phone number', async () => {
      const dtoWithoutPhone = { ...validDto }
      delete dtoWithoutPhone.phoneNumber

      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(dtoWithoutPhone)

      expect(result.phoneNumber).toBeUndefined()
      expect(result.name).toBe('Test Profile')
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should throw DuplicateProfileError when profile name already exists', async () => {
      const existingProfile = Profile.create({
        name: 'Test Profile',
        email: 'existing@example.com',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Doe',
          addressLine1: '789 Pine St',
          city: 'Somewhere',
          state: 'TX',
          postalCode: '54321',
          country: 'US'
        },
        paymentMethod: {
          type: PaymentMethodType.CREDIT_CARD,
          lastFourDigits: '1111',
          expiryMonth: 12,
          expiryYear: 2025,
          holderName: 'Jane Doe'
        }
      })

      mockRepository.findByName.mockResolvedValue(existingProfile)
      mockRepository.count.mockResolvedValue(2)

      await expect(useCase.execute(validDto)).rejects.toThrow(DuplicateProfileError)
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw MaxProfilesExceededError when profile limit is reached', async () => {
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(5) // At maximum limit

      await expect(useCase.execute(validDto)).rejects.toThrow(ProfileLimitExceededError)
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should validate all value objects during creation', async () => {
      const invalidDto = {
        name: 'A', // Too short
        email: 'invalid-email',
        phoneNumber: '123', // Too short
        shippingAddress: {
          firstName: '',
          lastName: '',
          addressLine1: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        },
        paymentMethod: {
          type: PaymentMethodType.CREDIT_CARD,
          lastFourDigits: '1234',
          expiryMonth: 13, // Invalid
          expiryYear: 2020, // Expired
          holderName: ''
        }
      }

      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(2)

      // Should throw validation errors from value objects
      await expect(useCase.execute(invalidDto)).rejects.toThrow()
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should handle repository save failure', async () => {
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.save.mockRejectedValue(new Error('Database error'))

      await expect(useCase.execute(validDto)).rejects.toThrow('Database error')
    })

    it('should set correct computed properties in response', async () => {
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(validDto)

      expect(result.paymentMethod.isExpired).toBe(false)
      expect(result.isSuspicious).toBe(false)
      expect(result.cooldownRemaining).toBe(0)
      expect(typeof result.id).toBe('string')
      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.updatedAt).toBe('string')
    })
  })
})
