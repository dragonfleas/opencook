import { ProfileId } from '../../../../src/main/domain/value-objects/ProfileId'
import { InvalidProfileError } from '../../../../src/main/domain/errors/ProfileErrors'

describe('ProfileId', () => {
  describe('create', () => {
    it('should generate new UUID when no ID provided', () => {
      const profileId = ProfileId.create()
      expect(profileId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('should generate unique IDs', () => {
      const id1 = ProfileId.create()
      const id2 = ProfileId.create()
      expect(id1.value).not.toBe(id2.value)
    })

    it('should accept valid UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      const profileId = ProfileId.create(validUuid)
      expect(profileId.value).toBe(validUuid.toLowerCase())
    })

    it('should normalize UUID to lowercase', () => {
      const upperUuid = '123E4567-E89B-12D3-A456-426614174000'
      const profileId = ProfileId.create(upperUuid)
      expect(profileId.value).toBe(upperUuid.toLowerCase())
    })

    it('should throw error for invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-42661417400g',
        '123e4567e89b12d3a456426614174000'
      ]

      invalidUuids.forEach((invalidUuid) => {
        expect(() => ProfileId.create(invalidUuid)).toThrow(InvalidProfileError)
      })
    })

    it('should throw error for empty UUID', () => {
      expect(() => ProfileId.create('')).toThrow(InvalidProfileError)
    })

    it('should accept various valid UUID formats', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      ]

      validUuids.forEach((uuid) => {
        expect(() => ProfileId.create(uuid)).not.toThrow()
      })
    })
  })

  describe('equals', () => {
    it('should return true for identical IDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const id1 = ProfileId.create(uuid)
      const id2 = ProfileId.create(uuid)
      expect(id1.equals(id2)).toBe(true)
    })

    it('should return true for same UUID with different cases', () => {
      const lowerUuid = '123e4567-e89b-12d3-a456-426614174000'
      const upperUuid = '123E4567-E89B-12D3-A456-426614174000'
      const id1 = ProfileId.create(lowerUuid)
      const id2 = ProfileId.create(upperUuid)
      expect(id1.equals(id2)).toBe(true)
    })

    it('should return false for different IDs', () => {
      const uuid1 = '123e4567-e89b-12d3-a456-426614174000'
      const uuid2 = '123e4567-e89b-12d3-a456-426614174001'
      const id1 = ProfileId.create(uuid1)
      const id2 = ProfileId.create(uuid2)
      expect(id1.equals(id2)).toBe(false)
    })

    it('should return false for generated vs specific ID', () => {
      const specificId = ProfileId.create('123e4567-e89b-12d3-a456-426614174000')
      const generatedId = ProfileId.create()
      expect(specificId.equals(generatedId)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return UUID value as string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const profileId = ProfileId.create(uuid)
      expect(profileId.toString()).toBe(uuid)
    })
  })

  describe('value getter', () => {
    it('should return the UUID value', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000'
      const profileId = ProfileId.create(uuid)
      expect(profileId.value).toBe(uuid)
    })
  })
})
