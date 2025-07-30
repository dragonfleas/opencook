import { ProfileName } from '../../../../src/main/domain/value-objects/ProfileName'
import { InvalidProfileError } from '../../../../src/main/domain/errors/ProfileErrors'

describe('ProfileName', () => {
  describe('create', () => {
    it('should create profile name with valid string', () => {
      const name = ProfileName.create('Main Profile')
      expect(name.value).toBe('Main Profile')
    })

    it('should trim whitespace', () => {
      const name = ProfileName.create('  Gaming Profile  ')
      expect(name.value).toBe('Gaming Profile')
    })

    it('should throw error for empty name', () => {
      expect(() => ProfileName.create('')).toThrow(InvalidProfileError)
      expect(() => ProfileName.create('   ')).toThrow(InvalidProfileError)
    })

    it('should throw error for name too short', () => {
      expect(() => ProfileName.create('AB')).toThrow(InvalidProfileError)
    })

    it('should throw error for name too long', () => {
      const longName = 'A'.repeat(51)
      expect(() => ProfileName.create(longName)).toThrow(InvalidProfileError)
    })

    it('should accept names at length boundaries', () => {
      const minLength = 'ABC'
      const maxLength = 'A'.repeat(50)

      expect(() => ProfileName.create(minLength)).not.toThrow()
      expect(() => ProfileName.create(maxLength)).not.toThrow()
    })

    it('should accept valid characters', () => {
      const validNames = [
        'Main Profile',
        'Gaming-Setup',
        'Profile_1',
        'Work Account 2024',
        'Test123',
        'Profile-Name_With-All_Valid123'
      ]

      validNames.forEach((name) => {
        expect(() => ProfileName.create(name)).not.toThrow()
      })
    })

    it('should throw error for invalid characters', () => {
      const invalidNames = [
        'Profile@Work',
        'Profile#1',
        'Profile$',
        'Profile%',
        'Profile&Co',
        'Profile*',
        'Profile+',
        'Profile=',
        'Profile!',
        'Profile?',
        'Profile/',
        'Profile\\',
        'Profile|'
      ]

      invalidNames.forEach((name) => {
        expect(() => ProfileName.create(name)).toThrow(InvalidProfileError)
      })
    })

    it('should allow numbers and mixed case', () => {
      const validNames = ['Profile123', 'UPPERCASE', 'lowercase', 'MixedCase', '123Numbers']

      validNames.forEach((name) => {
        expect(() => ProfileName.create(name)).not.toThrow()
      })
    })
  })

  describe('equals', () => {
    it('should return true for identical names', () => {
      const name1 = ProfileName.create('Main Profile')
      const name2 = ProfileName.create('Main Profile')
      expect(name1.equals(name2)).toBe(true)
    })

    it('should return false for different names', () => {
      const name1 = ProfileName.create('Main Profile')
      const name2 = ProfileName.create('Gaming Profile')
      expect(name1.equals(name2)).toBe(false)
    })

    it('should be case sensitive', () => {
      const name1 = ProfileName.create('Profile')
      const name2 = ProfileName.create('profile')
      expect(name1.equals(name2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return profile name value as string', () => {
      const name = ProfileName.create('Main Profile')
      expect(name.toString()).toBe('Main Profile')
    })
  })
})
