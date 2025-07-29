import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCreateProfile } from '@/hooks/useCreateProfile'
import { ProfileAPI } from '@/lib/api'
import type { CreateProfileFormData } from '@/lib/validations/profile'
import type { ProfileResponseDto } from '@/types/profile'

type CreateProfileResult = { success: boolean; data?: ProfileResponseDto; error?: string }

// Mock the ProfileAPI
vi.mock('@/lib/api', () => ({
  ProfileAPI: {
    create: vi.fn()
  }
}))

const mockProfileAPI = vi.mocked(ProfileAPI)

describe('useCreateProfile', () => {
  const mockFormData: CreateProfileFormData = {
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '555-0123',
    useSameAddress: true,
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    paymentMethod: {
      type: 'CREDIT_CARD' as const,
      cardNumber: '4111111111111111',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
      holderName: 'John Doe'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useCreateProfile())

    expect(result.current.isCreating).toBe(false)
    expect(typeof result.current.createProfile).toBe('function')
  })

  it('should successfully create a profile', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true,
        purchaseCount: 0,
        createdAt: '2023-01-01T00:00:00Z'
      }
    }

    mockProfileAPI.create.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useCreateProfile())

    let createResult: CreateProfileResult
    await act(async () => {
      createResult = await result.current.createProfile(mockFormData)
    })

    expect(createResult.success).toBe(true)
    expect(createResult.data).toEqual(mockResponse.data)
    expect(result.current.isCreating).toBe(false)
  })

  it('should handle API errors gracefully', async () => {
    const mockErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid email format'
      }
    }

    mockProfileAPI.create.mockResolvedValueOnce(mockErrorResponse)

    const { result } = renderHook(() => useCreateProfile())

    let createResult: CreateProfileResult
    await act(async () => {
      createResult = await result.current.createProfile(mockFormData)
    })

    expect(createResult.success).toBe(false)
    expect(createResult.error).toBe('Invalid email format')
    expect(result.current.isCreating).toBe(false)
  })

  it('should handle network errors', async () => {
    const networkError = new Error('Network error')
    mockProfileAPI.create.mockRejectedValueOnce(networkError)

    const { result } = renderHook(() => useCreateProfile())

    let createResult: CreateProfileResult
    await act(async () => {
      createResult = await result.current.createProfile(mockFormData)
    })

    expect(createResult.success).toBe(false)
    expect(createResult.error).toBe('An unexpected error occurred')
    expect(result.current.isCreating).toBe(false)
  })

  it('should set isCreating to true during profile creation', async () => {
    let resolvePromise: (value: { success: boolean; data?: ProfileResponseDto }) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockProfileAPI.create.mockReturnValueOnce(pendingPromise)

    const { result } = renderHook(() => useCreateProfile())

    act(() => {
      result.current.createProfile(mockFormData)
    })

    expect(result.current.isCreating).toBe(true)

    await act(async () => {
      resolvePromise!({ success: true, data: {} })
      await pendingPromise
    })

    expect(result.current.isCreating).toBe(false)
  })

  it('should map form data to DTO correctly', async () => {
    const mockResponse = { success: true, data: {} }
    mockProfileAPI.create.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useCreateProfile())

    await act(async () => {
      await result.current.createProfile(mockFormData)
    })

    expect(mockProfileAPI.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '555-0123',
      useSameAddress: true,
      shippingAddress: mockFormData.shippingAddress,
      billingAddress: undefined, // Should be undefined when useSameAddress is true
      paymentMethod: {
        type: 'CREDIT_CARD',
        lastFourDigits: '1111',
        expiryMonth: 12,
        expiryYear: 2025,
        holderName: 'John Doe',
        fullCardNumber: '4111111111111111',
        cvv: '123'
      }
    })
  })

  it('should include billing address when useSameAddress is false', async () => {
    const formDataWithSeparateBilling = {
      ...mockFormData,
      useSameAddress: false
    }

    const mockResponse = { success: true, data: {} }
    mockProfileAPI.create.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useCreateProfile())

    await act(async () => {
      await result.current.createProfile(formDataWithSeparateBilling)
    })

    const calledWith = mockProfileAPI.create.mock.calls[0][0]
    expect(calledWith.billingAddress).toEqual(mockFormData.billingAddress)
    expect(calledWith.useSameAddress).toBe(false)
  })
})
