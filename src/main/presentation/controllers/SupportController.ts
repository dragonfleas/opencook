import { shell } from 'electron'
import { IpcResponse } from '../../../shared/types/ipc.types'

/**
 * Controller for handling support-related operations in the main process.
 * Provides specific support functionality to the renderer process.
 */
export class SupportController {
  private readonly SUPPORT_EMAIL = 'mailto:admin@opencook.org'

  /**
   * Opens the support email in the default email client.
   * @returns A promise that resolves to an IpcResponse
   */
  async handleMailSupport(): Promise<IpcResponse<void>> {
    try {
      await shell.openExternal(this.SUPPORT_EMAIL)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MAIL_CLIENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to open email client'
        }
      }
    }
  }
}
