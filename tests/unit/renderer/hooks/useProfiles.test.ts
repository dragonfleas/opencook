import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProfiles } from '@/hooks/useProfiles'
import { ProfileAPI } from '@/lib/api'

// Mock the ProfileAPI
vi.mock('@/lib/api', () => ({
  ProfileAPI: {
    list: vi.fn(),
    delete: vi.fn(),
    toggleActive: vi.fn()
  }
}))

const mockProfileAPI = ProfileAPI as {
  list: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  toggleActive: ReturnType<typeof vi.fn>
}

describe('useProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: { profiles: [], total: 0, activeCount: 0 }
    })

    const { result } = renderHook(() => useProfiles())

    expect(result.current.loading).toBe(true)
    expect(result.current.profiles).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('should fetch profiles on mount', async () => {
    const mockProfiles = [
      {
        id: '1',
        name: 'Profile 1',
        email: 'profile1@example.com',
        isActive: true,
        purchaseCount: 5,
        createdAt: '2023-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        name: 'Profile 2',
        email: 'profile2@example.com',
        isActive: false,
        purchaseCount: 2,
        createdAt: '2023-01-02T00:00:00.000Z'
      }
    ]

    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: 2,
        activeCount: 1
      }
    })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profiles).toEqual(mockProfiles)
    expect(result.current.total).toBe(2)
    expect(result.current.activeCount).toBe(1)
    expect(result.current.error).toBe(null)
  })

  it('should handle API errors', async () => {
    mockProfileAPI.list.mockResolvedValue({
      success: false,
      error: { message: 'Failed to fetch profiles' }
    })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch profiles')
    expect(result.current.profiles).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.activeCount).toBe(0)
  })

  it('should handle network errors', async () => {
    const networkError = new Error('Network error')
    mockProfileAPI.list.mockRejectedValue(networkError)

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.profiles).toEqual([])
  })

  it('should pass activeOnly parameter to API', async () => {
    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: { profiles: [], total: 0, activeCount: 0 }
    })

    renderHook(() => useProfiles(true))

    await waitFor(() => {
      expect(mockProfileAPI.list).toHaveBeenCalledWith(true)
    })
  })

  it('should refetch profiles when refetch is called', async () => {
    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: { profiles: [], total: 0, activeCount: 0 }
    })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the initial call
    mockProfileAPI.list.mockClear()

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockProfileAPI.list).toHaveBeenCalledTimes(1)
  })

  it('should delete profile and update local state', async () => {
    const mockProfiles = [
      {
        id: '1',
        name: 'Profile 1',
        email: 'profile1@example.com',
        isActive: true,
        purchaseCount: 5,
        createdAt: '2023-01-01T00:00:00.000Z'
      },
      {
        id: '2',
        name: 'Profile 2',
        email: 'profile2@example.com',
        isActive: false,
        purchaseCount: 2,
        createdAt: '2023-01-02T00:00:00.000Z'
      }
    ]

    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: 2,
        activeCount: 1
      }
    })

    mockProfileAPI.delete.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteProfile('1')
    })

    expect(mockProfileAPI.delete).toHaveBeenCalledWith('1')
    expect(result.current.profiles).toHaveLength(1)
    expect(result.current.profiles[0].id).toBe('2')
    expect(result.current.total).toBe(1)
    expect(result.current.activeCount).toBe(0) // Decreased because deleted profile was active
  })

  it('should handle delete errors', async () => {
    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: { profiles: [], total: 0, activeCount: 0 }
    })

    mockProfileAPI.delete.mockResolvedValue({
      success: false,
      error: { message: 'Failed to delete profile' }
    })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(
      act(async () => {
        await result.current.deleteProfile('1')
      })
    ).rejects.toThrow('Failed to delete profile')

    // Error state is handled internally and doesn't need to be tested here
    // The error is thrown which is what we test for above
  })

  it('should toggle profile active status', async () => {
    const mockProfiles = [
      {
        id: '1',
        name: 'Profile 1',
        email: 'profile1@example.com',
        isActive: false,
        purchaseCount: 5,
        createdAt: '2023-01-01T00:00:00.000Z'
      }
    ]

    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: {
        profiles: mockProfiles,
        total: 1,
        activeCount: 0
      }
    })

    mockProfileAPI.toggleActive.mockResolvedValue({
      success: true,
      data: { id: '1', isActive: true }
    })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleActive('1', true)
    })

    expect(mockProfileAPI.toggleActive).toHaveBeenCalledWith('1', true)
    expect(result.current.profiles[0].isActive).toBe(true)
    expect(result.current.activeCount).toBe(1) // Increased because profile was activated
  })

  it('should handle toggle active errors', async () => {
    mockProfileAPI.list.mockResolvedValue({
      success: true,
      data: { profiles: [], total: 0, activeCount: 0 }
    })

    mockProfileAPI.toggleActive.mockResolvedValue({
      success: false,
      error: { message: 'Failed to toggle profile status' }
    })

    const { result } = renderHook(() => useProfiles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await expect(
      act(async () => {
        await result.current.toggleActive('1', true)
      })
    ).rejects.toThrow('Failed to toggle profile status')

    // Error state is handled internally and doesn't need to be tested here
    // The error is thrown which is what we test for above
  })
})
