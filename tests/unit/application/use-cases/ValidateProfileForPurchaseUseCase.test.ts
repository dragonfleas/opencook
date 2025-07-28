import { vi, MockedObject } from 'vitest'
import { ValidateProfileForPurchaseUseCase } from '../../../../src/main/application/use-cases/ValidateProfileForPurchaseUseCase'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import { ProfileId } from '../../../../src/main/domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../../../src/main/domain/errors/ProfileErrors'
import { PaymentMethodType, ProfileCreationData } from '../../../../src/shared/types/profile.types'

describe('ValidateProfileForPurchaseUseCase', () => {
  let useCase: ValidateProfileForPurchaseUseCase
  let mockRepository: MockedObject<IProfileRepository>
  let testProfile: Profile

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'))

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
    useCase = new ValidateProfileForPurchaseUseCase(mockRepository)

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

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('execute', () => {
    it('should return valid result for valid active profile', async () => {
      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)

      const result = await useCase.execute(profileId)

      expect(result.isValid).toBe(true)
      expect(result.profileId).toBe(profileId)
      expect(result.profileName).toBe('Test Profile')
      expect(result.canPurchase).toBe(true)
      expect(result.cooldownRemaining).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })

    it('should return invalid result for inactive profile', async () => {
      testProfile.deactivate()
      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)

      const result = await useCase.execute(profileId)

      expect(result.isValid).toBe(false)
      expect(result.canPurchase).toBe(false)
      expect(result.errors.some((error) => error.includes('is inactive'))).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('should return invalid result for profile in cooldown', async () => {
      // Record purchase to trigger cooldown
      testProfile.recordPurchase()

      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)

      const result = await useCase.execute(profileId)

      expect(result.isValid).toBe(false)
      expect(result.canPurchase).toBe(false)
      expect(result.errors.some((error) => error.includes('cooldown'))).toBe(true)
      expect(result.cooldownRemaining).toBeGreaterThan(0)
    })

    it('should throw ProfileNotFoundError when profile does not exist', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(profileId)).rejects.toThrow(ProfileNotFoundError)
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

    it('should validate ProfileId correctly', async () => {
      const profileId = testProfile.id.value
      mockRepository.findById.mockResolvedValue(testProfile)

      await useCase.execute(profileId)

      expect(mockRepository.findById).toHaveBeenCalledWith(ProfileId.create(profileId))
    })
  })
})
