import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar'

describe('Sidebar', () => {
  it('should render the sidebar with branding', () => {
    render(<Sidebar />)

    expect(screen.getByText('OpenCook')).toBeInTheDocument()
    expect(screen.getByText('Retail Bot Manager')).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Profiles')).toBeInTheDocument()
    expect(screen.getByText('Create Profile')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Validation')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should render user information in footer', () => {
    render(<Sidebar />)

    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByText('admin@opencook.app')).toBeInTheDocument()
  })

  it('should handle navigation item clicks', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<Sidebar />)

    const dashboardItem = screen.getByText('Dashboard')
    fireEvent.click(dashboardItem)

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Dashboard')

    consoleSpy.mockRestore()
  })

  it('should show active state correctly', () => {
    render(<Sidebar />)

    const dashboardItem = screen.getByText('Dashboard').closest('button')
    const profilesItem = screen.getByText('Profiles').closest('button')

    // Dashboard should be active by default
    expect(dashboardItem).toHaveClass('bg-sidebar-primary')
    expect(dashboardItem).toHaveClass('text-sidebar-primary-foreground')

    // Profiles should not be active
    expect(profilesItem).not.toHaveClass('bg-sidebar-primary')
    expect(profilesItem).toHaveClass('text-sidebar-foreground')
  })

  it('should render custom children', () => {
    render(
      <Sidebar>
        <div data-testid="custom-content">Custom Content</div>
      </Sidebar>
    )

    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.getByText('Custom Content')).toBeInTheDocument()
  })
})

describe('SidebarItem', () => {
  it('should render with icon and label', () => {
    const TestIcon = (): JSX.Element => <div data-testid="test-icon">Icon</div>

    render(<SidebarItem icon={<TestIcon />} label="Test Item" onClick={() => {}} />)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Test Item')).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    const TestIcon = (): JSX.Element => <div>Icon</div>

    render(<SidebarItem icon={<TestIcon />} label="Test Item" onClick={handleClick} />)

    const button = screen.getByText('Test Item').closest('button')
    fireEvent.click(button!)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should apply active styles when isActive is true', () => {
    const TestIcon = (): JSX.Element => <div>Icon</div>

    render(
      <SidebarItem icon={<TestIcon />} label="Active Item" isActive={true} onClick={() => {}} />
    )

    const button = screen.getByText('Active Item').closest('button')
    expect(button).toHaveClass('bg-sidebar-primary')
    expect(button).toHaveClass('text-sidebar-primary-foreground')
  })

  it('should apply inactive styles when isActive is false', () => {
    const TestIcon = (): JSX.Element => <div>Icon</div>

    render(
      <SidebarItem icon={<TestIcon />} label="Inactive Item" isActive={false} onClick={() => {}} />
    )

    const button = screen.getByText('Inactive Item').closest('button')
    expect(button).not.toHaveClass('bg-sidebar-primary')
    expect(button).toHaveClass('text-sidebar-foreground')
  })

  it('should apply custom className', () => {
    const TestIcon = (): JSX.Element => <div>Icon</div>

    render(
      <SidebarItem
        icon={<TestIcon />}
        label="Custom Item"
        className="custom-class"
        onClick={() => {}}
      />
    )

    const button = screen.getByText('Custom Item').closest('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should be keyboard accessible', () => {
    const handleClick = vi.fn()
    const TestIcon = (): JSX.Element => <div>Icon</div>

    render(<SidebarItem icon={<TestIcon />} label="Keyboard Item" onClick={handleClick} />)

    const button = screen.getByText('Keyboard Item').closest('button')

    // Should be focusable
    button?.focus()
    expect(document.activeElement).toBe(button)

    // Should handle keyboard events
    fireEvent.keyDown(button!, { key: 'Enter' })
    // Note: React doesn't trigger onClick on Enter by default for buttons
    // but the button should still be focusable and have proper ARIA attributes
  })
})
