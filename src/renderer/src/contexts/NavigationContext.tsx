import { useState, ReactNode } from 'react'
import { CreateProfileFormData } from '@/lib/validations/profile'
import { NavigationContext } from '@/hooks/use-navigation'

export type View =
  | 'dashboard'
  | 'profiles'
  | 'create-profile'
  | 'analytics'
  | 'validation'
  | 'settings'

export interface NavigationContextType {
  currentView: View
  setCurrentView: (view: View) => void
  profileFormData?: CreateProfileFormData
  setProfileFormData: (data: CreateProfileFormData | undefined) => void
}

export function NavigationProvider({ children }: { children: ReactNode }): JSX.Element {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [profileFormData, setProfileFormData] = useState<CreateProfileFormData | undefined>(
    undefined
  )

  return (
    <NavigationContext.Provider
      value={{
        currentView,
        setCurrentView,
        profileFormData,
        setProfileFormData
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

// Hook is available from '@/hooks/use-navigation'
