import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { useNavigation } from '@/hooks/use-navigation'
import type { CreateProfileFormData } from '@/lib/validations/profile'

describe('NavigationContext', () => {
  describe('NavigationProvider', () => {
    it('should provide default view as dashboard', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: NavigationProvider
      })

      expect(result.current.currentView).toBe('dashboard')
    })

    it('should update current view', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: NavigationProvider
      })

      act(() => {
        result.current.setCurrentView('profiles')
      })

      expect(result.current.currentView).toBe('profiles')
    })

    it('should have undefined profile form data by default', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: NavigationProvider
      })

      expect(result.current.profileFormData).toBeUndefined()
    })

    it('should update profile form data', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: NavigationProvider
      })

      const mockFormData: CreateProfileFormData = {
        name: 'Test Profile',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        shippingAddress: {
          streetAddress: '123 Test St',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345',
          country: 'US'
        },
        billingAddress: {
          streetAddress: '123 Test St',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345',
          country: 'US'
        },
        paymentMethods: []
      }

      act(() => {
        result.current.setProfileFormData(mockFormData)
      })

      expect(result.current.profileFormData).toEqual(mockFormData)
    })

    it('should clear profile form data', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: NavigationProvider
      })

      const mockFormData: CreateProfileFormData = {
        name: 'Test Profile',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        shippingAddress: {
          streetAddress: '123 Test St',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345',
          country: 'US'
        },
        billingAddress: {
          streetAddress: '123 Test St',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345',
          country: 'US'
        },
        paymentMethods: []
      }

      act(() => {
        result.current.setProfileFormData(mockFormData)
      })

      expect(result.current.profileFormData).toBeDefined()

      act(() => {
        result.current.setProfileFormData(undefined)
      })

      expect(result.current.profileFormData).toBeUndefined()
    })

    it('should handle multiple view changes', () => {
      const { result } = renderHook(() => useNavigation(), {
        wrapper: NavigationProvider
      })

      const views = [
        'profiles',
        'create-profile',
        'analytics',
        'validation',
        'settings',
        'dashboard'
      ] as const

      views.forEach((view) => {
        act(() => {
          result.current.setCurrentView(view)
        })
        expect(result.current.currentView).toBe(view)
      })
    })
  })

  describe('useNavigation hook', () => {
    it('should throw error when used outside NavigationProvider', () => {
      expect(() => {
        renderHook(() => useNavigation())
      }).toThrow('useNavigation must be used within a NavigationProvider')
    })
  })
})
