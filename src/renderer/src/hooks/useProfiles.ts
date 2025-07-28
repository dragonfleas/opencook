import { useState, useEffect, useCallback } from 'react'
import { ProfileAPI } from '@/lib/api'
import type { ProfileSummaryDto } from '@/types/profile'

interface UseProfilesResult {
  profiles: ProfileSummaryDto[]
  loading: boolean
  error: string | null
  total: number
  activeCount: number
  refetch: () => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  toggleActive: (id: string, isActive: boolean) => Promise<void>
}

export function useProfiles(activeOnly = false): UseProfilesResult {
  const [profiles, setProfiles] = useState<ProfileSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [activeCount, setActiveCount] = useState(0)

  const fetchProfiles = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await ProfileAPI.list(activeOnly)

      if (response.success && response.data) {
        setProfiles(response.data.profiles)
        setTotal(response.data.total)
        setActiveCount(response.data.activeCount)
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
    toggleActive
  }
}
