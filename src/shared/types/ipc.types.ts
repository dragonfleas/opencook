/**
 * Shared types for Inter-Process Communication (IPC) between main and renderer processes.
 * These types provide a standardized interface for all IPC operations across the application.
 */

/**
 * Standard response format for all IPC operations.
 * Provides consistent success/error handling across all API calls.
 * @template T - The type of data returned on successful operations
 * @example
 * ```typescript
 * // Success response
 * const response: IpcResponse<User> = {
 *   success: true,
 *   data: { id: '1', name: 'John Doe' }
 * }
 * // Error response
 * const response: IpcResponse<User> = {
 *   success: false,
 *   error: {
 *     code: 'USER_NOT_FOUND',
 *     message: 'User with id "1" was not found'
 *   }
 * }
 * ```
 */
export interface IpcResponse<T = unknown> {
  /** Whether the operation completed successfully */
  success: boolean
  /** The data returned by the operation (only present when success is true) */
  data?: T
  /** Error details (only present when success is false) */
  error?: IpcError
}

/**
 * Standardized error structure for IPC operations.
 * Provides consistent error information across all API calls.
 */
export interface IpcError {
  /** A machine-readable error code */
  code: string
  /** A human-readable error message */
  message: string
  /** Optional additional error details */
  details?: unknown
}

/**
 * Standard error codes used across all IPC operations.
 * Provides consistency and makes error handling predictable.
 */
export enum IpcErrorCode {
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Operation-specific errors
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  RESOURCE_INACTIVE = 'RESOURCE_INACTIVE',
  OPERATION_COOLDOWN = 'OPERATION_COOLDOWN',
  OPERATION_LIMIT_EXCEEDED = 'OPERATION_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

/**
 * Standard CRUD operations available for all entities.
 * Provides consistent naming for IPC channels.
 */
export enum IpcOperation {
  CREATE = 'create',
  GET = 'get',
  LIST = 'list',
  UPDATE = 'update',
  DELETE = 'delete',
  TOGGLE_ACTIVE = 'toggle-active',
  VALIDATE = 'validate'
}

/**
 * Creates a standardized IPC channel name.
 * Follows the pattern: {entity}:{operation}
 * @param entity - The entity name (e.g., 'profile', 'user')
 * @param operation - The operation being performed
 * @returns The formatted channel name
 * @example
 * ```typescript
 * const channelName = createIpcChannel('profile', IpcOperation.CREATE)
 * // Returns: 'profile:create'
 * ```
 */
export function createIpcChannel(entity: string, operation: IpcOperation): string {
  return `${entity.toLowerCase()}:${operation}`
}

/**
 * Type-safe helper for creating success responses.
 * @template T - The type of data being returned
 * @param data - The data to include in the response
 * @returns A success IpcResponse
 * @example
 * ```typescript
 * const response = createSuccessResponse({ id: '1', name: 'John' })
 * // Returns: { success: true, data: { id: '1', name: 'John' } }
 * ```
 */
export function createSuccessResponse<T>(data?: T): IpcResponse<T> {
  return {
    success: true,
    data
  }
}

/**
 * Type-safe helper for creating error responses.
 * @template T - The type of data (for type consistency)
 * @param code - The error code
 * @param message - The error message
 * @param details - Optional additional error details
 * @returns An error IpcResponse
 * @example
 * ```typescript
 * const response = createErrorResponse('USER_NOT_FOUND', 'User not found')
 * // Returns: { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
 * ```
 */
export function createErrorResponse<T = unknown>(
  code: string,
  message: string,
  details?: unknown
): IpcResponse<T> {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  }
}

/**
 * Base interface for all entity DTOs used in IPC operations.
 * Provides common structure for data transfer objects.
 */
export interface BaseDto {
  /** Unique identifier for the entity */
  id?: string
  /** Timestamp when the entity was created */
  createdAt?: string
  /** Timestamp when the entity was last updated */
  updatedAt?: string
}

/**
 * Base interface for create DTOs.
 * Excludes fields that are automatically generated.
 */
export interface BaseCreateDto {
  // Base create DTOs typically don't include id, createdAt, updatedAt
  // These are added by the system
}

/**
 * Base interface for update DTOs.
 * Includes the required id field and makes other fields optional for partial updates.
 */
export interface BaseUpdateDto {
  /** The ID of the entity to update */
  id: string
  /** Timestamp when the entity was last updated (optional, can be set by system) */
  updatedAt?: string
}

/**
 * Standard list query parameters for IPC operations.
 * Provides consistent filtering and pagination across all list operations.
 */
export interface BaseListQuery {
  /** Filter to show only active entities */
  activeOnly?: boolean
  /** Maximum number of items to return */
  limit?: number
  /** Number of items to skip (for pagination) */
  offset?: number
  /** Search term to filter results */
  search?: string
  /** Field to sort by */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
}

/**
 * Standard list response format.
 * Provides consistent structure for paginated results.
 * @template T - The type of items in the list
 */
export interface BaseListResponse<T> {
  /** The list of items */
  items: T[]
  /** Total number of items available (before pagination) */
  total: number
  /** Number of items returned in this response */
  count: number
  /** Whether there are more items available */
  hasMore: boolean
}
