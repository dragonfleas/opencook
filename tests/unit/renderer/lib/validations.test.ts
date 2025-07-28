import { describe, it, expect } from 'vitest'
import { createProfileSchema, updateProfileSchema } from '@/lib/validations'

describe('Profile Validation Schemas', () => {
  describe('createProfileSchema', () => {
    it('should validate a complete profile', () => {
      const validProfile = {
        name: 'Test Profile',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'CREDIT_CARD' as const,
          lastFourDigits: '1234',
          expiryMonth: 12,
          expiryYear: 2025,
          holderName: 'John Doe'
        }
      }

      const result = createProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('should validate without optional fields', () => {
      const minimalProfile = {
        name: 'Test Profile',
        email: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'PAYPAL' as const,
          holderName: 'John Doe'
        }
      }

      const result = createProfileSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidProfile = {
        name: 'Test Profile',
        email: 'invalid-email',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'CREDIT_CARD' as const,
          holderName: 'John Doe'
        }
      }

      const result = createProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject missing required fields', () => {
      const incompleteProfile = {
        name: 'Test Profile',
        email: 'test@example.com'
        // Missing shippingAddress and paymentMethod
      }

      const result = createProfileSchema.safeParse(incompleteProfile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid payment method type', () => {
      const invalidProfile = {
        name: 'Test Profile',
        email: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'INVALID_TYPE',
          holderName: 'John Doe'
        }
      }

      const result = createProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid expiry month', () => {
      const invalidProfile = {
        name: 'Test Profile',
        email: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'CREDIT_CARD' as const,
          expiryMonth: 13, // Invalid month
          expiryYear: 2025,
          holderName: 'John Doe'
        }
      }

      const result = createProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('should reject past expiry year', () => {
      const invalidProfile = {
        name: 'Test Profile',
        email: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        },
        paymentMethod: {
          type: 'CREDIT_CARD' as const,
          expiryMonth: 12,
          expiryYear: 2020, // Past year
          holderName: 'John Doe'
        }
      }

      const result = createProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('should validate update with all fields', () => {
      const updateData = {
        id: 'profile-123',
        name: 'Updated Profile',
        email: 'updated@example.com',
        phoneNumber: '+1987654321'
      }

      const result = updateProfileSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate update with only id', () => {
      const updateData = {
        id: 'profile-123'
      }

      const result = updateProfileSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should reject update without id', () => {
      const updateData = {
        name: 'Updated Profile'
      }

      const result = updateProfileSchema.safeParse(updateData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email in update', () => {
      const updateData = {
        id: 'profile-123',
        email: 'invalid-email'
      }

      const result = updateProfileSchema.safeParse(updateData)
      expect(result.success).toBe(false)
    })
  })
})
