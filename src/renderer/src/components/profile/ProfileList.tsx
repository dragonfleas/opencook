import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/layout/DashboardCard'
import { useProfiles } from '@/hooks/useProfiles'
import { ProfileSummaryDto } from '@/types/profile'

interface ProfileListProps {
  onProfileSelect?: (profile: ProfileSummaryDto) => void
  onProfileEdit?: (profile: ProfileSummaryDto) => void
  onProfileValidate?: (profile: ProfileSummaryDto) => void
}

export function ProfileList({
  onProfileSelect,
  onProfileEdit,
  onProfileValidate
}: ProfileListProps): JSX.Element {
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const { profiles, loading, error, total, activeCount, refetch, deleteProfile, toggleActive } =
    useProfiles(showActiveOnly)

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await deleteProfile(id)
      } catch (err) {
        // Error is already handled in the hook
        console.error('Failed to delete profile:', err)
      }
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean): Promise<void> => {
    try {
      await toggleActive(id, !currentStatus)
    } catch (err) {
      // Error is already handled in the hook
      console.error('Failed to toggle profile status:', err)
    }
  }

  if (loading) {
    return (
      <DashboardCard>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Profiles</h2>
            <p className="text-base text-muted-foreground">Loading profiles...</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground text-base">Loading...</div>
          </div>
        </div>
      </DashboardCard>
    )
  }

  if (error) {
    return (
      <DashboardCard>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Profiles</h2>
            <p className="text-base text-muted-foreground">Error loading profiles</p>
          </div>
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="text-destructive text-base">{error}</div>
            <Button onClick={refetch} variant="outline" className="h-10">
              Retry
            </Button>
          </div>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Profiles</h2>
            <p className="text-base text-muted-foreground">
              {total} total profiles ({activeCount} active)
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant={showActiveOnly ? 'default' : 'outline'}
              size="default"
              onClick={() => setShowActiveOnly(!showActiveOnly)}
            >
              {showActiveOnly ? 'Show All' : 'Active Only'}
            </Button>
            <Button onClick={refetch} variant="outline" size="default">
              Refresh
            </Button>
          </div>
        </div>
        <div>
          {profiles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground text-base">
                {showActiveOnly ? 'No active profiles found' : 'No profiles found'}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge variant={profile.isActive ? 'success' : 'secondary'}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{profile.purchaseCount}</TableCell>
                    <TableCell>
                      {profile.lastUsedAt ? formatDate(profile.lastUsedAt) : 'Never'}
                    </TableCell>
                    <TableCell>{formatDate(profile.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {onProfileSelect && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onProfileSelect(profile)}
                          >
                            View
                          </Button>
                        )}
                        {onProfileEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onProfileEdit(profile)}
                          >
                            Edit
                          </Button>
                        )}
                        {onProfileValidate && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onProfileValidate(profile)}
                          >
                            Validate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(profile.id, profile.isActive)}
                        >
                          {profile.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(profile.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}
