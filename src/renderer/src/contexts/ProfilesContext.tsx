import { ReactNode } from 'react'
import { useProfiles as useProfilesHook } from '@/hooks/useProfiles'
import { ProfilesContext } from './profiles-context-types'

export function ProfilesProvider({ children }: { children: ReactNode }): JSX.Element {
  const profilesData = useProfilesHook()

  return <ProfilesContext.Provider value={profilesData}>{children}</ProfilesContext.Provider>
}
