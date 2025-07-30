import { describe, it, expect, beforeEach, vi, MockedObject } from 'vitest'
import { DrizzleProfileRepository } from '../../../../src/main/infrastructure/repositories/DrizzleProfileRepository'
import { DrizzleConnection } from '../../../../src/main/infrastructure/database/DrizzleConnection'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import { ProfileId } from '../../../../src/main/domain/value-objects/ProfileId'
import { ProfileName } from '../../../../src/main/domain/value-objects/ProfileName'
import { getEncryptionService } from '../../../../src/main/infrastructure/encryption/EncryptionService'
import { PaymentMethodType } from '../../../../src/shared/types/profile.types'

// Mock dependencies
vi.mock('../../../../src/main/infrastructure/database/DrizzleConnection')
vi.mock('../../../../src/main/infrastructure/encryption/EncryptionService')

describe('DrizzleProfileRepository', () => {
  let repository: DrizzleProfileRepository
  let mockConnection: MockedObject<DrizzleConnection>
  let mockDb: MockedObject<{
    select: () => unknown
    insert: () => unknown
    update: () => unknown
    delete: () => unknown
    from: () => unknown
    where: () => unknown
    orderBy: () => unknown
    limit: () => unknown
    values: () => unknown
    set: () => unknown
    onConflictDoUpdate: () => unknown
  }>
  let mockEncryptionService: MockedObject<{
    encrypt: (data: string) => Promise<string>
    decrypt: (data: string) => Promise<string>
  }>

  const sampleProfileData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Profile',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    shippingFirstName: 'John',
    shippingLastName: 'Doe',
    shippingAddressLine1: '123 Main St',
    shippingAddressLine2: null,
    shippingCity: 'Anytown',
    shippingState: 'NY',
    shippingPostalCode: '12345',
    shippingCountry: 'US',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddressLine1: '456 Oak Ave',
    billingAddressLine2: null,
    billingCity: 'Otherville',
    billingState: 'CA',
    billingPostalCode: '67890',
    billingCountry: 'US',
    paymentMethodType: 'CREDIT_CARD',
    paymentMethodEncryptedData: 'encrypted-data',
    paymentHolderName: 'John Doe',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    lastUsedAt: null,
    purchaseCount: 0,
    isActive: true,
    dailyPurchases: '{}'
  }

  const mockProfile = Profile.fromData({
    id: { value: '550e8400-e29b-41d4-a716-446655440000' },
    name: 'Test Profile',
    email: 'test@example.com',
    phoneNumber: '1234567890',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      addressLine2: '',
      city: 'Anytown',
      state: 'NY',
      postalCode: '12345',
      country: 'US'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '456 Oak Ave',
      addressLine2: '',
      city: 'Otherville',
      state: 'CA',
      postalCode: '67890',
      country: 'US'
    },
    paymentMethod: {
      type: PaymentMethodType.CREDIT_CARD,
      lastFourDigits: '1111',
      expiryMonth: 12,
      expiryYear: 2025,
      holderName: 'John Doe',
      fullCardNumber: '4111111111111111',
      cvv: '123'
    },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    purchaseCount: 0,
    isActive: true
  })

  beforeEach(() => {
    // Setup database mock
    mockDb = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn()
    }

    // Setup connection mock
    mockConnection = {
      getClient: vi.fn().mockReturnValue(mockDb),
      getInstance: vi.fn()
    } as MockedObject<DrizzleConnection>

    // Setup encryption service mock
    mockEncryptionService = {
      encrypt: vi.fn().mockResolvedValue('encrypted-data'),
      decrypt: vi
        .fn()
        .mockResolvedValue(
          '{"lastFourDigits":"1111","expiryMonth":12,"expiryYear":2025,"fullCardNumber":"4111111111111111","cvv":"123"}'
        )
    }

    // Mock the static getInstance method
    vi.mocked(DrizzleConnection.getInstance).mockReturnValue(mockConnection)
    vi.mocked(getEncryptionService).mockReturnValue(mockEncryptionService)

    repository = new DrizzleProfileRepository()
  })

  describe('save', () => {
    it('should save a profile with encrypted payment data', async () => {
      mockDb.onConflictDoUpdate.mockResolvedValue(undefined)

      await repository.save(mockProfile)

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
        expect.stringContaining('"lastFourDigits":"1111"')
      )
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test Profile',
          email: 'test@example.com',
          paymentMethodEncryptedData: 'encrypted-data'
        })
      )
      expect(mockDb.onConflictDoUpdate).toHaveBeenCalled()
    })
  })

  describe('findById', () => {
    it('should find a profile by ID', async () => {
      mockDb.limit.mockResolvedValue([sampleProfileData])

      const result = await repository.findById(new ProfileId('test-id'))

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
      expect(result).toBeDefined()
      expect(result?.name.value).toBe('Test Profile')
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-data')
    })

    it('should return null when profile not found', async () => {
      mockDb.limit.mockResolvedValue([])

      const result = await repository.findById(new ProfileId('non-existent'))

      expect(result).toBeNull()
    })
  })

  describe('findByName', () => {
    it('should find a profile by name', async () => {
      mockDb.limit.mockResolvedValue([sampleProfileData])

      const result = await repository.findByName(new ProfileName('Test Profile'))

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
      expect(result).toBeDefined()
      expect(result?.name.value).toBe('Test Profile')
    })

    it('should return null when profile not found by name', async () => {
      mockDb.limit.mockResolvedValue([])

      const result = await repository.findByName(new ProfileName('Non-existent'))

      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should find all profiles ordered by creation date', async () => {
      mockDb.orderBy.mockResolvedValue([
        sampleProfileData,
        { ...sampleProfileData, id: '550e8400-e29b-41d4-a716-446655440001', name: 'Test Profile 2' }
      ])

      const results = await repository.findAll()

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
      expect(results).toHaveLength(2)
      expect(results[0].name.value).toBe('Test Profile')
      expect(results[1].name.value).toBe('Test Profile 2')
    })
  })

  describe('findActive', () => {
    it('should find only active profiles', async () => {
      const activeProfile = { ...sampleProfileData, isActive: true }
      mockDb.orderBy.mockResolvedValue([activeProfile])

      const results = await repository.findActive()

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.orderBy).toHaveBeenCalled()
      expect(results).toHaveLength(1)
      expect(results[0].isActive).toBe(true)
    })
  })

  describe('delete', () => {
    it('should delete a profile by ID', async () => {
      mockDb.where.mockResolvedValue(undefined)

      await repository.delete(new ProfileId('test-id'))

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
    })
  })

  describe('deleteById', () => {
    it('should return true when profile is deleted successfully', async () => {
      mockDb.where.mockResolvedValue({ changes: 1 })

      const result = await repository.deleteById(new ProfileId('test-id'))

      expect(result).toBe(true)
      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.delete).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
    })

    it('should return false when no profile is deleted', async () => {
      mockDb.where.mockResolvedValue({ changes: 0 })

      const result = await repository.deleteById(new ProfileId('non-existent'))

      expect(result).toBe(false)
    })

    it('should return false when deletion throws error', async () => {
      mockDb.where.mockRejectedValue(new Error('Database error'))

      const result = await repository.deleteById(new ProfileId('test-id'))

      expect(result).toBe(false)
    })
  })

  describe('exists', () => {
    it('should return true when profile exists', async () => {
      mockDb.limit.mockResolvedValue([{ id: 'test-id' }])

      const result = await repository.exists(new ProfileId('test-id'))

      expect(result).toBe(true)
      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return false when profile does not exist', async () => {
      mockDb.limit.mockResolvedValue([])

      const result = await repository.exists(new ProfileId('non-existent'))

      expect(result).toBe(false)
    })
  })

  describe('existsByName', () => {
    it('should return true when profile with name exists', async () => {
      mockDb.limit.mockResolvedValue([{ id: 'test-id' }])

      const result = await repository.existsByName(new ProfileName('Test Profile'))

      expect(result).toBe(true)
      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
      expect(mockDb.limit).toHaveBeenCalledWith(1)
    })

    it('should return false when profile with name does not exist', async () => {
      mockDb.limit.mockResolvedValue([])

      const result = await repository.existsByName(new ProfileName('Non-existent'))

      expect(result).toBe(false)
    })
  })

  describe('count', () => {
    it('should return total count of profiles', async () => {
      mockDb.from.mockResolvedValue([{ count: 5 }])

      const result = await repository.count()

      expect(result).toBe(5)
      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.from).toHaveBeenCalled()
    })

    it('should return 0 when no profiles exist', async () => {
      mockDb.from.mockResolvedValue([{ count: 0 }])

      const result = await repository.count()

      expect(result).toBe(0)
    })
  })

  describe('countActive', () => {
    it('should return count of active profiles', async () => {
      mockDb.where.mockResolvedValue([{ count: 3 }])

      const result = await repository.countActive()

      expect(result).toBe(3)
      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.select).toHaveBeenCalled()
      expect(mockDb.where).toHaveBeenCalled()
    })
  })

  describe('getCount', () => {
    it('should return total count when activeOnly is false', async () => {
      mockDb.from.mockResolvedValue([{ count: 5 }])

      const result = await repository.getCount(false)

      expect(result).toBe(5)
    })

    it('should return active count when activeOnly is true', async () => {
      mockDb.where.mockResolvedValue([{ count: 3 }])

      const result = await repository.getCount(true)

      expect(result).toBe(3)
    })
  })

  describe('updateLastUsed', () => {
    it('should update last used timestamp', async () => {
      const timestamp = new Date('2024-01-02T00:00:00.000Z')
      mockDb.where.mockResolvedValue(undefined)

      await repository.updateLastUsed(new ProfileId('test-id'), timestamp)

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          lastUsedAt: timestamp.toISOString()
        })
      )
      expect(mockDb.where).toHaveBeenCalled()
    })
  })

  describe('updatePurchaseCount', () => {
    it('should update purchase count', async () => {
      mockDb.where.mockResolvedValue(undefined)

      await repository.updatePurchaseCount(new ProfileId('test-id'), 5)

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseCount: 5
        })
      )
      expect(mockDb.where).toHaveBeenCalled()
    })
  })

  describe('updateActiveStatus', () => {
    it('should update active status', async () => {
      mockDb.where.mockResolvedValue(undefined)

      await repository.updateActiveStatus(new ProfileId('test-id'), false)

      expect(mockConnection.getClient).toHaveBeenCalled()
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false
        })
      )
      expect(mockDb.where).toHaveBeenCalled()
    })
  })
})
