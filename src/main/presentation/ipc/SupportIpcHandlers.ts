import { ipcMain } from 'electron'
import { SupportController } from '../controllers/SupportController'

/**
 * IPC handlers for support-related operations.
 * Provides secure IPC channels for support functionality.
 */
export class SupportIpcHandlers {
  private readonly supportController: SupportController
  private readonly channels: string[] = []

  constructor() {
    this.supportController = new SupportController()
  }

  /**
   * Register support-specific IPC handlers
   */
  register(): void {
    const channel = 'support:mailSupport'
    ipcMain.handle(channel, () => this.supportController.handleMailSupport())
    this.channels.push(channel)
  }

  /**
   * Unregister all IPC handlers
   */
  unregister(): void {
    for (const channel of this.channels) {
      ipcMain.removeHandler(channel)
    }
    this.channels.length = 0
  }
}
