import { vi, MockedObject } from 'vitest'
import { UpdateProfileUseCase } from '../../../../src/main/application/use-cases/UpdateProfileUseCase'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import {
  ProfileNotFoundError,
  DuplicateProfileError
} from '../../../../src/main/domain/errors/ProfileErrors'
import { PaymentMethodType, ProfileCreationData } from '../../../../src/shared/types/profile.types'

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase
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
    useCase = new UpdateProfileUseCase(mockRepository)

    const profileData: ProfileCreationData = {
      name: 'Original Profile',
      email: 'original@example.com',
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
    it('should update profile name successfully', async () => {
      const updateDto = {
        id: testProfile.id.value,
        name: 'Updated Profile Name'
      }

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(updateDto)

      expect(result.name).toBe('Updated Profile Name')
      expect(result.email).toBe('original@example.com')
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should update email successfully', async () => {
      const updateDto = {
        id: testProfile.id.value,
        email: 'updated@example.com'
      }

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(updateDto)

      expect(result.email).toBe('updated@example.com')
      expect(result.name).toBe('Original Profile')
      expect(mockRepository.save).toHaveBeenCalledTimes(1)
    })

    it('should throw ProfileNotFoundError when profile does not exist', async () => {
      const updateDto = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Name'
      }

      mockRepository.findById.mockResolvedValue(null)

      await expect(useCase.execute(updateDto)).rejects.toThrow(ProfileNotFoundError)
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should throw DuplicateProfileError when updating name to existing name', async () => {
      const existingProfileData: ProfileCreationData = {
        name: 'Existing Profile',
        email: 'existing@example.com',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          addressLine1: '999 Duplicate St',
          city: 'Dupetown',
          state: 'OR',
          postalCode: '97001',
          country: 'US'
        },
        paymentMethod: {
          type: PaymentMethodType.CREDIT_CARD,
          lastFourDigits: '3333',
          expiryMonth: 3,
          expiryYear: 2027,
          holderName: 'Existing User'
        }
      }

      const existingProfile = Profile.create(existingProfileData)

      const updateDto = {
        id: testProfile.id.value,
        name: 'Existing Profile'
      }

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.findByName.mockResolvedValue(existingProfile)

      await expect(useCase.execute(updateDto)).rejects.toThrow(DuplicateProfileError)
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should return profile with computed properties', async () => {
      const updateDto = {
        id: testProfile.id.value,
        name: 'Updated Profile'
      }

      mockRepository.findById.mockResolvedValue(testProfile)
      mockRepository.findByName.mockResolvedValue(null)
      mockRepository.save.mockResolvedValue()

      const result = await useCase.execute(updateDto)

      expect(result.paymentMethod.isExpired).toBe(false)
      expect(result.isSuspicious).toBe(false)
      expect(result.cooldownRemaining).toBe(0)
      expect(typeof result.createdAt).toBe('string')
      expect(typeof result.updatedAt).toBe('string')
    })

    it('should handle invalid profile ID format', async () => {
      const updateDto = {
        id: 'invalid-uuid',
        name: 'Updated Profile'
      }

      await expect(useCase.execute(updateDto)).rejects.toThrow()
    })
  })
})
