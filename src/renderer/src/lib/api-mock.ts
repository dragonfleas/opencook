// Temporary mock for window.api until IPC is properly connected
import type { IpcResponse, ProfileResponseDto } from '@/types/profile'
import type { CreateProfileFormData } from '@/lib/validations/profile'

const createMockResponse = <T>(data: T | undefined = undefined): Promise<IpcResponse<T>> => {
  return Promise.resolve({
    success: true,
    data,
    error: undefined
  })
}

const createErrorResponse = <T = never>(message: string): Promise<IpcResponse<T>> => {
  return Promise.resolve({
    success: false,
    data: undefined,
    error: {
      code: 'MOCK_ERROR',
      message
    }
  })
}

// Mock data
const mockProfiles: ProfileResponseDto[] = []

export const mockApi = {
  profile: {
    create: async (
      dto: CreateProfileFormData
    ): Promise<IpcResponse<{ profile: ProfileResponseDto }>> => {
      const newProfile: ProfileResponseDto = {
        id: Date.now().toString(),
        ...dto,
        paymentMethod: {
          ...dto.paymentMethod,
          lastFourDigits: dto.paymentMethod.cardNumber?.slice(-4),
          maskedDisplay: `****-${dto.paymentMethod.cardNumber?.slice(-4) || '****'}`,
          isExpired: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        purchaseCount: 0,
        isActive: true,
        isSuspicious: false,
        cooldownRemaining: 0
      }
      mockProfiles.push(newProfile)
      return createMockResponse({ profile: newProfile })
    },

    get: async (profileId: string) => {
      const profile = mockProfiles.find((p) => p.id === profileId)
      if (!profile) {
        return createErrorResponse('Profile not found')
      }
      return createMockResponse({ profile })
    },

    list: async (activeOnly?: boolean) => {
      const filteredProfiles = activeOnly ? mockProfiles.filter((p) => p.isActive) : mockProfiles

      return createMockResponse({
        profiles: filteredProfiles,
        total: mockProfiles.length,
        activeCount: mockProfiles.filter((p) => p.isActive).length
      })
    },

    update: async (
      dto: Partial<ProfileResponseDto> & { id: string }
    ): Promise<IpcResponse<{ profile: ProfileResponseDto }>> => {
      const index = mockProfiles.findIndex((p) => p.id === dto.id)
      if (index === -1) {
        return createErrorResponse('Profile not found')
      }
      mockProfiles[index] = {
        ...mockProfiles[index],
        ...dto,
        updatedAt: new Date().toISOString()
      }
      return createMockResponse({ profile: mockProfiles[index] })
    },

    delete: async (profileId: string) => {
      const index = mockProfiles.findIndex((p) => p.id === profileId)
      if (index === -1) {
        return createErrorResponse('Profile not found')
      }
      mockProfiles.splice(index, 1)
      return createMockResponse(undefined)
    },

    toggleActive: async (profileId: string, isActive: boolean) => {
      const profile = mockProfiles.find((p) => p.id === profileId)
      if (!profile) {
        return createErrorResponse('Profile not found')
      }
      profile.isActive = isActive
      profile.updatedAt = new Date().toISOString()
      return createMockResponse({ profile })
    },

    validateForPurchase: async (profileId: string) => {
      const profile = mockProfiles.find((p) => p.id === profileId)
      if (!profile) {
        return createErrorResponse('Profile not found')
      }
      return createMockResponse({
        isValid: true,
        errors: [],
        warnings: []
      })
    }
  }
}

// Initialize window.api if it doesn't exist
if (typeof window !== 'undefined' && !window.api) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).api = mockApi
}
