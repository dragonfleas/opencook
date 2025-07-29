import { z } from 'zod'

const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required')
})

const paymentMethodSchema = z.object({
  type: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY'], {
    message: 'Payment method type is required'
  }),
  cardNumber: z.string().optional(),
  expiryMonth: z.number().min(1).max(12),
  expiryYear: z.number().min(new Date().getFullYear()),
  cvv: z.string().optional(),
  holderName: z.string().min(1, 'Cardholder name is required')
})

export const createProfileSchema = z
  .object({
    name: z.string().min(1, 'Profile name is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().optional(),
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    useSameAddress: z.boolean(),
    paymentMethod: paymentMethodSchema
  })
  .refine(
    (data) => {
      // If using same address, billing address is not required
      if (data.useSameAddress) {
        return true
      }
      // Otherwise, validate billing address fields
      return (
        data.billingAddress.firstName.length > 0 &&
        data.billingAddress.lastName.length > 0 &&
        data.billingAddress.addressLine1.length > 0 &&
        data.billingAddress.city.length > 0 &&
        data.billingAddress.state.length > 0 &&
        data.billingAddress.postalCode.length > 0 &&
        data.billingAddress.country.length > 0
      )
    },
    {
      message: 'Billing address is required when not using same address',
      path: ['billingAddress']
    }
  )

export const updateProfileSchema = z.object({
  id: z.string().min(1, 'Profile ID is required'),
  name: z.string().min(1, 'Profile name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().optional(),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
  useSameAddress: z.boolean().optional(),
  paymentMethod: paymentMethodSchema.optional()
})

export type CreateProfileFormData = z.infer<typeof createProfileSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
