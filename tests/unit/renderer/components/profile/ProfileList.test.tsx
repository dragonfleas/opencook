import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileList } from '@/components/profile/ProfileList'
import { ProfilesProvider } from '@/contexts/ProfilesContext'
import { useProfiles } from '@/hooks/useProfiles'
import type { ProfileSummaryDto } from '@/types/profile'

// Mock the underlying useProfiles hook
vi.mock('@/hooks/useProfiles', () => ({
  useProfiles: vi.fn()
}))

const mockUseProfiles = vi.mocked(useProfiles)

// Mock window.confirm
global.confirm = vi.fn()

describe('ProfileList', () => {
  const mockProfiles: ProfileSummaryDto[] = [
    {
      id: '1',
      name: 'Profile 1',
      email: 'profile1@example.com',
      isActive: true,
      purchaseCount: 5,
      createdAt: '2023-01-01T00:00:00.000Z',
      lastUsedAt: '2023-06-01T00:00:00.000Z'
    },
    {
      id: '2',
      name: 'Profile 2',
      email: 'profile2@example.com',
      isActive: false,
      purchaseCount: 2,
      createdAt: '2023-01-02T00:00:00.000Z'
    }
  ]

  const defaultMockReturn = {
    profiles: mockProfiles,
    loading: false,
    error: null,
    total: 2,
    activeCount: 1,
    refetch: vi.fn(),
    deleteProfile: vi.fn(),
    toggleActive: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProfiles.mockReturnValue(defaultMockReturn)
    ;(global.confirm as jest.MockedFunction<typeof confirm>).mockReturnValue(true)
  })

  it('should render profiles table', () => {
    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    expect(screen.getByText('Profiles')).toBeInTheDocument()
    expect(screen.getByText('2 total profiles (1 active)')).toBeInTheDocument()
    expect(screen.getByText('Profile 1')).toBeInTheDocument()
    expect(screen.getByText('profile1@example.com')).toBeInTheDocument()
    expect(screen.getByText('Profile 2')).toBeInTheDocument()
    expect(screen.getByText('profile2@example.com')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      loading: true,
      profiles: []
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    expect(screen.getByText('Loading profiles...')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    const mockRefetch = vi.fn()
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      loading: false,
      error: 'Failed to load profiles',
      profiles: [],
      refetch: mockRefetch
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    expect(screen.getByText('Error loading profiles')).toBeInTheDocument()
    expect(screen.getByText('Failed to load profiles')).toBeInTheDocument()

    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('should show empty state', () => {
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      profiles: [],
      total: 0,
      activeCount: 0
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    expect(screen.getByText('No profiles found')).toBeInTheDocument()
  })

  it('should show empty active profiles state', () => {
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      profiles: [],
      total: 0,
      activeCount: 0
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    // Click active only button
    const activeOnlyButton = screen.getByText('Active Only')
    fireEvent.click(activeOnlyButton)

    expect(screen.getByText('No active profiles found')).toBeInTheDocument()
  })

  it('should display profile status badges correctly', () => {
    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const activeProfile = screen.getByText('Active')
    const inactiveProfile = screen.getByText('Inactive')

    expect(activeProfile).toBeInTheDocument()
    expect(inactiveProfile).toBeInTheDocument()
  })

  it('should format dates correctly', () => {
    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    // Should show "Never" for profiles never used
    expect(screen.getByText('Never')).toBeInTheDocument() // Profile 2 never used

    // Should show formatted dates (test for presence of any date text)
    // We don't test the exact format since it depends on locale
    const createdCells = screen.getAllByText(/\d{4}/) // Any year format
    expect(createdCells.length).toBeGreaterThan(0)
  })

  it('should handle delete profile', async () => {
    const mockDeleteProfile = vi.fn().mockResolvedValue(undefined)
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      deleteProfile: mockDeleteProfile
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this profile?')
    await waitFor(() => {
      expect(mockDeleteProfile).toHaveBeenCalledWith('1')
    })
  })

  it('should not delete profile if user cancels', () => {
    const mockDeleteProfile = vi.fn()
    ;(global.confirm as jest.MockedFunction<typeof confirm>).mockReturnValue(false)

    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      deleteProfile: mockDeleteProfile
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(global.confirm).toHaveBeenCalled()
    expect(mockDeleteProfile).not.toHaveBeenCalled()
  })

  it('should handle toggle active status', async () => {
    const mockToggleActive = vi.fn().mockResolvedValue(undefined)
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      toggleActive: mockToggleActive
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    // Find deactivate button for active profile
    const deactivateButton = screen.getByText('Deactivate')
    fireEvent.click(deactivateButton)

    await waitFor(() => {
      expect(mockToggleActive).toHaveBeenCalledWith('1', false)
    })

    // Find activate button for inactive profile
    const activateButton = screen.getByText('Activate')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(mockToggleActive).toHaveBeenCalledWith('2', true)
    })
  })

  it('should handle active only filter', () => {
    const mockUseProfilesActiveOnly = vi.fn().mockReturnValue(defaultMockReturn)
    mockUseProfiles.mockImplementation((activeOnly) => {
      if (activeOnly) {
        return mockUseProfilesActiveOnly()
      }
      return defaultMockReturn
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const activeOnlyButton = screen.getByText('Active Only')
    fireEvent.click(activeOnlyButton)

    // Button text should change
    expect(screen.getByText('Show All')).toBeInTheDocument()
  })

  it('should handle refetch', () => {
    const mockRefetch = vi.fn()
    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      refetch: mockRefetch
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockRefetch).toHaveBeenCalled()
  })

  it('should call callback functions when provided', () => {
    const mockOnProfileSelect = vi.fn()
    const mockOnProfileEdit = vi.fn()
    const mockOnProfileValidate = vi.fn()

    render(
      <ProfilesProvider>
        <ProfileList
          onProfileSelect={mockOnProfileSelect}
          onProfileEdit={mockOnProfileEdit}
          onProfileValidate={mockOnProfileValidate}
        />
      </ProfilesProvider>
    )

    // Should show additional action buttons
    expect(screen.getAllByText('View')).toHaveLength(2)
    expect(screen.getAllByText('Edit')).toHaveLength(2)
    expect(screen.getAllByText('Validate')).toHaveLength(2)

    // Click on first profile's buttons
    fireEvent.click(screen.getAllByText('View')[0])
    expect(mockOnProfileSelect).toHaveBeenCalledWith(mockProfiles[0])

    fireEvent.click(screen.getAllByText('Edit')[0])
    expect(mockOnProfileEdit).toHaveBeenCalledWith(mockProfiles[0])

    fireEvent.click(screen.getAllByText('Validate')[0])
    expect(mockOnProfileValidate).toHaveBeenCalledWith(mockProfiles[0])
  })

  it('should handle delete errors gracefully', async () => {
    const mockDeleteProfile = vi.fn().mockRejectedValue(new Error('Delete failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      deleteProfile: mockDeleteProfile
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const deleteButton = screen.getAllByText('Delete')[0]
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete profile:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should handle toggle active errors gracefully', async () => {
    const mockToggleActive = vi.fn().mockRejectedValue(new Error('Toggle failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockUseProfiles.mockReturnValue({
      ...defaultMockReturn,
      toggleActive: mockToggleActive
    })

    render(
      <ProfilesProvider>
        <ProfileList />
      </ProfilesProvider>
    )

    const deactivateButton = screen.getByText('Deactivate')
    fireEvent.click(deactivateButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle profile status:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})
