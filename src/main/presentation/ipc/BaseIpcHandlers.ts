import { ipcMain } from 'electron'
import { IFullController } from '../../../shared/types/controller.types'
import {
  BaseDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseListQuery,
  createIpcChannel,
  IpcOperation
} from '../../../shared/types/ipc.types'

/**
 * Abstract base class for IPC handlers that provides standardized registration
 * and unregistration of IPC channels for CRUD operations.
 *
 * @template TEntity - The entity type (e.g., ProfileResponseDto)
 * @template TCreateDto - The creation DTO type
 * @template TUpdateDto - The update DTO type
 * @template TValidationResult - The validation result type
 * @template TListQuery - The list query type
 *
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * class ProfileIpcHandlers extends BaseIpcHandlers<
 *   ProfileResponseDto,
 *   CreateProfileDto,
 *   UpdateProfileDto,
 *   ProfileValidationResult,
 *   ProfileListQuery
 * > {
 *   constructor(controller: ProfileController) {
 *     super('profile', controller)
 *   }
 * }
 * ```
 */
export abstract class BaseIpcHandlers<
  TEntity extends BaseDto,
  TCreateDto extends BaseCreateDto,
  TUpdateDto extends BaseUpdateDto,
  TValidationResult,
  TListQuery extends BaseListQuery
> {
  private readonly channels: string[] = []

  /**
   * Creates a new BaseIpcHandlers instance.
   *
   * @param entityName - The entity name used for IPC channel naming (e.g., 'profile')
   * @param controller - The controller instance that handles the business logic
   */
  constructor(
    protected readonly entityName: string,
    protected readonly controller: IFullController<
      TEntity,
      TCreateDto,
      TUpdateDto,
      TValidationResult,
      TListQuery
    >
  ) {}

  /**
   * Registers all standard CRUD IPC handlers for this entity.
   * Creates channels for create, get, list, update, delete, toggle-active, and validate operations.
   */
  register(): void {
    this.registerCreateHandler()
    this.registerGetHandler()
    this.registerListHandler()
    this.registerUpdateHandler()
    this.registerDeleteHandler()
    this.registerToggleActiveHandler()
    this.registerValidateHandler()

    // Allow derived classes to register additional handlers
    this.registerCustomHandlers()
  }

  /**
   * Unregisters all IPC handlers that were registered by this instance.
   * Cleans up all registered channels to prevent memory leaks.
   */
  unregister(): void {
    for (const channel of this.channels) {
      ipcMain.removeHandler(channel)
    }
    this.channels.length = 0
  }

  /**
   * Override this method in derived classes to register additional custom IPC handlers
   * beyond the standard CRUD operations.
   *
   * @example
   * ```typescript
   * protected registerCustomHandlers(): void {
   *   this.registerHandler('profile:import', (event, data) =>
   *     this.controller.handleImport(event, data)
   *   )
   * }
   * ```
   */
  protected registerCustomHandlers(): void {
    // Override in derived classes if needed
  }

  /**
   * Helper method to register a custom IPC handler and track it for cleanup.
   *
   * @param channel - The IPC channel name
   * @param handler - The handler function
   */
  protected registerHandler(
    channel: string,
    handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
  ): void {
    ipcMain.handle(channel, handler)
    this.channels.push(channel)
  }

  private registerCreateHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.CREATE)
    this.registerHandler(channel, (event, dto) =>
      this.controller.handleCreate(event, dto as TCreateDto)
    )
  }

  private registerGetHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.GET)
    this.registerHandler(channel, (event, id) => this.controller.handleGet(event, id as string))
  }

  private registerListHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.LIST)
    this.registerHandler(channel, (event, query) =>
      this.controller.handleList(event, query as TListQuery | undefined)
    )
  }

  private registerUpdateHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.UPDATE)
    this.registerHandler(channel, (event, dto) =>
      this.controller.handleUpdate(event, dto as TUpdateDto)
    )
  }

  private registerDeleteHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.DELETE)
    this.registerHandler(channel, (event, id) => this.controller.handleDelete(event, id as string))
  }

  private registerToggleActiveHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.TOGGLE_ACTIVE)
    this.registerHandler(channel, (event, id, isActive) =>
      this.controller.handleToggleActive(event, id as string, isActive as boolean)
    )
  }

  private registerValidateHandler(): void {
    const channel = createIpcChannel(this.entityName, IpcOperation.VALIDATE)
    this.registerHandler(channel, (event, id, context) =>
      this.controller.handleValidate(event, id as string, context)
    )
  }
}
