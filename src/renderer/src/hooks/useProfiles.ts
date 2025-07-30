import { useState, useEffect, useCallback } from 'react'
import { ProfileAPI } from '@/lib/api'
import type { ProfileSummaryDto, ProfileResponseDto } from '@/types/profile'
import type { CreateProfileFormData } from '@/lib/validations/profile'

interface UseProfilesResult {
  profiles: ProfileSummaryDto[]
  loading: boolean
  error: string | null
  total: number
  activeCount: number
  refetch: () => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
  createProfile: (
    data: CreateProfileFormData
  ) => Promise<{ success: boolean; data?: ProfileResponseDto; error?: string }>
  isCreating: boolean
}

export function useProfiles(activeOnly = false): UseProfilesResult {
  const [profiles, setProfiles] = useState<ProfileSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [activeCount, setActiveCount] = useState(0)
  const [isCreating, setIsCreating] = useState(false)

  const fetchProfiles = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await ProfileAPI.list(activeOnly)

      if (response.success && response.data) {
        const profiles = response.data.profiles || []
        const total = response.data.total || 0
        const activeCount = response.data.activeCount || 0

        setProfiles(profiles)
        setTotal(total)
        setActiveCount(activeCount)
      } else {
        setError(response.error?.message || 'Failed to fetch profiles')
        setProfiles([])
        setTotal(0)
        setActiveCount(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setProfiles([])
      setTotal(0)
      setActiveCount(0)
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  const deleteProfile = useCallback(
    async (id: string): Promise<void> => {
      try {
        const response = await ProfileAPI.delete(id)

        if (response.success) {
          // Remove the profile from local state
          setProfiles((prev) => prev.filter((profile) => profile.id !== id))
          setTotal((prev) => prev - 1)

          // Update active count if the deleted profile was active
          const deletedProfile = profiles.find((p) => p.id === id)
          if (deletedProfile?.isActive) {
            setActiveCount((prev) => prev - 1)
          }
        } else {
          throw new Error(response.error?.message || 'Failed to delete profile')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete profile')
        throw err
      }
    },
    [profiles]
  )

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    try {
      const response = await ProfileAPI.toggleActive(id, isActive)

      if (response.success && response.data) {
        // Update the profile in local state
        setProfiles((prev) =>
          prev.map((profile) => (profile.id === id ? { ...profile, isActive } : profile))
        )

        // Update active count
        setActiveCount((prev) => (isActive ? prev + 1 : prev - 1))
      } else {
        throw new Error(response.error?.message || 'Failed to toggle profile status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle profile status')
      throw err
    }
  }, [])

  const mapFormDataToDto = useCallback((data: CreateProfileFormData) => {
    return {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      useSameAddress: data.useSameAddress,
      shippingAddress: data.shippingAddress,
      billingAddress: data.useSameAddress ? undefined : data.billingAddress,
      paymentMethod: {
        type: data.paymentMethod.type,
        // Extract last 4 digits from full card number
        lastFourDigits: data.paymentMethod.cardNumber?.slice(-4),
        expiryMonth: data.paymentMethod.expiryMonth,
        expiryYear: data.paymentMethod.expiryYear,
        holderName: data.paymentMethod.holderName,
        // Include full card data for retail bot automation (will be encrypted)
        fullCardNumber: data.paymentMethod.cardNumber,
        cvv: data.paymentMethod.cvv
      }
    }
  }, [])

  const createProfile = useCallback(
    async (
      data: CreateProfileFormData
    ): Promise<{ success: boolean; data?: ProfileResponseDto; error?: string }> => {
      setIsCreating(true)
      try {
        const dto = mapFormDataToDto(data)
        const response = await ProfileAPI.create(dto)

        if (response.success && response.data) {
          // Convert ProfileResponseDto to ProfileSummaryDto for the list
          const summaryDto: ProfileSummaryDto = {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            isActive: response.data.isActive,
            purchaseCount: response.data.purchaseCount,
            lastUsedAt: response.data.lastUsedAt,
            createdAt: response.data.createdAt
          }

          // Add to local state
          setProfiles((prev) => [summaryDto, ...(prev || [])])
          setTotal((prev) => prev + 1)
          if (response.data.isActive) {
            setActiveCount((prev) => prev + 1)
          }

          console.log('Profile created successfully:', response.data)
          return { success: true, data: response.data }
        } else {
          console.error('Failed to create profile:', response.error)
          return { success: false, error: response.error?.message || 'Unknown error' }
        }
      } catch (error) {
        console.error('Error creating profile:', error)
        return { success: false, error: 'An unexpected error occurred' }
      } finally {
        setIsCreating(false)
      }
    },
    [mapFormDataToDto]
  )

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return {
    profiles,
    loading,
    error,
    total,
    activeCount,
    refetch: fetchProfiles,
    deleteProfile,
    toggleActive,
    createProfile,
    isCreating
  }
}
