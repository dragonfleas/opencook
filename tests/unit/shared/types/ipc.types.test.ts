/**
 * Tests for shared IPC types to ensure they work correctly with existing code.
 * These tests validate that the generic types are properly structured and compatible
 * with existing implementations.
 */

import { describe, it, expect } from 'vitest'
import {
  IpcResponse,
  IpcError,
  IpcErrorCode,
  IpcOperation,
  createIpcChannel,
  createSuccessResponse,
  createErrorResponse,
  BaseDto,
  BaseCreateDto,
  BaseUpdateDto,
  BaseListQuery,
  BaseListResponse
} from '../../../../src/shared/types/ipc.types'
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
  ProfileListResponseDto
} from '../../../../src/main/application/dto/ProfileDto'

describe('IPC Types', () => {
  describe('IpcResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: '1', name: 'Test Profile' }
      const response: IpcResponse<typeof data> = {
        success: true,
        data
      }

      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.error).toBeUndefined()
    })

    it('should create an error response without data', () => {
      const error: IpcError = {
        code: 'TEST_ERROR',
        message: 'This is a test error'
      }
      const response: IpcResponse = {
        success: false,
        error
      }

      expect(response.success).toBe(false)
      expect(response.data).toBeUndefined()
      expect(response.error).toEqual(error)
    })
  })

  describe('IpcErrorCode', () => {
    it('should have all expected error codes', () => {
      expect(IpcErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR')
      expect(IpcErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(IpcErrorCode.NOT_FOUND).toBe('NOT_FOUND')
      expect(IpcErrorCode.DUPLICATE_RESOURCE).toBe('DUPLICATE_RESOURCE')
    })
  })

  describe('IpcOperation', () => {
    it('should have all CRUD operations', () => {
      expect(IpcOperation.CREATE).toBe('create')
      expect(IpcOperation.GET).toBe('get')
      expect(IpcOperation.LIST).toBe('list')
      expect(IpcOperation.UPDATE).toBe('update')
      expect(IpcOperation.DELETE).toBe('delete')
      expect(IpcOperation.TOGGLE_ACTIVE).toBe('toggle-active')
      expect(IpcOperation.VALIDATE).toBe('validate')
    })
  })

  describe('createIpcChannel', () => {
    it('should create correctly formatted channel names', () => {
      expect(createIpcChannel('profile', IpcOperation.CREATE)).toBe('profile:create')
      expect(createIpcChannel('user', IpcOperation.LIST)).toBe('user:list')
      expect(createIpcChannel('PROFILE', IpcOperation.DELETE)).toBe('profile:delete')
    })
  })

  describe('Response Helpers', () => {
    describe('createSuccessResponse', () => {
      it('should create success response with data', () => {
        const data = { id: '1', name: 'Test' }
        const response = createSuccessResponse(data)

        expect(response.success).toBe(true)
        expect(response.data).toEqual(data)
        expect(response.error).toBeUndefined()
      })

      it('should create success response without data', () => {
        const response = createSuccessResponse()

        expect(response.success).toBe(true)
        expect(response.data).toBeUndefined()
        expect(response.error).toBeUndefined()
      })
    })

    describe('createErrorResponse', () => {
      it('should create error response with all fields', () => {
        const details = { field: 'name', value: 'invalid' }
        const response = createErrorResponse('VALIDATION_ERROR', 'Invalid name', details)

        expect(response.success).toBe(false)
        expect(response.data).toBeUndefined()
        expect(response.error).toEqual({
          code: 'VALIDATION_ERROR',
          message: 'Invalid name',
          details
        })
      })

      it('should create error response without details', () => {
        const response = createErrorResponse('NOT_FOUND', 'Item not found')

        expect(response.success).toBe(false)
        expect(response.error).toEqual({
          code: 'NOT_FOUND',
          message: 'Item not found'
        })
      })
    })
  })

  describe('Base Interfaces', () => {
    it('should work with BaseDto structure', () => {
      interface TestDto extends BaseDto {
        name: string
        isActive: boolean
      }

      const dto: TestDto = {
        id: '1',
        name: 'Test',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }

      expect(dto.id).toBe('1')
      expect(dto.name).toBe('Test')
      expect(dto.isActive).toBe(true)
    })

    it('should work with BaseCreateDto structure', () => {
      interface TestCreateDto extends BaseCreateDto {
        name: string
        isActive?: boolean
      }

      const dto: TestCreateDto = {
        name: 'New Test',
        isActive: true
      }

      expect(dto.name).toBe('New Test')
      expect(dto.isActive).toBe(true)
    })

    it('should work with BaseUpdateDto structure', () => {
      interface TestUpdateDto extends BaseUpdateDto {
        name?: string
        isActive?: boolean
      }

      const dto: TestUpdateDto = {
        id: '1',
        name: 'Updated Test'
      }

      expect(dto.id).toBe('1')
      expect(dto.name).toBe('Updated Test')
    })

    it('should work with BaseListQuery', () => {
      const query: BaseListQuery = {
        activeOnly: true,
        limit: 10,
        offset: 0,
        search: 'test',
        sortBy: 'name',
        sortOrder: 'asc'
      }

      expect(query.activeOnly).toBe(true)
      expect(query.limit).toBe(10)
      expect(query.sortOrder).toBe('asc')
    })

    it('should work with BaseListResponse', () => {
      const items = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' }
      ]

      const response: BaseListResponse<(typeof items)[0]> = {
        items,
        total: 10,
        count: 2,
        hasMore: true
      }

      expect(response.items).toHaveLength(2)
      expect(response.total).toBe(10)
      expect(response.hasMore).toBe(true)
    })
  })

  describe('Compatibility with existing Profile types', () => {
    it('should be compatible with ProfileResponseDto', () => {
      // This test ensures our generic types work with existing Profile DTOs
      const response: IpcResponse<ProfileResponseDto> = createSuccessResponse({
        id: '1',
        name: 'Test Profile',
        email: 'test@example.com',
        isActive: true,
        address: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          postalCode: '12345',
          country: 'US'
        },
        paymentMethod: {
          type: 'credit_card',
          cardNumber: '****-****-****-1234',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '***',
          nameOnCard: 'John Doe'
        },
        phoneNumber: '+1234567890',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      })

      expect(response.success).toBe(true)
      expect(response.data?.id).toBe('1')
      expect(response.data?.name).toBe('Test Profile')
    })

    it('should be compatible with CreateProfileDto', () => {
      // This test ensures our base create DTO works with Profile create operations
      const createDto: CreateProfileDto = {
        name: 'New Profile',
        email: 'new@example.com',
        address: {
          firstName: 'Jane',
          lastName: 'Doe',
          street: '456 Oak St',
          city: 'Another Town',
          state: 'ST',
          postalCode: '67890',
          country: 'US'
        },
        paymentMethod: {
          type: 'credit_card',
          cardNumber: '4111111111111111',
          expiryMonth: 6,
          expiryYear: 2026,
          cvv: '123',
          nameOnCard: 'Jane Doe'
        },
        phoneNumber: '+0987654321'
      }

      // Verify the DTO structure matches our expectations
      expect(createDto.name).toBe('New Profile')
      expect(createDto.email).toBe('new@example.com')
      expect(createDto.address.firstName).toBe('Jane')
    })

    it('should be compatible with UpdateProfileDto', () => {
      const updateDto: UpdateProfileDto = {
        id: '1',
        name: 'Updated Profile'
        // Other fields are optional for updates
      }

      expect(updateDto.id).toBe('1')
      expect(updateDto.name).toBe('Updated Profile')
    })

    it('should work with ProfileListResponseDto', () => {
      const listResponse: IpcResponse<ProfileListResponseDto> = createSuccessResponse({
        profiles: [
          {
            id: '1',
            name: 'Profile 1',
            email: 'profile1@example.com',
            isActive: true,
            address: {
              firstName: 'John',
              lastName: 'Doe',
              street: '123 Main St',
              city: 'Anytown',
              state: 'ST',
              postalCode: '12345',
              country: 'US'
            },
            paymentMethod: {
              type: 'credit_card',
              cardNumber: '****-****-****-1234',
              expiryMonth: 12,
              expiryYear: 2025,
              cvv: '***',
              nameOnCard: 'John Doe'
            },
            phoneNumber: '+1234567890',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1,
        activeCount: 1
      })

      expect(listResponse.success).toBe(true)
      expect(listResponse.data?.profiles).toHaveLength(1)
      expect(listResponse.data?.total).toBe(1)
    })
  })
})
