import { useState } from 'react'
import { CreateProfileFormData } from '@/lib/validations/profile'
import { ProfileAPI } from '@/lib/api'
import type { CreateProfileDto, ProfileResponseDto } from '@/types/profile'

/**
 * Custom hook for handling profile creation with form data mapping and API calls.
 * Encapsulates the business logic and state management for profile creation.
 */
export function useCreateProfile(): {
  createProfile: (
    data: CreateProfileFormData
  ) => Promise<{ success: boolean; data?: ProfileResponseDto; error?: string }>
  isCreating: boolean
} {
  const [isCreating, setIsCreating] = useState(false)

  const mapFormDataToDto = (data: CreateProfileFormData): CreateProfileDto => {
    return {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      useSameAddress: data.useSameAddress,
      shippingAddress: data.shippingAddress,
      billingAddress: data.useSameAddress ? undefined : data.billingAddress,
      paymentMethod: {
        type: data.paymentMethod.type,
        // Extract last 4 digits from full card number
        lastFourDigits: data.paymentMethod.cardNumber?.slice(-4),
        expiryMonth: data.paymentMethod.expiryMonth,
        expiryYear: data.paymentMethod.expiryYear,
        holderName: data.paymentMethod.holderName,
        // Include full card data for retail bot automation (will be encrypted)
        fullCardNumber: data.paymentMethod.cardNumber,
        cvv: data.paymentMethod.cvv
      }
    }
  }

  const createProfile = async (
    data: CreateProfileFormData
  ): Promise<{ success: boolean; data?: ProfileResponseDto; error?: string }> => {
    setIsCreating(true)
    try {
      const dto = mapFormDataToDto(data)
      const response = await ProfileAPI.create(dto)

      if (response.success) {
        console.log('Profile created successfully:', response.data)
        return { success: true, data: response.data }
      } else {
        console.error('Failed to create profile:', response.error)
        return { success: false, error: response.error?.message || 'Unknown error' }
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      setIsCreating(false)
    }
  }

  return {
    createProfile,
    isCreating
  }
}
