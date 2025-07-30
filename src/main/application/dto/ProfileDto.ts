import {
  ProfileCreationData,
  ProfileData,
  PaymentMethodType
} from '../../../shared/types/profile.types'

// Input DTOs
export interface CreateProfileDto {
  name: string
  email: string
  phoneNumber?: string
  shippingAddress: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentMethod: {
    type: string
    lastFourDigits?: string
    expiryMonth?: number
    expiryYear?: number
    holderName: string
  }
}

export interface UpdateProfileDto {
  id: string
  name?: string
  email?: string
  phoneNumber?: string
  shippingAddress?: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentMethod?: {
    type: string
    lastFourDigits?: string
    expiryMonth?: number
    expiryYear?: number
    holderName: string
  }
}

// Output DTOs
export interface ProfileResponseDto {
  id: string
  name: string
  email: string
  phoneNumber?: string
  shippingAddress: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  paymentMethod: {
    type: string
    maskedDisplay: string
    holderName: string
    isExpired: boolean
  }
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
  purchaseCount: number
  isActive: boolean
  isSuspicious: boolean
  cooldownRemaining: number
}

export interface ProfileListQuery {
  activeOnly?: boolean
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProfileListDto {
  profiles: ProfileSummaryDto[]
  total: number
  activeCount: number
}

export interface ProfileListResponseDto {
  profiles: ProfileSummaryDto[]
  total: number
  activeCount: number
}

export interface ProfileSummaryDto {
  id: string
  name: string
  email: string
  isActive: boolean
  purchaseCount: number
  lastUsedAt?: string
  createdAt: string
}

// Mapper functions
export class ProfileDtoMapper {
  static toCreationData(dto: CreateProfileDto): ProfileCreationData {
    return {
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      shippingAddress: dto.shippingAddress,
      billingAddress: dto.billingAddress,
      paymentMethod: {
        ...dto.paymentMethod,
        type: dto.paymentMethod.type as PaymentMethodType
      }
    }
  }

  static toResponseDto(profileData: ProfileData): ProfileResponseDto {
    return {
      id: profileData.id.value,
      name: profileData.name,
      email: profileData.email,
      phoneNumber: profileData.phoneNumber,
      shippingAddress: profileData.shippingAddress,
      billingAddress: profileData.billingAddress,
      paymentMethod: {
        type: profileData.paymentMethod.type,
        maskedDisplay: '', // Will be set by Profile entity
        holderName: profileData.paymentMethod.holderName,
        isExpired: false // Will be set by Profile entity
      },
      createdAt: profileData.createdAt.toISOString(),
      updatedAt: profileData.updatedAt.toISOString(),
      lastUsedAt: profileData.lastUsedAt?.toISOString(),
      purchaseCount: profileData.purchaseCount,
      isActive: profileData.isActive,
      isSuspicious: false, // Will be set by Profile entity
      cooldownRemaining: 0 // Will be calculated by Profile entity
    }
  }

  static toSummaryDto(profileData: ProfileData): ProfileSummaryDto {
    return {
      id: profileData.id.value,
      name: profileData.name,
      email: profileData.email,
      isActive: profileData.isActive,
      purchaseCount: profileData.purchaseCount,
      lastUsedAt: profileData.lastUsedAt?.toISOString(),
      createdAt: profileData.createdAt.toISOString()
    }
  }
}
