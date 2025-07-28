import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProfileAPI } from '@/lib/api'
import type { CreateProfileDto, UpdateProfileDto } from '@/types/profile'

// Mock the window.api object
const mockApi = {
  profile: {
    create: vi.fn(),
    get: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleActive: vi.fn(),
    validateForPurchase: vi.fn()
  }
}

// Mock global window object
global.window = {
  api: mockApi
} as Window & {
  api: typeof mockApi
}

describe('ProfileAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('should call window.api.profile.create with correct data', async () => {
      const mockProfile: CreateProfileDto = {
        name: 'Test Profile',
        email: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'CREDIT_CARD',
          holderName: 'John Doe'
        }
      }

      const mockResponse = {
        success: true,
        data: { id: '123', ...mockProfile }
      }

      mockApi.profile.create.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.create(mockProfile)

      expect(mockApi.profile.create).toHaveBeenCalledWith(mockProfile)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('get', () => {
    it('should call window.api.profile.get with correct profileId', async () => {
      const profileId = '123'
      const mockResponse = {
        success: true,
        data: { id: profileId, name: 'Test Profile' }
      }

      mockApi.profile.get.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.get(profileId)

      expect(mockApi.profile.get).toHaveBeenCalledWith(profileId)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('list', () => {
    it('should call window.api.profile.list with activeOnly parameter', async () => {
      const mockResponse = {
        success: true,
        data: {
          profiles: [],
          total: 0,
          activeCount: 0
        }
      }

      mockApi.profile.list.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.list(true)

      expect(mockApi.profile.list).toHaveBeenCalledWith(true)
      expect(result).toEqual(mockResponse)
    })

    it('should call window.api.profile.list without activeOnly parameter', async () => {
      const mockResponse = {
        success: true,
        data: {
          profiles: [],
          total: 0,
          activeCount: 0
        }
      }

      mockApi.profile.list.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.list()

      expect(mockApi.profile.list).toHaveBeenCalledWith(undefined)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('update', () => {
    it('should call window.api.profile.update with correct data', async () => {
      const mockUpdate: UpdateProfileDto = {
        id: '123',
        name: 'Updated Profile',
        email: 'updated@example.com'
      }

      const mockResponse = {
        success: true,
        data: { ...mockUpdate }
      }

      mockApi.profile.update.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.update(mockUpdate)

      expect(mockApi.profile.update).toHaveBeenCalledWith(mockUpdate)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('delete', () => {
    it('should call window.api.profile.delete with correct profileId', async () => {
      const profileId = '123'
      const mockResponse = { success: true }

      mockApi.profile.delete.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.delete(profileId)

      expect(mockApi.profile.delete).toHaveBeenCalledWith(profileId)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('toggleActive', () => {
    it('should call window.api.profile.toggleActive with correct parameters', async () => {
      const profileId = '123'
      const isActive = true
      const mockResponse = {
        success: true,
        data: { id: profileId, isActive }
      }

      mockApi.profile.toggleActive.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.toggleActive(profileId, isActive)

      expect(mockApi.profile.toggleActive).toHaveBeenCalledWith(profileId, isActive)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('validateForPurchase', () => {
    it('should call window.api.profile.validateForPurchase with correct profileId', async () => {
      const profileId = '123'
      const mockResponse = {
        success: true,
        data: {
          isValid: true,
          profileId,
          profileName: 'Test Profile',
          canPurchase: true,
          cooldownRemaining: 0,
          errors: [],
          warnings: []
        }
      }

      mockApi.profile.validateForPurchase.mockResolvedValue(mockResponse)

      const result = await ProfileAPI.validateForPurchase(profileId)

      expect(mockApi.profile.validateForPurchase).toHaveBeenCalledWith(profileId)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error')
      mockApi.profile.get.mockRejectedValue(mockError)

      await expect(ProfileAPI.get('123')).rejects.toThrow('API Error')
    })
  })
})
