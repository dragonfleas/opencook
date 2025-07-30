import { useContext } from 'react'
import { ProfilesContext, type ProfilesContextType } from '@/contexts/profiles-context-types'

export function useProfiles(): ProfilesContextType {
  const context = useContext(ProfilesContext)
  if (!context) {
    throw new Error('useProfiles must be used within ProfilesProvider')
  }
  return context
}
