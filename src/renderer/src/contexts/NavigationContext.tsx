import { useState, ReactNode } from 'react'
import { CreateProfileFormData } from '@/lib/validations/profile'
import { NavigationContext, type View } from './navigation-context'

export type { View }

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
