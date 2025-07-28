import '@testing-library/jest-dom'

// Mock window.api object for tests
Object.defineProperty(window, 'api', {
  value: {
    profile: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      toggleActive: vi.fn(),
      validateForPurchase: vi.fn()
    }
  },
  writable: true
})

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true
})

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn()
}
