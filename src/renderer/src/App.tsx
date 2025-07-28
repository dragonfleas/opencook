import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { ProfileList } from '@/components/profile/ProfileList'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { DashboardCard } from '@/components/layout/DashboardCard'
import { useNavigation } from '@/hooks/use-navigation'
import { CreateProfileFormData } from '@/lib/validations/profile'

function App(): React.JSX.Element {
  const { currentView, setCurrentView } = useNavigation()

  const handleCreateProfile = (data: CreateProfileFormData): void => {
    console.log('Creating profile:', data)
    // TODO: Call profile creation API
    setCurrentView('dashboard')
  }

  const handleCancelCreateProfile = (): void => {
    setCurrentView('dashboard')
  }

  return (
    <AppLayout>
      {currentView === 'dashboard' && (
        <div>
          <DashboardCard>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to OpenCook</h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Manage your retail bot profiles with ease. Create, update, and monitor your
                  profiles for optimal performance.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1 h-11 text-base"
                  onClick={() => setCurrentView('create-profile')}
                >
                  Create New Profile
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11 text-base"
                  onClick={() => setCurrentView('profiles')}
                >
                  View All Profiles
                </Button>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Profile Statistics</h2>
                <p className="text-base text-muted-foreground">
                  Overview of your profile management system
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-3">0</div>
                  <div className="text-sm text-muted-foreground">Total Profiles</div>
                </div>
                <div className="text-center p-6 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-3">0</div>
                  <div className="text-sm text-muted-foreground">Active Profiles</div>
                </div>
                <div className="text-center p-6 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-3">0</div>
                  <div className="text-sm text-muted-foreground">Total Purchases</div>
                </div>
              </div>
            </div>
          </DashboardCard>

          <ProfileList />
        </div>
      )}

      {currentView === 'profiles' && <ProfileList />}

      {currentView === 'create-profile' && (
        <ProfileForm onSubmit={handleCreateProfile} onCancel={handleCancelCreateProfile} />
      )}

      {currentView === 'analytics' && (
        <DashboardCard>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Analytics</h2>
          <p className="text-muted-foreground">Analytics view coming soon...</p>
        </DashboardCard>
      )}

      {currentView === 'validation' && (
        <DashboardCard>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Profile Validation</h2>
          <p className="text-muted-foreground">Validation view coming soon...</p>
        </DashboardCard>
      )}

      {currentView === 'settings' && (
        <DashboardCard>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Settings</h2>
          <p className="text-muted-foreground">Settings view coming soon...</p>
        </DashboardCard>
      )}
    </AppLayout>
  )
}

export default App
