import { vi, MockedObject } from 'vitest'
import { GetProfileUseCase } from '../../../../src/main/application/use-cases/GetProfileUseCase'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import { ProfileId } from '../../../../src/main/domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../../../src/main/domain/errors/ProfileErrors'
import { PaymentMethodType, ProfileCreationData } from '../../../../src/shared/types/profile.types'

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase
  let mockRepository: MockedObject<IProfileRepository>
  let testProfile: Profile

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
    useCase = new GetProfileUseCase(mockRepository)

    const profileData: ProfileCreationData = {
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

    testProfile = Profile.create(profileData)
  })

  describe('execute', () => {
    it('should return profile when found', async () => {
      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)

      const result = await useCase.execute(profileId)

      expect(result.id).toBe(profileId)
      expect(result.name).toBe('Test Profile')
      expect(result.email).toBe('test@example.com')
      expect(result.phoneNumber).toBe('1234567890')
      expect(result.shippingAddress.addressLine1).toBe('123 Main St')
      expect(result.billingAddress?.addressLine1).toBe('456 Oak Ave')
      expect(result.paymentMethod.maskedDisplay).toBeDefined()
      expect(result.isActive).toBe(true)
      expect(mockRepository.findById).toHaveBeenCalledWith(ProfileId.create(profileId))
    })

    it('should return profile with computed properties', async () => {
      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)

      const result = await useCase.execute(profileId)

      expect(result.paymentMethod.isExpired).toBe(false)
      expect(result.isSuspicious).toBe(false)
      expect(result.cooldownRemaining).toBe(0)
      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.updatedAt).toBe('string')
    })

    it('should throw ProfileNotFoundError when profile does not exist', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(profileId)).rejects.toThrow(ProfileNotFoundError)
      expect(mockRepository.findById).toHaveBeenCalledWith(ProfileId.create(profileId))
    })

    it('should handle invalid profile ID format', async () => {
      const invalidProfileId = 'invalid-uuid'

      await expect(useCase.execute(invalidProfileId)).rejects.toThrow()
    })

    it('should handle repository errors', async () => {
      const profileId = testProfile.id.value
      mockRepository.findById.mockRejectedValue(new Error('Database error'))

      await expect(useCase.execute(profileId)).rejects.toThrow('Database error')
    })
  })
})
