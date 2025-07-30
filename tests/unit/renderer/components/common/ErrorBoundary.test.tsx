import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
})

// Mock window.api.support.mailSupport
const mockMailSupport = vi.fn().mockResolvedValue({ success: true })
Object.defineProperty(window, 'api', {
  value: { support: { mailSupport: mockMailSupport } },
  writable: true
})

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }): JSX.Element => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByText('Reload Application')).toBeInTheDocument()
    expect(screen.getByText('Report Issue')).toBeInTheDocument()
  })

  it('reloads the page when reload button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Reload Application'))
    expect(mockReload).toHaveBeenCalledOnce()
  })

  it('opens external link when report issue button is clicked', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByText('Report Issue'))
    await vi.waitFor(() => {
      expect(mockMailSupport).toHaveBeenCalled()
    })
  })
})
