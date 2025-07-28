import { ipcMain } from 'electron'
import { ProfileController } from '../controllers/ProfileController'
import { CreateProfileDto, UpdateProfileDto } from '../../application/dto/ProfileDto'

export class ProfileIpcHandlers {
  constructor(private readonly profileController: ProfileController) {}

  register(): void {
    // Profile CRUD operations
    ipcMain.handle('profile:create', (event, dto: CreateProfileDto) =>
      this.profileController.handleCreateProfile(event, dto)
    )

    ipcMain.handle('profile:get', (event, profileId: string) =>
      this.profileController.handleGetProfile(event, profileId)
    )

    ipcMain.handle('profile:list', (event, activeOnly?: boolean) =>
      this.profileController.handleListProfiles(event, activeOnly)
    )

    ipcMain.handle('profile:update', (event, dto: UpdateProfileDto) =>
      this.profileController.handleUpdateProfile(event, dto)
    )

    ipcMain.handle('profile:delete', (event, profileId: string) =>
      this.profileController.handleDeleteProfile(event, profileId)
    )

    ipcMain.handle('profile:toggle-active', (event, profileId: string, isActive: boolean) =>
      this.profileController.handleToggleProfileActive(event, profileId, isActive)
    )

    ipcMain.handle('profile:validate-for-purchase', (event, profileId: string) =>
      this.profileController.handleValidateProfileForPurchase(event, profileId)
    )
  }

  unregister(): void {
    // Remove all profile-related IPC handlers
    ipcMain.removeHandler('profile:create')
    ipcMain.removeHandler('profile:get')
    ipcMain.removeHandler('profile:list')
    ipcMain.removeHandler('profile:update')
    ipcMain.removeHandler('profile:delete')
    ipcMain.removeHandler('profile:toggle-active')
    ipcMain.removeHandler('profile:validate-for-purchase')
  }
}
