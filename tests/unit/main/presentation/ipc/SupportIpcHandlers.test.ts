import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ipcMain } from 'electron'
import { SupportIpcHandlers } from '../../../../../src/main/presentation/ipc/SupportIpcHandlers'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn()
  }
}))

describe('SupportIpcHandlers', () => {
  let supportIpcHandlers: SupportIpcHandlers

  beforeEach(() => {
    vi.clearAllMocks()
    supportIpcHandlers = new SupportIpcHandlers()
  })

  describe('register', () => {
    it('should register support:mailSupport handler', () => {
      supportIpcHandlers.register()

      expect(ipcMain.handle).toHaveBeenCalledWith('support:mailSupport', expect.any(Function))
    })
  })

  describe('unregister', () => {
    it('should unregister all handlers', () => {
      supportIpcHandlers.register()
      supportIpcHandlers.unregister()

      expect(ipcMain.removeHandler).toHaveBeenCalledWith('support:mailSupport')
    })

    it('should handle unregister when no handlers are registered', () => {
      supportIpcHandlers.unregister()

      expect(ipcMain.removeHandler).not.toHaveBeenCalled()
    })
  })
})
