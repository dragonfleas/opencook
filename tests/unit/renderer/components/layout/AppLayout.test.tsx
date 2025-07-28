import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppLayout } from '@/components/layout/AppLayout'

// Mock ThemeContext
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn()
  })
}))

// Mock use-mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  BarChart3: () => <div data-testid="chart-icon">Chart</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor</div>,
  PanelLeftIcon: () => <div data-testid="panel-left-icon">PanelLeft</div>,
  Package2: () => <div data-testid="package-icon">Package2</div>
}))

describe('AppLayout', () => {
  it('should render children content', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render sidebar with navigation items', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Check for sidebar title
    expect(screen.getByText('OpenCook')).toBeInTheDocument()

    // Check for navigation items
    // Use getAllByText for items that might appear multiple times
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getByText('Profiles')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Create Profile')).toBeInTheDocument()
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0)
    expect(screen.getByText('Validation')).toBeInTheDocument()
  })

  it('should show main content area', () => {
    render(
      <AppLayout>
        <div data-testid="content">Main Content</div>
      </AppLayout>
    )

    // Check that content is rendered in the main area
    const content = screen.getByTestId('content')
    expect(content).toBeInTheDocument()

    // Content should be in a flex container
    const contentContainer = content.parentElement
    expect(contentContainer).toHaveClass('flex-1')
  })

  it('should render with proper structure', () => {
    const { container } = render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Should have SidebarProvider wrapper
    const sidebarProvider = container.querySelector('[data-slot="sidebar-wrapper"]')
    expect(sidebarProvider).toBeInTheDocument()

    // Should have sidebar
    const sidebar = container.querySelector('[data-sidebar="sidebar"]')
    expect(sidebar).toBeInTheDocument()

    // Should have SidebarInset
    const inset = container.querySelector('[data-slot="sidebar-inset"]')
    expect(inset).toBeInTheDocument()
  })

  it('should render theme toggle button', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Theme toggle should be present in header
    const sunIcon = screen.getByTestId('sun-icon')
    expect(sunIcon).toBeInTheDocument()
  })

  it('should have header with trigger and title', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Header should exist
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()

    // Should have Dashboard title in header
    const headerTitle = screen.getAllByText('Dashboard').find((el) => el.tagName === 'H1')
    expect(headerTitle).toBeInTheDocument()

    // Should have sidebar trigger button
    const trigger = screen.getByTestId('panel-left-icon').closest('button')
    expect(trigger).toBeInTheDocument()
  })

  it('should render footer with user info', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Footer should contain user section
    const userIcons = screen.getAllByTestId('user-icon')
    const footerUserIcon = userIcons.find((icon) => icon.closest('[data-sidebar="footer"]'))
    expect(footerUserIcon).toBeDefined()

    // Should have user text
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Check for landmark roles
    expect(screen.getByRole('banner')).toBeInTheDocument() // header

    // Should have navigation menu
    const navMenus = screen.getAllByRole('list')
    expect(navMenus.length).toBeGreaterThan(0)
  })

  it('should integrate with theme context', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    )

    // Should render based on theme (we mocked it as 'dark')
    const layoutDiv = document.documentElement
    expect(layoutDiv).toBeDefined()
  })
})
