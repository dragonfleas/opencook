import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, renderHook, act } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useTheme } from '@/hooks/use-theme'

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('ThemeProvider', () => {
    it('should provide default theme as system', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider
      })

      expect(result.current.theme).toBe('system')
    })

    it('should provide custom default theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should use theme from localStorage if available', () => {
      localStorage.setItem('opencook-ui-theme', 'light')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider
      })

      expect(result.current.theme).toBe('light')
    })

    it('should update theme and save to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
      expect(localStorage.getItem('opencook-ui-theme')).toBe('dark')
    })

    it('should apply theme class to document root', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should apply system theme based on media query', () => {
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })

      window.matchMedia = mockMatchMedia

      renderHook(() => useTheme(), {
        wrapper: ThemeProvider
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should use custom storage key', () => {
      const customKey = 'custom-theme-key'
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider storageKey={customKey}>{children}</ThemeProvider>
      })

      act(() => {
        result.current.setTheme('light')
      })

      expect(localStorage.getItem(customKey)).toBe('light')
    })
  })

  describe('useTheme hook', () => {
    it('should return default state when used outside ThemeProvider', () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current.theme).toBe('system')
      expect(result.current.setTheme).toBeInstanceOf(Function)

      // setTheme should be a no-op when not in provider
      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('system') // Should not change
    })
  })
})
