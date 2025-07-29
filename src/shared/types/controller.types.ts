/**
 * Base types and interfaces for controllers in the presentation layer.
 * These provide a standardized structure for handling IPC requests across all entities.
 *
 * @since 1.0.0
 */

import { IpcMainInvokeEvent } from 'electron'
import {
  IpcResponse,
  BaseDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseListQuery,
  BaseListResponse
} from './ipc.types'

/**
 * Base interface for all controllers that handle IPC requests.
 * Provides a standardized CRUD interface that all entity controllers should implement.
 *
 * @template TEntity - The entity type (e.g., Profile, User)
 * @template TCreateDto - The DTO type for create operations
 * @template TUpdateDto - The DTO type for update operations
 * @template TListQuery - The query type for list operations
 *
 * @example
 * ```typescript
 * class ProfileController implements IBaseController<
 *   ProfileResponseDto,
 *   CreateProfileDto,
 *   UpdateProfileDto,
 *   ProfileListQuery
 * > {
 *   async handleCreate(event: IpcMainInvokeEvent, dto: CreateProfileDto) {
 *     // Implementation
 *   }
 *   // ... other methods
 * }
 * ```
 */
export interface IBaseController<
  TEntity extends BaseDto,
  TCreateDto extends BaseCreateDto,
  TUpdateDto extends BaseUpdateDto,
  TListQuery extends BaseListQuery = BaseListQuery
> {
  /**
   * Handles create requests for the entity.
   *
   * @param event - The IPC event object
   * @param dto - The data transfer object containing entity data
   * @returns Promise resolving to an IPC response with the created entity
   */
  handleCreate(event: IpcMainInvokeEvent, dto: TCreateDto): Promise<IpcResponse<TEntity>>

  /**
   * Handles get requests for a specific entity by ID.
   *
   * @param event - The IPC event object
   * @param id - The unique identifier of the entity
   * @returns Promise resolving to an IPC response with the entity data
   */
  handleGet(event: IpcMainInvokeEvent, id: string): Promise<IpcResponse<TEntity>>

  /**
   * Handles list requests for entities with optional filtering.
   *
   * @param event - The IPC event object
   * @param query - Query parameters for filtering and pagination
   * @returns Promise resolving to an IPC response with the list of entities
   */
  handleList(
    event: IpcMainInvokeEvent,
    query?: TListQuery
  ): Promise<IpcResponse<BaseListResponse<TEntity>>>

  /**
   * Handles update requests for an existing entity.
   *
   * @param event - The IPC event object
   * @param dto - The data transfer object containing updated entity data
   * @returns Promise resolving to an IPC response with the updated entity
   */
  handleUpdate(event: IpcMainInvokeEvent, dto: TUpdateDto): Promise<IpcResponse<TEntity>>

  /**
   * Handles delete requests for an entity by ID.
   *
   * @param event - The IPC event object
   * @param id - The unique identifier of the entity to delete
   * @returns Promise resolving to an IPC response (void on success)
   */
  handleDelete(event: IpcMainInvokeEvent, id: string): Promise<IpcResponse<void>>
}

/**
 * Extended controller interface for entities that support activation/deactivation.
 * Many entities in the application have an active/inactive state.
 *
 * @template TEntity - The entity type
 * @template TCreateDto - The DTO type for create operations
 * @template TUpdateDto - The DTO type for update operations
 * @template TListQuery - The query type for list operations
 */
export interface IActivatableController<
  TEntity extends BaseDto,
  TCreateDto extends BaseCreateDto,
  TUpdateDto extends BaseUpdateDto,
  TListQuery extends BaseListQuery = BaseListQuery
> extends IBaseController<TEntity, TCreateDto, TUpdateDto, TListQuery> {
  /**
   * Handles toggle active status requests for an entity.
   *
   * @param event - The IPC event object
   * @param id - The unique identifier of the entity
   * @param isActive - Whether the entity should be active or inactive
   * @returns Promise resolving to an IPC response with the updated entity
   */
  handleToggleActive(
    event: IpcMainInvokeEvent,
    id: string,
    isActive: boolean
  ): Promise<IpcResponse<TEntity>>
}

/**
 * Extended controller interface for entities that support validation operations.
 * Some entities need validation before certain operations can be performed.
 *
 * @template TEntity - The entity type
 * @template TCreateDto - The DTO type for create operations
 * @template TUpdateDto - The DTO type for update operations
 * @template TListQuery - The query type for list operations
 * @template TValidationResult - The type returned by validation operations
 */
export interface IValidatableController<
  TEntity extends BaseDto,
  TCreateDto extends BaseCreateDto,
  TUpdateDto extends BaseUpdateDto,
  TValidationResult,
  TListQuery extends BaseListQuery = BaseListQuery
> extends IBaseController<TEntity, TCreateDto, TUpdateDto, TListQuery> {
  /**
   * Handles validation requests for an entity.
   *
   * @param event - The IPC event object
   * @param id - The unique identifier of the entity to validate
   * @param context - Optional context information for validation
   * @returns Promise resolving to an IPC response with validation results
   */
  handleValidate(
    event: IpcMainInvokeEvent,
    id: string,
    context?: unknown
  ): Promise<IpcResponse<TValidationResult>>
}

/**
 * Full-featured controller interface that combines all standard operations.
 * This is the most complete interface that supports create, read, update, delete,
 * activate/deactivate, and validation operations.
 *
 * @template TEntity - The entity type
 * @template TCreateDto - The DTO type for create operations
 * @template TUpdateDto - The DTO type for update operations
 * @template TValidationResult - The type returned by validation operations
 * @template TListQuery - The query type for list operations
 */
export interface IFullController<
  TEntity extends BaseDto,
  TCreateDto extends BaseCreateDto,
  TUpdateDto extends BaseUpdateDto,
  TValidationResult,
  TListQuery extends BaseListQuery = BaseListQuery
> extends IActivatableController<TEntity, TCreateDto, TUpdateDto, TListQuery>,
    IValidatableController<TEntity, TCreateDto, TUpdateDto, TValidationResult, TListQuery> {
  // This interface combines both activatable and validatable controllers
  // The methods are inherited from the parent interfaces
}

/**
 * Configuration options for controllers.
 * Allows customization of controller behavior.
 */
export interface ControllerConfig {
  /** The entity name (used for logging and channel naming) */
  entityName: string
  /** Whether to enable detailed logging */
  enableLogging?: boolean
  /** Maximum number of items to return in list operations */
  maxListLimit?: number
  /** Default sort field for list operations */
  defaultSortBy?: string
  /** Default sort order for list operations */
  defaultSortOrder?: 'asc' | 'desc'
}

/**
 * Standard error context for controller error handling.
 * Provides additional information about where and why an error occurred.
 */
export interface ControllerErrorContext {
  /** The controller method where the error occurred */
  method: string
  /** The entity type being processed */
  entityType: string
  /** The entity ID (if applicable) */
  entityId?: string
  /** Additional context data */
  context?: unknown
}
