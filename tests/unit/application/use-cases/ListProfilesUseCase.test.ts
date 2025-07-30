import { vi, MockedObject } from 'vitest'
import { ListProfilesUseCase } from '../../../../src/main/application/use-cases/ListProfilesUseCase'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import { PaymentMethodType, ProfileCreationData } from '../../../../src/shared/types/profile.types'

describe('ListProfilesUseCase', () => {
  let useCase: ListProfilesUseCase
  let mockRepository: MockedObject<IProfileRepository>
  let testProfiles: Profile[]

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
    useCase = new ListProfilesUseCase(mockRepository)

    // Create test profiles
    const activeProfileData: ProfileCreationData = {
      name: 'Active Profile',
      email: 'active@example.com',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        postalCode: '12345',
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

    const inactiveProfileData: ProfileCreationData = {
      name: 'Inactive Profile',
      email: 'inactive@example.com',
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Smith',
        addressLine1: '456 Oak Ave',
        city: 'Otherville',
        state: 'CA',
        postalCode: '67890',
        country: 'US'
      },
      paymentMethod: {
        type: PaymentMethodType.CREDIT_CARD,
        lastFourDigits: '2222',
        expiryMonth: 6,
        expiryYear: 2026,
        holderName: 'Jane Smith'
      }
    }

    const activeProfile = Profile.create(activeProfileData)
    const inactiveProfile = Profile.create(inactiveProfileData)
    inactiveProfile.deactivate()

    testProfiles = [activeProfile, inactiveProfile]
  })

  describe('execute', () => {
    it('should return all profiles when no options provided', async () => {
      mockRepository.findAll.mockResolvedValue(testProfiles)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.countActive.mockResolvedValue(1)

      const result = await useCase.execute()

      expect(result.profiles).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.activeCount).toBe(1)
      expect(result.profiles[0].name).toBe('Active Profile')
      expect(result.profiles[1].name).toBe('Inactive Profile')
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1)
      expect(mockRepository.findActive).not.toHaveBeenCalled()
    })

    it('should return only active profiles when activeOnly is true', async () => {
      const activeProfiles = [testProfiles[0]] // Only the active profile
      mockRepository.findActive.mockResolvedValue(activeProfiles)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.countActive.mockResolvedValue(1)

      const result = await useCase.execute({ activeOnly: true })

      expect(result.profiles).toHaveLength(1)
      expect(result.total).toBe(2)
      expect(result.activeCount).toBe(1)
      expect(result.profiles[0].name).toBe('Active Profile')
      expect(result.profiles[0].isActive).toBe(true)
      expect(mockRepository.findActive).toHaveBeenCalledTimes(1)
      expect(mockRepository.findAll).not.toHaveBeenCalled()
    })

    it('should return empty list when no profiles exist', async () => {
      mockRepository.findAll.mockResolvedValue([])
      mockRepository.count.mockResolvedValue(0)
      mockRepository.countActive.mockResolvedValue(0)

      const result = await useCase.execute()

      expect(result.profiles).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.activeCount).toBe(0)
    })

    it('should return summary DTOs with correct structure', async () => {
      mockRepository.findAll.mockResolvedValue(testProfiles)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.countActive.mockResolvedValue(1)

      const result = await useCase.execute()

      const profile = result.profiles[0]
      expect(profile).toHaveProperty('id')
      expect(profile).toHaveProperty('name')
      expect(profile).toHaveProperty('email')
      expect(profile).toHaveProperty('isActive')
      expect(profile).toHaveProperty('createdAt')

      // Summary DTO should not include sensitive payment info
      expect(profile).not.toHaveProperty('paymentMethod.cardNumber')
      expect(profile).not.toHaveProperty('paymentMethod.cvv')
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'))

      await expect(useCase.execute()).rejects.toThrow('Database error')
    })

    it('should correctly show active status in summary', async () => {
      mockRepository.findAll.mockResolvedValue(testProfiles)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.countActive.mockResolvedValue(1)

      const result = await useCase.execute()

      expect(result.profiles[0].isActive).toBe(true)
      expect(result.profiles[1].isActive).toBe(false)
    })

    it('should include timestamps in summary', async () => {
      mockRepository.findAll.mockResolvedValue(testProfiles)
      mockRepository.count.mockResolvedValue(2)
      mockRepository.countActive.mockResolvedValue(1)

      const result = await useCase.execute()

      expect(typeof result.profiles[0].createdAt).toBe('string')
      expect(typeof result.profiles[1].createdAt).toBe('string')
    })
  })
})
