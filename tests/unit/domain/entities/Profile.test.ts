import { beforeEach, vi } from 'vitest'
import { Profile } from '../../../../src/main/domain/entities/Profile'
import {
  InvalidProfileError,
  PurchaseCooldownError,
  ProfileInactiveError
} from '../../../../src/main/domain/errors/ProfileErrors'
import { ProfileCreationData, PaymentMethodType } from '../../../../src/shared/types/profile.types'

describe('Profile', () => {
  const validProfileData: ProfileCreationData = {
    name: 'Main Profile',
    email: 'test@example.com',
    phoneNumber: '123-456-7890',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '456 Billing St',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      country: 'US'
    },
    paymentMethod: {
      type: PaymentMethodType.CREDIT_CARD,
      lastFourDigits: '1234',
      expiryMonth: 12,
      expiryYear: 2025,
      holderName: 'John Doe'
    }
  }

  let originalDateNow: typeof Date.now

  beforeEach(() => {
    originalDateNow = Date.now
    Date.now = vi.fn(() => new Date('2024-01-15T10:00:00Z').getTime())
  })

  afterEach(() => {
    Date.now = originalDateNow
  })

  describe('create', () => {
    it('should create profile with valid data', () => {
      const profile = Profile.create(validProfileData)

      expect(profile.name.value).toBe('Main Profile')
      expect(profile.email.value).toBe('test@example.com')
      expect(profile.phoneNumber?.value).toBe('123-456-7890')
      expect(profile.shippingAddress.firstName).toBe('John')
      expect(profile.billingAddress?.firstName).toBe('John')
      expect(profile.paymentMethod.type).toBe(PaymentMethodType.CREDIT_CARD)
      expect(profile.purchaseCount).toBe(0)
      expect(profile.isActive).toBe(true)
    })

    it('should create profile without optional fields', () => {
      const minimalData: ProfileCreationData = {
        name: 'Minimal Profile',
        email: 'minimal@example.com',
        shippingAddress: validProfileData.shippingAddress,
        paymentMethod: {
          type: PaymentMethodType.PAYPAL,
          holderName: 'John Doe'
        }
      }

      const profile = Profile.create(minimalData)
      expect(profile.phoneNumber).toBeUndefined()
      expect(profile.billingAddress).toBeUndefined()
    })

    it('should generate unique ID for each profile', () => {
      const profile1 = Profile.create(validProfileData)
      const profile2 = Profile.create(validProfileData)

      expect(profile1.id.value).not.toBe(profile2.id.value)
    })
  })

  describe('anti-scalping features', () => {
    describe('canMakePurchase', () => {
      it('should allow purchase for new active profile', () => {
        const profile = Profile.create(validProfileData)
        expect(() => profile.canMakePurchase()).not.toThrow()
      })

      it('should throw error for inactive profile', () => {
        const profile = Profile.create(validProfileData)
        profile.deactivate()

        expect(() => profile.canMakePurchase()).toThrow(ProfileInactiveError)
      })

      it('should enforce cooldown period between purchases', () => {
        const profile = Profile.create(validProfileData)

        // First purchase should work
        profile.recordPurchase()

        // Second purchase within cooldown should fail
        expect(() => profile.canMakePurchase()).toThrow(PurchaseCooldownError)
      })

      it('should allow purchase after cooldown period', () => {
        const profile = Profile.create(validProfileData)
        profile.recordPurchase()

        // Advance time by 6 minutes (cooldown is 5 minutes)
        Date.now = vi.fn(() => new Date('2024-01-15T10:06:00Z').getTime())

        expect(() => profile.canMakePurchase()).not.toThrow()
      })

      it('should enforce daily purchase limit', () => {
        const profile = Profile.create(validProfileData)

        // Make purchases with time advancement to avoid cooldown
        const times = ['2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', '2024-01-15T12:00:00Z']

        times.forEach((time) => {
          Date.now = vi.fn(() => new Date(time).getTime())
          profile.recordPurchase()
        })

        // 4th purchase should fail due to daily limit
        Date.now = vi.fn(() => new Date('2024-01-15T13:00:00Z').getTime())
        expect(() => profile.canMakePurchase()).toThrow(InvalidProfileError)
        expect(() => profile.canMakePurchase()).toThrow(/Daily purchase limit/)
      })
    })

    describe('recordPurchase', () => {
      it('should increment purchase count', () => {
        const profile = Profile.create(validProfileData)
        expect(profile.purchaseCount).toBe(0)

        profile.recordPurchase()
        expect(profile.purchaseCount).toBe(1)
      })

      it('should update last used timestamp', () => {
        const profile = Profile.create(validProfileData)
        expect(profile.lastUsedAt).toBeUndefined()

        profile.recordPurchase()
        expect(profile.lastUsedAt).toEqual(new Date('2024-01-15T10:00:00Z'))
      })

      it('should clean up old daily purchase records', () => {
        const profile = Profile.create(validProfileData)

        // Make purchase on day 1
        profile.recordPurchase()

        // Advance time by 8 days and make another purchase
        Date.now = vi.fn(() => new Date('2024-01-23T10:00:00Z').getTime())
        profile.recordPurchase()

        // Should be able to make more purchases since old records were cleaned
        Date.now = vi.fn(() => new Date('2024-01-23T11:00:00Z').getTime())
        profile.recordPurchase()

        Date.now = vi.fn(() => new Date('2024-01-23T12:00:00Z').getTime())
        expect(() => profile.recordPurchase()).not.toThrow()
      })
    })

    describe('isSuspicious', () => {
      it('should return false for normal purchase count', () => {
        const profile = Profile.create(validProfileData)
        expect(profile.isSuspicious).toBe(false)
      })

      it('should return true for high purchase count', () => {
        const profile = Profile.create(validProfileData)

        // Simulate 15 purchases over multiple days to avoid daily limits
        for (let i = 0; i < 15; i++) {
          const day = 15 + Math.floor(i / 3)
          const hour = 10 + (i % 3)
          Date.now = vi.fn(() => new Date(`2024-01-${day}T${hour}:00:00Z`).getTime())
          profile.recordPurchase()
        }

        expect(profile.isSuspicious).toBe(true)
      })
    })

    describe('cooldownRemaining', () => {
      it('should return 0 for profile that never made purchase', () => {
        const profile = Profile.create(validProfileData)
        expect(profile.cooldownRemaining).toBe(0)
      })

      it('should return correct remaining time', () => {
        const profile = Profile.create(validProfileData)
        profile.recordPurchase()

        // Advance time by 2 minutes
        Date.now = vi.fn(() => new Date('2024-01-15T10:02:00Z').getTime())

        expect(profile.cooldownRemaining).toBe(180) // 3 minutes remaining
      })

      it('should return 0 after cooldown expires', () => {
        const profile = Profile.create(validProfileData)
        profile.recordPurchase()

        Date.now = vi.fn(() => new Date('2024-01-15T10:06:00Z').getTime())

        expect(profile.cooldownRemaining).toBe(0)
      })

      it('should handle edge cases correctly', () => {
        const profile = Profile.create(validProfileData)
        profile.recordPurchase()

        // Test exactly at cooldown boundary
        Date.now = vi.fn(() => new Date('2024-01-15T10:05:00Z').getTime())

        expect(profile.cooldownRemaining).toBe(0)
      })
    })
  })

  describe('update methods', () => {
    it('should update name', () => {
      const profile = Profile.create(validProfileData)
      profile.updateName('Updated Profile')

      expect(profile.name.value).toBe('Updated Profile')
    })

    it('should update email', () => {
      const profile = Profile.create(validProfileData)
      profile.updateEmail('updated@example.com')

      expect(profile.email.value).toBe('updated@example.com')
    })

    it('should update phone number', () => {
      const profile = Profile.create(validProfileData)
      profile.updatePhoneNumber('987-654-3210')

      expect(profile.phoneNumber?.value).toBe('987-654-3210')
    })

    it('should clear phone number when updating with undefined', () => {
      const profile = Profile.create(validProfileData)
      profile.updatePhoneNumber(undefined)

      expect(profile.phoneNumber).toBeUndefined()
    })

    it('should update timestamps when making changes', () => {
      const profile = Profile.create(validProfileData)
      const originalUpdatedAt = profile.updatedAt

      // Advance time slightly
      Date.now = vi.fn(() => new Date('2024-01-15T10:01:00Z').getTime())

      profile.updateName('New Name')
      expect(profile.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })
  })

  describe('activate/deactivate', () => {
    it('should activate inactive profile', () => {
      const profile = Profile.create(validProfileData)
      profile.deactivate()
      expect(profile.isActive).toBe(false)

      profile.activate()
      expect(profile.isActive).toBe(true)
    })

    it('should deactivate active profile', () => {
      const profile = Profile.create(validProfileData)
      expect(profile.isActive).toBe(true)

      profile.deactivate()
      expect(profile.isActive).toBe(false)
    })
  })

  describe('effectiveBillingAddress', () => {
    it('should return billing address when present', () => {
      const profile = Profile.create(validProfileData)
      expect(profile.effectiveBillingAddress.addressLine1).toBe('456 Billing St')
    })

    it('should return shipping address when billing address not present', () => {
      const dataWithoutBilling = { ...validProfileData, billingAddress: undefined }
      const profile = Profile.create(dataWithoutBilling)
      expect(profile.effectiveBillingAddress.addressLine1).toBe('123 Main St')
    })
  })

  describe('toData', () => {
    it('should return complete profile data', () => {
      const profile = Profile.create(validProfileData)
      const data = profile.toData()

      expect(data.name).toBe('Main Profile')
      expect(data.email).toBe('test@example.com')
      expect(data.phoneNumber).toBe('123-456-7890')
      expect(data.shippingAddress.firstName).toBe('John')
      expect(data.billingAddress?.firstName).toBe('John')
      expect(data.paymentMethod.type).toBe(PaymentMethodType.CREDIT_CARD)
      expect(data.purchaseCount).toBe(0)
      expect(data.isActive).toBe(true)
      expect(data.id.value).toBeDefined()
      expect(data.createdAt).toBeDefined()
      expect(data.updatedAt).toBeDefined()
    })
  })

  describe('fromData', () => {
    it('should recreate profile from data', () => {
      const originalProfile = Profile.create(validProfileData)
      const data = originalProfile.toData()

      const recreatedProfile = Profile.fromData(data)

      expect(recreatedProfile.id.value).toBe(originalProfile.id.value)
      expect(recreatedProfile.name.value).toBe(originalProfile.name.value)
      expect(recreatedProfile.email.value).toBe(originalProfile.email.value)
      expect(recreatedProfile.purchaseCount).toBe(originalProfile.purchaseCount)
      expect(recreatedProfile.isActive).toBe(originalProfile.isActive)
    })
  })
})
