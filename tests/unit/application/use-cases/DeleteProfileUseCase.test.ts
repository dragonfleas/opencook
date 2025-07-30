import { vi, MockedObject } from 'vitest'
import { DeleteProfileUseCase } from '../../../../src/main/application/use-cases/DeleteProfileUseCase'
import { IProfileRepository } from '../../../../src/main/domain/repositories/IProfileRepository'
import { ProfileId } from '../../../../src/main/domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../../../src/main/domain/errors/ProfileErrors'

describe('DeleteProfileUseCase', () => {
  let useCase: DeleteProfileUseCase
  let mockRepository: MockedObject<IProfileRepository>

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      findAll: vi.fn(),
      findActive: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      countActive: vi.fn(),
      existsByName: vi.fn()
    }
    useCase = new DeleteProfileUseCase(mockRepository)
  })

  describe('execute', () => {
    it('should delete profile successfully when it exists', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.exists.mockResolvedValue(true)
      mockRepository.delete.mockResolvedValue()

      await useCase.execute(profileId)

      expect(mockRepository.exists).toHaveBeenCalledWith(ProfileId.create(profileId))
      expect(mockRepository.delete).toHaveBeenCalledWith(ProfileId.create(profileId))
    })

    it('should throw ProfileNotFoundError when profile does not exist', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.exists.mockResolvedValue(false)

      await expect(useCase.execute(profileId)).rejects.toThrow(ProfileNotFoundError)
      expect(mockRepository.exists).toHaveBeenCalledWith(ProfileId.create(profileId))
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle invalid profile ID format', async () => {
      const invalidProfileId = 'invalid-uuid'

      // ProfileId.create should throw for invalid UUIDs
      await expect(useCase.execute(invalidProfileId)).rejects.toThrow()
      expect(mockRepository.exists).not.toHaveBeenCalled()
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle repository exists error', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.exists.mockRejectedValue(new Error('Database connection error'))

      await expect(useCase.execute(profileId)).rejects.toThrow('Database connection error')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle repository delete error', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.exists.mockResolvedValue(true)
      mockRepository.delete.mockRejectedValue(new Error('Delete operation failed'))

      await expect(useCase.execute(profileId)).rejects.toThrow('Delete operation failed')
      expect(mockRepository.exists).toHaveBeenCalledWith(ProfileId.create(profileId))
      expect(mockRepository.delete).toHaveBeenCalledWith(ProfileId.create(profileId))
    })

    it('should validate profile ID before checking existence', async () => {
      const emptyProfileId = ''

      await expect(useCase.execute(emptyProfileId)).rejects.toThrow()
      expect(mockRepository.exists).not.toHaveBeenCalled()
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle null profile ID', async () => {
      await expect(useCase.execute(null as string)).rejects.toThrow()
      expect(mockRepository.exists).not.toHaveBeenCalled()
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should handle undefined profile ID by generating new UUID and checking existence', async () => {
      mockRepository.exists.mockResolvedValue(false)

      await expect(useCase.execute(undefined as string)).rejects.toThrow(ProfileNotFoundError)
      expect(mockRepository.exists).toHaveBeenCalledTimes(1)
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should properly create ProfileId for exists check', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      const expectedProfileId = ProfileId.create(profileId)
      mockRepository.exists.mockResolvedValue(true)
      mockRepository.delete.mockResolvedValue()

      await useCase.execute(profileId)

      expect(mockRepository.exists).toHaveBeenCalledWith(expectedProfileId)
      expect(mockRepository.delete).toHaveBeenCalledWith(expectedProfileId)
    })

    it('should complete successfully without returning anything', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.exists.mockResolvedValue(true)
      mockRepository.delete.mockResolvedValue()

      const result = await useCase.execute(profileId)

      expect(result).toBeUndefined()
      expect(mockRepository.exists).toHaveBeenCalledTimes(1)
      expect(mockRepository.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent deletion attempts gracefully', async () => {
      const profileId = '123e4567-e89b-12d3-a456-426614174000'
      mockRepository.exists.mockResolvedValue(true)
      mockRepository.delete.mockRejectedValue(new Error('Profile already deleted'))

      await expect(useCase.execute(profileId)).rejects.toThrow('Profile already deleted')
      expect(mockRepository.exists).toHaveBeenCalledWith(ProfileId.create(profileId))
      expect(mockRepository.delete).toHaveBeenCalledWith(ProfileId.create(profileId))
    })
  })
})
