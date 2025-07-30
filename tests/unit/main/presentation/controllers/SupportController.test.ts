import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shell } from 'electron'
import { SupportController } from '../../../../../src/main/presentation/controllers/SupportController'

vi.mock('electron', () => ({
  shell: {
    openExternal: vi.fn()
  }
}))

describe('SupportController', () => {
  let controller: SupportController

  beforeEach(() => {
    vi.clearAllMocks()
    controller = new SupportController()
  })

  describe('handleMailSupport', () => {
    it('should open email client with support email', async () => {
      vi.mocked(shell.openExternal).mockResolvedValue()

      const result = await controller.handleMailSupport()

      expect(result.success).toBe(true)
      expect(shell.openExternal).toHaveBeenCalledWith('mailto:admin@opencook.org')
    })

    it('should return error when opening email client fails', async () => {
      const error = new Error('Failed to open')
      vi.mocked(shell.openExternal).mockRejectedValue(error)

      const result = await controller.handleMailSupport()

      expect(result.success).toBe(false)
      expect(result.error).toEqual({
        code: 'MAIL_CLIENT_FAILED',
        message: 'Failed to open'
      })
    })
  })
})
