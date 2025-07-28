import { useContext, createContext } from 'react'
import type { NavigationContextType } from '@/contexts/NavigationContext'

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
