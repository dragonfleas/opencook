export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY'
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
    lastFourDigits?: string
    expiryMonth?: number
    expiryYear?: number
  }
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
  purchaseCount: number
  isActive: boolean
  isSuspicious: boolean
  cooldownRemaining: number
}

export interface ProfileValidationResult {
  isValid: boolean
  profileId: string
  profileName: string
  canPurchase: boolean
  cooldownRemaining: number
  errors: string[]
  warnings: string[]
}

export interface CreateProfileDto {
  name: string
  email: string
  phoneNumber?: string
  useSameAddress: boolean
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

export interface ProfileListResponseDto {
  profiles: ProfileSummaryDto[]
  total: number
  activeCount: number
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}
