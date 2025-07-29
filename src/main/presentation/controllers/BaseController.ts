/**
 * Abstract base controller that provides common functionality for all entity controllers.
 * This class implements standardized error handling, logging, and response formatting
 * that all controllers can inherit and customize as needed.
 *
 * @since 1.0.0
 */

import { IpcMainInvokeEvent } from 'electron'
import {
  IpcResponse,
  IpcErrorCode,
  createSuccessResponse,
  createErrorResponse,
  BaseDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseListQuery,
  BaseListResponse
} from '../../../shared/types/ipc.types'
import {
  IFullController,
  ControllerConfig,
  ControllerErrorContext
} from '../../../shared/types/controller.types'
import { ValidationError } from '../../domain/errors/ValidationError'

/**
 * Abstract base controller that provides common functionality for all entity controllers.
 * Implements the IFullController interface with comprehensive error handling and logging.
 *
 * @template TEntity - The entity type being managed
 * @template TCreateDto - The DTO type for create operations
 * @template TUpdateDto - The DTO type for update operations
 * @template TValidationResult - The type returned by validation operations
 * @template TListQuery - The query type for list operations
 *
 * @example
 * ```typescript
 * export class ProfileController extends BaseController<
 *   ProfileResponseDto,
 *   CreateProfileDto,
 *   UpdateProfileDto,
 *   ProfileValidationResult
 * > {
 *   constructor(
 *     createUseCase: CreateProfileUseCase,
 *     getUseCase: GetProfileUseCase,
 *     // ... other use cases
 *   ) {
 *     super({
 *       entityName: 'profile',
 *       enableLogging: true
 *     })
 *     // ... initialize use cases
 *   }
 *
 *   protected async executeCreate(dto: CreateProfileDto): Promise<ProfileResponseDto> {
 *     return this.createUseCase.execute(dto)
 *   }
 *   // ... implement other abstract methods
 * }
 * ```
 */
export abstract class BaseController<
  TEntity extends BaseDto,
  TCreateDto extends BaseCreateDto,
  TUpdateDto extends BaseUpdateDto,
  TValidationResult,
  TListQuery extends BaseListQuery = BaseListQuery
> implements IFullController<TEntity, TCreateDto, TUpdateDto, TValidationResult, TListQuery>
{
  protected readonly config: ControllerConfig

  constructor(config: ControllerConfig) {
    this.config = {
      enableLogging: true,
      maxListLimit: 100,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      ...config
    }
  }

  /**
   * Handles create requests with standardized error handling and logging.
   */
  async handleCreate(_event: IpcMainInvokeEvent, dto: TCreateDto): Promise<IpcResponse<TEntity>> {
    const context: ControllerErrorContext = {
      method: 'handleCreate',
      entityType: this.config.entityName,
      context: { dto }
    }

    try {
      this.logOperation('Creating', this.config.entityName, { dto })

      const entity = await this.executeCreate(dto)

      this.logOperation('Created', this.config.entityName, { id: entity.id })
      return createSuccessResponse(entity)
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  /**
   * Handles get requests with standardized error handling and logging.
   */
  async handleGet(_event: IpcMainInvokeEvent, id: string): Promise<IpcResponse<TEntity>> {
    const context: ControllerErrorContext = {
      method: 'handleGet',
      entityType: this.config.entityName,
      entityId: id
    }

    try {
      this.logOperation('Getting', this.config.entityName, { id })

      const entity = await this.executeGet(id)

      this.logOperation('Retrieved', this.config.entityName, { id })
      return createSuccessResponse(entity)
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  /**
   * Handles list requests with standardized error handling, logging, and query validation.
   */
  async handleList(
    _event: IpcMainInvokeEvent,
    query?: TListQuery
  ): Promise<IpcResponse<BaseListResponse<TEntity>>> {
    const context: ControllerErrorContext = {
      method: 'handleList',
      entityType: this.config.entityName,
      context: { query }
    }

    try {
      // Validate and sanitize query parameters
      const sanitizedQuery = this.sanitizeListQuery(query)

      this.logOperation('Listing', `${this.config.entityName}s`, { query: sanitizedQuery })

      const result = await this.executeList(sanitizedQuery)

      this.logOperation('Listed', `${this.config.entityName}s`, {
        count: result.count,
        total: result.total
      })
      return createSuccessResponse(result)
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  /**
   * Handles update requests with standardized error handling and logging.
   */
  async handleUpdate(_event: IpcMainInvokeEvent, dto: TUpdateDto): Promise<IpcResponse<TEntity>> {
    const context: ControllerErrorContext = {
      method: 'handleUpdate',
      entityType: this.config.entityName,
      entityId: dto.id,
      context: { dto }
    }

    try {
      this.logOperation('Updating', this.config.entityName, { id: dto.id })

      const entity = await this.executeUpdate(dto)

      this.logOperation('Updated', this.config.entityName, { id: entity.id })
      return createSuccessResponse(entity)
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  /**
   * Handles delete requests with standardized error handling and logging.
   */
  async handleDelete(_event: IpcMainInvokeEvent, id: string): Promise<IpcResponse<void>> {
    const context: ControllerErrorContext = {
      method: 'handleDelete',
      entityType: this.config.entityName,
      entityId: id
    }

    try {
      this.logOperation('Deleting', this.config.entityName, { id })

      await this.executeDelete(id)

      this.logOperation('Deleted', this.config.entityName, { id })
      return createSuccessResponse()
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  /**
   * Handles toggle active requests with standardized error handling and logging.
   */
  async handleToggleActive(
    _event: IpcMainInvokeEvent,
    id: string,
    isActive: boolean
  ): Promise<IpcResponse<TEntity>> {
    const context: ControllerErrorContext = {
      method: 'handleToggleActive',
      entityType: this.config.entityName,
      entityId: id,
      context: { isActive }
    }

    try {
      this.logOperation('Toggling active status', this.config.entityName, { id, isActive })

      const entity = await this.executeToggleActive(id, isActive)

      this.logOperation('Toggled active status', this.config.entityName, { id, isActive })
      return createSuccessResponse(entity)
    } catch (error) {
      return this.handleError(error, context)
    }
  }

  /**
   * Handles validate requests with standardized error handling and logging.
   */
  async handleValidate(
    _event: IpcMainInvokeEvent,
    id: string,
    context?: unknown
  ): Promise<IpcResponse<TValidationResult>> {
    const errorContext: ControllerErrorContext = {
      method: 'handleValidate',
      entityType: this.config.entityName,
      entityId: id,
      context
    }

    try {
      this.logOperation('Validating', this.config.entityName, { id })

      const result = await this.executeValidate(id, context)

      this.logOperation('Validated', this.config.entityName, { id })
      return createSuccessResponse(result)
    } catch (error) {
      return this.handleError(error, errorContext)
    }
  }

  // Abstract methods that must be implemented by concrete controllers

  /**
   * Executes the actual create operation. Must be implemented by concrete controllers.
   */
  protected abstract executeCreate(dto: TCreateDto): Promise<TEntity>

  /**
   * Executes the actual get operation. Must be implemented by concrete controllers.
   */
  protected abstract executeGet(id: string): Promise<TEntity>

  /**
   * Executes the actual list operation. Must be implemented by concrete controllers.
   */
  protected abstract executeList(query?: TListQuery): Promise<BaseListResponse<TEntity>>

  /**
   * Executes the actual update operation. Must be implemented by concrete controllers.
   */
  protected abstract executeUpdate(dto: TUpdateDto): Promise<TEntity>

  /**
   * Executes the actual delete operation. Must be implemented by concrete controllers.
   */
  protected abstract executeDelete(id: string): Promise<void>

  /**
   * Executes the actual toggle active operation. Must be implemented by concrete controllers.
   */
  protected abstract executeToggleActive(id: string, isActive: boolean): Promise<TEntity>

  /**
   * Executes the actual validate operation. Must be implemented by concrete controllers.
   */
  protected abstract executeValidate(id: string, context?: unknown): Promise<TValidationResult>

  // Utility methods

  /**
   * Sanitizes and validates list query parameters.
   */
  protected sanitizeListQuery(query?: TListQuery): TListQuery {
    const sanitized = query ? { ...query } : ({} as TListQuery)

    // Enforce maximum limit
    if (sanitized.limit && sanitized.limit > this.config.maxListLimit!) {
      sanitized.limit = this.config.maxListLimit!
    }

    // Set default sort parameters if not provided
    if (!sanitized.sortBy) {
      sanitized.sortBy = this.config.defaultSortBy
    }

    if (!sanitized.sortOrder) {
      sanitized.sortOrder = this.config.defaultSortOrder
    }

    return sanitized
  }

  /**
   * Standardized error handling for all controller operations.
   */
  protected handleError<T>(error: unknown, context: ControllerErrorContext): IpcResponse<T> {
    this.logError(error, context)

    // Handle validation errors
    if (error instanceof ValidationError) {
      return createErrorResponse(IpcErrorCode.VALIDATION_ERROR, error.message, {
        field: error.field,
        value: error.value
      })
    }

    // Handle domain-specific errors (these should be implemented by concrete controllers)
    const domainErrorDetails = this.mapErrorToDetails(error)
    if (domainErrorDetails) {
      return createErrorResponse(
        domainErrorDetails.code as IpcErrorCode,
        error instanceof Error ? error.message : 'An error occurred',
        domainErrorDetails.details
      )
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'

    return createErrorResponse(IpcErrorCode.INTERNAL_ERROR, errorMessage)
  }

  /**
   * Map domain-specific errors to error codes and details. Should be overridden by concrete controllers
   * to handle their specific domain errors.
   */
  protected abstract mapErrorToDetails(error: unknown): { code: string; details?: unknown } | null

  /**
   * Logs operations if logging is enabled.
   */
  protected logOperation(action: string, entityType: string, details?: unknown): void {
    if (this.config.enableLogging) {
      console.log(`[${this.constructor.name}] ${action} ${entityType}`, details ? details : '')
    }
  }

  /**
   * Logs errors with context information.
   */
  protected logError(error: unknown, context: ControllerErrorContext): void {
    if (this.config.enableLogging) {
      console.error(`[${this.constructor.name}] Error in ${context.method}:`, {
        error: error instanceof Error ? error.message : String(error),
        context
      })
    }
  }
}
