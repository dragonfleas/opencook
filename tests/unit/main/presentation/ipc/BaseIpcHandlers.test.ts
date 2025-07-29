/**
 * Tests for BaseIpcHandlers to ensure correct IPC channel registration and cleanup.
 * These tests verify that the base IPC handlers correctly register and unregister
 * standard CRUD operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ipcMain } from 'electron'
import { BaseIpcHandlers } from '../../../../../src/main/presentation/ipc/BaseIpcHandlers'
import { IFullController } from '../../../../../src/shared/types/controller.types'
import {
  BaseDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseListQuery,
  IpcResponse
} from '../../../../../src/shared/types/ipc.types'

// Mock electron
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn()
  }
}))

// Test types
interface TestEntity extends BaseDto {
  name: string
  isActive: boolean
}

interface TestCreateDto extends BaseCreateDto {
  name: string
}

interface TestUpdateDto extends BaseUpdateDto {
  name?: string
}

interface TestListQuery extends BaseListQuery {
  nameFilter?: string
}

interface TestValidationResult {
  isValid: boolean
  errors: string[]
}

// Test implementation of BaseIpcHandlers
class TestIpcHandlers extends BaseIpcHandlers<
  TestEntity,
  TestCreateDto,
  TestUpdateDto,
  TestValidationResult,
  TestListQuery
> {
  constructor(
    controller: IFullController<
      TestEntity,
      TestCreateDto,
      TestUpdateDto,
      TestValidationResult,
      TestListQuery
    >
  ) {
    super('test', controller)
  }

  // Expose protected method for testing
  public testRegisterHandler(
    channel: string,
    handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
  ): void {
    this.registerHandler(channel, handler)
  }

  // Override to test custom handlers
  protected registerCustomHandlers(): void {
    this.registerHandler('test:custom', async () => ({ custom: 'response' }))
  }
}

describe('BaseIpcHandlers', () => {
  let mockController: IFullController<
    TestEntity,
    TestCreateDto,
    TestUpdateDto,
    TestValidationResult,
    TestListQuery
  >
  let handlers: TestIpcHandlers

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Create mock controller
    mockController = {
      handleCreate: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: '1', name: 'Test', isActive: true } }),
      handleGet: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: '1', name: 'Test', isActive: true } }),
      handleList: vi.fn().mockResolvedValue({
        success: true,
        data: { items: [], total: 0, count: 0, hasMore: false }
      }),
      handleUpdate: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: '1', name: 'Updated', isActive: true } }),
      handleDelete: vi.fn().mockResolvedValue({ success: true }),
      handleToggleActive: vi
        .fn()
        .mockResolvedValue({ success: true, data: { id: '1', name: 'Test', isActive: false } }),
      handleValidate: vi
        .fn()
        .mockResolvedValue({ success: true, data: { isValid: true, errors: [] } })
    }

    handlers = new TestIpcHandlers(mockController)
  })

  afterEach(() => {
    handlers.unregister()
  })

  describe('register', () => {
    it('should register all standard CRUD IPC handlers', () => {
      handlers.register()

      // Verify all standard channels are registered
      expect(ipcMain.handle).toHaveBeenCalledWith('test:create', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('test:get', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('test:list', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('test:update', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('test:delete', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('test:toggle-active', expect.any(Function))
      expect(ipcMain.handle).toHaveBeenCalledWith('test:validate', expect.any(Function))

      // Should also register custom handlers
      expect(ipcMain.handle).toHaveBeenCalledWith('test:custom', expect.any(Function))

      // Should be called 8 times total (7 standard + 1 custom)
      expect(ipcMain.handle).toHaveBeenCalledTimes(8)
    })
  })

  describe('unregister', () => {
    it('should unregister all registered IPC handlers', () => {
      handlers.register()
      handlers.unregister()

      // Verify all channels are unregistered
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:create')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:get')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:list')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:update')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:delete')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:toggle-active')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:validate')
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:custom')

      // Should be called 8 times total
      expect(ipcMain.removeHandler).toHaveBeenCalledTimes(8)
    })

    it('should handle multiple unregister calls gracefully', () => {
      handlers.register()
      handlers.unregister()
      handlers.unregister() // Should not cause issues

      // Second unregister should not call removeHandler again
      expect(ipcMain.removeHandler).toHaveBeenCalledTimes(8)
    })
  })

  describe('registerHandler', () => {
    it('should register a custom handler and track it for cleanup', () => {
      const mockHandler = vi.fn().mockResolvedValue('test-response')

      handlers.testRegisterHandler('test:custom-method', mockHandler)

      expect(ipcMain.handle).toHaveBeenCalledWith('test:custom-method', mockHandler)

      // Should be cleaned up on unregister
      handlers.unregister()
      expect(ipcMain.removeHandler).toHaveBeenCalledWith('test:custom-method')
    })
  })

  describe('registered handlers behavior', () => {
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

    it('should delegate create operations to controller', async () => {
      const createHandler = registeredHandlers.get('test:create')
      expect(createHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const mockDto: TestCreateDto = { name: 'Test Entity' }

      await createHandler!(mockEvent, mockDto)

      expect(mockController.handleCreate).toHaveBeenCalledWith(mockEvent, mockDto)
    })

    it('should delegate get operations to controller', async () => {
      const getHandler = registeredHandlers.get('test:get')
      expect(getHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const testId = 'test-id'

      await getHandler!(mockEvent, testId)

      expect(mockController.handleGet).toHaveBeenCalledWith(mockEvent, testId)
    })

    it('should delegate list operations to controller', async () => {
      const listHandler = registeredHandlers.get('test:list')
      expect(listHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const mockQuery: TestListQuery = { activeOnly: true, nameFilter: 'test' }

      await listHandler!(mockEvent, mockQuery)

      expect(mockController.handleList).toHaveBeenCalledWith(mockEvent, mockQuery)
    })

    it('should delegate update operations to controller', async () => {
      const updateHandler = registeredHandlers.get('test:update')
      expect(updateHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const mockDto: TestUpdateDto = { id: 'test-id', name: 'Updated Name' }

      await updateHandler!(mockEvent, mockDto)

      expect(mockController.handleUpdate).toHaveBeenCalledWith(mockEvent, mockDto)
    })

    it('should delegate delete operations to controller', async () => {
      const deleteHandler = registeredHandlers.get('test:delete')
      expect(deleteHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const testId = 'test-id'

      await deleteHandler!(mockEvent, testId)

      expect(mockController.handleDelete).toHaveBeenCalledWith(mockEvent, testId)
    })

    it('should delegate toggle active operations to controller', async () => {
      const toggleHandler = registeredHandlers.get('test:toggle-active')
      expect(toggleHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const testId = 'test-id'
      const isActive = false

      await toggleHandler!(mockEvent, testId, isActive)

      expect(mockController.handleToggleActive).toHaveBeenCalledWith(mockEvent, testId, isActive)
    })

    it('should delegate validate operations to controller', async () => {
      const validateHandler = registeredHandlers.get('test:validate')
      expect(validateHandler).toBeDefined()

      const mockEvent = {} as Electron.IpcMainInvokeEvent
      const testId = 'test-id'
      const context = { someContext: 'data' }

      await validateHandler!(mockEvent, testId, context)

      expect(mockController.handleValidate).toHaveBeenCalledWith(mockEvent, testId, context)
    })
  })
})
