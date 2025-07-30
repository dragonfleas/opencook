export interface ProfileId {
  value: string
}

export interface ProfileData {
  id: ProfileId
  name: string
  email: string
  phoneNumber?: string
  shippingAddress: AddressData
  billingAddress?: AddressData
  paymentMethod: PaymentMethodData
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
  purchaseCount: number
  isActive: boolean
}

export interface AddressData {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface PaymentMethodData {
  type: PaymentMethodType
  lastFourDigits?: string
  expiryMonth?: number
  expiryYear?: number
  holderName: string
  // Retail bot fields - stored encrypted for automated checkout
  fullCardNumber?: string // Encrypted, only for bot automation
  cvv?: string // Encrypted, only for bot automation
}

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY'
}

export interface ProfileCreationData {
  name: string
  email: string
  phoneNumber?: string
  shippingAddress: AddressData
  billingAddress?: AddressData
  paymentMethod: PaymentMethodData
}
