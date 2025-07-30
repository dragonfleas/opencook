import { createContext } from 'react'
import { useProfiles as useProfilesHook } from '@/hooks/useProfiles'

export type ProfilesContextType = ReturnType<typeof useProfilesHook>

export const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined)
