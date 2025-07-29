/**
 * Tests for ProfileIpcHandlers to ensure correct registration and behavior
 * with the existing Profile functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ipcMain } from 'electron'
import { ProfileIpcHandlers } from '../../../../../src/main/presentation/ipc/ProfileIpcHandlers'
import { ProfileController } from '../../../../../src/main/presentation/controllers/ProfileController'
import { CreateProfileUseCase } from '../../../../../src/main/application/use-cases/CreateProfileUseCase'
import { GetProfileUseCase } from '../../../../../src/main/application/use-cases/GetProfileUseCase'
import { ListProfilesUseCase } from '../../../../../src/main/application/use-cases/ListProfilesUseCase'
import { UpdateProfileUseCase } from '../../../../../src/main/application/use-cases/UpdateProfileUseCase'
import { DeleteProfileUseCase } from '../../../../../src/main/application/use-cases/DeleteProfileUseCase'
import { ToggleProfileActiveUseCase } from '../../../../../src/main/application/use-cases/ToggleProfileActiveUseCase'
import { ValidateProfileForPurchaseUseCase } from '../../../../../src/main/application/use-cases/ValidateProfileForPurchaseUseCase'

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn()
  }
}))

describe('ProfileIpcHandlers', () => {
  let profileController: ProfileController
  let handlers: ProfileIpcHandlers

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock use cases
    const mockCreateUseCase = {} as CreateProfileUseCase
    const mockGetUseCase = {} as GetProfileUseCase
    const mockListUseCase = {} as ListProfilesUseCase
    const mockUpdateUseCase = {} as UpdateProfileUseCase
    const mockDeleteUseCase = {} as DeleteProfileUseCase
    const mockToggleUseCase = {} as ToggleProfileActiveUseCase
    const mockValidateUseCase = {} as ValidateProfileForPurchaseUseCase

    // Create ProfileController with mocked use cases
    profileController = new ProfileController(
      mockCreateUseCase,
      mockGetUseCase,
      mockListUseCase,
      mockUpdateUseCase,
      mockDeleteUseCase,
      mockToggleUseCase,
      mockValidateUseCase
    )

    handlers = new ProfileIpcHandlers(profileController)
  })

  describe('register', () => {
    it('should register all standard profile IPC handlers', () => {
      handlers.register()

      // Verify all expected channels are registered
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:create', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:get', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:list', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:update', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:delete', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:toggle-active', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('profile:validate', expect.any(Function))

      // Should be called 7 times total (all standard operations)
      expect(ipcMain.handle).toHaveBeenCalledTimes(7)
    })
  })

  describe('unregister', () => {
    it('should unregister all profile IPC handlers', () => {
      handlers.register()
      handlers.unregister()

      // Verify all channels are unregistered
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:create')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:get')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:list')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:update')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:delete')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:toggle-active')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('profile:validate')
      // Should be called 7 times total
      expect(ipcMain.removeHandler).toHaveBeenCalledTimes(7)
    })

    it('should handle multiple unregister calls gracefully', () => {
      handlers.register()
      handlers.unregister()
      handlers.unregister() // Should not cause issues

      // Second unregister should not call removeHandler again
      expect(ipcMain.removeHandler).toHaveBeenCalledTimes(7)
    })
  })

  describe('channel compatibility', () => {
    it('should maintain compatibility with existing channel names', () => {
      // These are the exact channel names expected by the frontend
      const expectedChannels = [
        'profile:create',
        'profile:get',
        'profile:list',
        'profile:update',
        'profile:delete',
        'profile:toggle-active',
        'profile:validate'
      ]

      handlers.register()

      for (const channel of expectedChannels) {
        expect(ipcMain.handle).toHaveBeenCalledWith(channel, expect.any(Function))
      }
    })
  })

  describe('handler delegation', () => {
    let registeredHandlers: Map<string, (...args: unknown[]) => Promise<unknown>>

    beforeEach(() => {
      registeredHandlers = new Map()

      // Capture the handlers that are registered
      vi.mocked(ipcMain.handle).mockImplementation(
        (channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
          registeredHandlers.set(channel, handler)
        }
      )

      handlers.register()
    })

    it('should delegate validation calls to the controller', async () => {
      const validateHandler = registeredHandlers.get('profile:validate')

      expect(validateHandler).toBeDefined()

      // Mock the controller method
      const mockValidate = vi.spyOn(profileController, 'handleValidate').mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          errors: [],
          warnings: [],
          canPurchase: true,
          cooldownEndTime: null,
          purchaseCount: 0,
          lastPurchaseTime: null
        }
      })

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const testId = 'test-profile-id'

      // Call the validate handler
      await validateHandler!(mockEvent, testId)

      // Verify it delegates to the controller's handleValidate method
      expect(mockValidate).toHaveBeenCalledWith(mockEvent, testId, undefined)
    })
  })
})
