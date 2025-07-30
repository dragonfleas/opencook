import { createContext } from 'react'
import type { CreateProfileFormData } from '@/lib/validations/profile'

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

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined)
