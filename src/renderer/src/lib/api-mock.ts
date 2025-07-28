// Temporary mock for window.api until IPC is properly connected
import type { IpcResponse, ProfileDetailDto } from '@/types/profile'
import type { CreateProfileFormData } from '@/lib/validations/profile'

const createMockResponse = <T>(data: T | null = null): Promise<IpcResponse<T>> => {
  return Promise.resolve({
    success: true,
    data,
    error: null
  })
}

const createErrorResponse = <T = never>(message: string): Promise<IpcResponse<T>> => {
  return Promise.resolve({
    success: false,
    data: null,
    error: {
      code: 'MOCK_ERROR',
      message
    }
  })
}

// Mock data
const mockProfiles: ProfileDetailDto[] = []

export const mockApi = {
  profile: {
    create: async (
      dto: CreateProfileFormData
    ): Promise<IpcResponse<{ profile: ProfileDetailDto }>> => {
      const newProfile = {
        id: Date.now().toString(),
        ...dto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      dto: Partial<ProfileDetailDto> & { id: string }
    ): Promise<IpcResponse<{ profile: ProfileDetailDto }>> => {
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
      return createMockResponse(null)
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
  ;(window as Window & { api: typeof mockApi }).api = mockApi
}
