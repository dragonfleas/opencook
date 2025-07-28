import { vi, MockedObject } from 'vitest'
import { ToggleProfileActiveUseCase } from '../../../../src/main/application/use-cases/ToggleProfileActiveUseCase'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import { ProfileNotFoundError } from '../../../../src/main/domain/errors/ProfileErrors'
import { PaymentMethodType, ProfileCreationData } from '../../../../src/shared/types/profile.types'

describe('ToggleProfileActiveUseCase', () => {
  let useCase: ToggleProfileActiveUseCase
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
    useCase = new ToggleProfileActiveUseCase(mockRepository)

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
    it('should activate an inactive profile', async () => {
      testProfile.deactivate() // Start with inactive profile
      const profileId = testProfile.id.value

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(profileId, true)

      expect(result.isActive).toBe(true)
      expect(result.id).toBe(profileId)
      expect(result.name).toBe('Test Profile')
      expect(mockRepository.save).toHaveBeenCalledWith(testProfile)
    })

    it('should deactivate an active profile', async () => {
      // Profile starts active by default
      const profileId = testProfile.id.value

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(profileId, false)

      expect(result.isActive).toBe(false)
      expect(result.id).toBe(profileId)
      expect(result.name).toBe('Test Profile')
      expect(mockRepository.save).toHaveBeenCalledWith(testProfile)
    })

    it('should return profile with computed properties', async () => {
      const profileId = testProfile.id.value

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(profileId, false)

      expect(result.paymentMethod.maskedDisplay).toBeDefined()
      expect(result.paymentMethod.isExpired).toBe(false)
      expect(result.isSuspicious).toBe(false)
      expect(result.cooldownRemaining).toBe(0)
      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.updatedAt).toBe('string')
    })

    it('should throw ProfileNotFoundError when profile does not exist', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(profileId, true)).rejects.toThrow(ProfileNotFoundError)
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should handle invalid profile ID format', async () => {
      const invalidProfileId = 'invalid-uuid'

      await expect(useCase.execute(invalidProfileId, true)).rejects.toThrow()
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should handle repository save error', async () => {
      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.save.mockRejectedValue(new Error('Save failed'))

      await expect(useCase.execute(profileId, true)).rejects.toThrow('Save failed')
    })
  })
})
