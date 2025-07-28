import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { Profile } from '../../domain/entities/Profile'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileName } from '../../domain/value-objects/ProfileName'
import { DatabaseConnection } from '../database/DatabaseConnection'
import { getEncryptionService } from '../encryption/EncryptionService'
import {
  ProfileData,
  PaymentMethodData,
  AddressData,
  PaymentMethodType
} from '../../../shared/types/profile.types'

interface ProfileRow {
  id: string
  name: string
  email: string
  phone_number: string | null

  // Shipping address
  shipping_first_name: string
  shipping_last_name: string
  shipping_address_line1: string
  shipping_address_line2: string | null
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string

  // Billing address
  billing_first_name: string | null
  billing_last_name: string | null
  billing_address_line1: string | null
  billing_address_line2: string | null
  billing_city: string | null
  billing_state: string | null
  billing_postal_code: string | null
  billing_country: string | null

  // Payment method
  payment_method_type: string
  payment_method_encrypted_data: string
  payment_holder_name: string

  // Metadata
  created_at: string
  updated_at: string
  last_used_at: string | null
  purchase_count: number
  is_active: number // SQLite boolean as integer
  daily_purchases: string // JSON string
}

export class SqliteProfileRepository implements IProfileRepository {
  private readonly dbConnection: DatabaseConnection
  private readonly encryptionService = getEncryptionService()

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance()
  }

  async save(profile: Profile): Promise<void> {
    const db = this.dbConnection.getDatabase()
    const profileData = profile.toData()

    // Check if profile exists
    const existingProfile = await db.get('SELECT id FROM profiles WHERE id = ?', [
      profileData.id.value
    ])

    if (existingProfile) {
      await this.updateProfile(profileData)
    } else {
      await this.insertProfile(profileData)
    }
  }

  private async insertProfile(profileData: ProfileData): Promise<void> {
    const db = this.dbConnection.getDatabase()
    const encryptedPaymentData = this.encryptPaymentMethod(profileData.paymentMethod)

    const query = `
      INSERT INTO profiles (
        id, name, email, phone_number,
        shipping_first_name, shipping_last_name, shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_postal_code, shipping_country,
        billing_first_name, billing_last_name, billing_address_line1, billing_address_line2,
        billing_city, billing_state, billing_postal_code, billing_country,
        payment_method_type, payment_method_encrypted_data, payment_holder_name,
        created_at, updated_at, last_used_at, purchase_count, is_active, daily_purchases
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      profileData.id.value,
      profileData.name,
      profileData.email,
      profileData.phoneNumber || null,

      // Shipping address
      profileData.shippingAddress.firstName,
      profileData.shippingAddress.lastName,
      profileData.shippingAddress.addressLine1,
      profileData.shippingAddress.addressLine2 || null,
      profileData.shippingAddress.city,
      profileData.shippingAddress.state,
      profileData.shippingAddress.postalCode,
      profileData.shippingAddress.country,

      // Billing address
      profileData.billingAddress?.firstName || null,
      profileData.billingAddress?.lastName || null,
      profileData.billingAddress?.addressLine1 || null,
      profileData.billingAddress?.addressLine2 || null,
      profileData.billingAddress?.city || null,
      profileData.billingAddress?.state || null,
      profileData.billingAddress?.postalCode || null,
      profileData.billingAddress?.country || null,

      // Payment method
      profileData.paymentMethod.type,
      encryptedPaymentData,
      profileData.paymentMethod.holderName,

      // Metadata
      profileData.createdAt.toISOString(),
      profileData.updatedAt.toISOString(),
      profileData.lastUsedAt?.toISOString() || null,
      profileData.purchaseCount,
      profileData.isActive ? 1 : 0,
      '{}' // Initial empty daily purchases
    ]

    await db.run(query, params)
  }

  private async updateProfile(profileData: ProfileData): Promise<void> {
    const db = this.dbConnection.getDatabase()
    const encryptedPaymentData = this.encryptPaymentMethod(profileData.paymentMethod)

    const query = `
      UPDATE profiles SET
        name = ?, email = ?, phone_number = ?,
        shipping_first_name = ?, shipping_last_name = ?, shipping_address_line1 = ?, shipping_address_line2 = ?,
        shipping_city = ?, shipping_state = ?, shipping_postal_code = ?, shipping_country = ?,
        billing_first_name = ?, billing_last_name = ?, billing_address_line1 = ?, billing_address_line2 = ?,
        billing_city = ?, billing_state = ?, billing_postal_code = ?, billing_country = ?,
        payment_method_type = ?, payment_method_encrypted_data = ?, payment_holder_name = ?,
        last_used_at = ?, purchase_count = ?, is_active = ?, daily_purchases = ?
      WHERE id = ?
    `

    const params = [
      profileData.name,
      profileData.email,
      profileData.phoneNumber || null,

      // Shipping address
      profileData.shippingAddress.firstName,
      profileData.shippingAddress.lastName,
      profileData.shippingAddress.addressLine1,
      profileData.shippingAddress.addressLine2 || null,
      profileData.shippingAddress.city,
      profileData.shippingAddress.state,
      profileData.shippingAddress.postalCode,
      profileData.shippingAddress.country,

      // Billing address
      profileData.billingAddress?.firstName || null,
      profileData.billingAddress?.lastName || null,
      profileData.billingAddress?.addressLine1 || null,
      profileData.billingAddress?.addressLine2 || null,
      profileData.billingAddress?.city || null,
      profileData.billingAddress?.state || null,
      profileData.billingAddress?.postalCode || null,
      profileData.billingAddress?.country || null,

      // Payment method
      profileData.paymentMethod.type,
      encryptedPaymentData,
      profileData.paymentMethod.holderName,

      // Metadata
      profileData.lastUsedAt?.toISOString() || null,
      profileData.purchaseCount,
      profileData.isActive ? 1 : 0,
      '{}', // Reset daily purchases for now

      profileData.id.value
    ]

    await db.run(query, params)
  }

  async findById(id: ProfileId): Promise<Profile | null> {
    const db = this.dbConnection.getDatabase()
    const row = await db.get<ProfileRow>('SELECT * FROM profiles WHERE id = ?', [id.value])

    return row ? this.mapRowToProfile(row) : null
  }

  async findByName(name: ProfileName): Promise<Profile | null> {
    const db = this.dbConnection.getDatabase()
    const row = await db.get<ProfileRow>('SELECT * FROM profiles WHERE LOWER(name) = LOWER(?)', [
      name.value
    ])

    return row ? this.mapRowToProfile(row) : null
  }

  async findAll(): Promise<Profile[]> {
    const db = this.dbConnection.getDatabase()
    const rows = await db.all<ProfileRow[]>('SELECT * FROM profiles ORDER BY created_at DESC')

    return rows.map((row) => this.mapRowToProfile(row))
  }

  async findActive(): Promise<Profile[]> {
    const db = this.dbConnection.getDatabase()
    const rows = await db.all<ProfileRow[]>(
      'SELECT * FROM profiles WHERE is_active = 1 ORDER BY created_at DESC'
    )

    return rows.map((row) => this.mapRowToProfile(row))
  }

  async exists(id: ProfileId): Promise<boolean> {
    const db = this.dbConnection.getDatabase()
    const result = await db.get('SELECT 1 FROM profiles WHERE id = ?', [id.value])

    return !!result
  }

  async existsByName(name: ProfileName): Promise<boolean> {
    const db = this.dbConnection.getDatabase()
    const result = await db.get('SELECT 1 FROM profiles WHERE LOWER(name) = LOWER(?)', [name.value])

    return !!result
  }

  async delete(id: ProfileId): Promise<void> {
    const db = this.dbConnection.getDatabase()
    await db.run('DELETE FROM profiles WHERE id = ?', [id.value])
  }

  async count(): Promise<number> {
    const db = this.dbConnection.getDatabase()
    const result = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM profiles')
    return result?.count || 0
  }

  async countActive(): Promise<number> {
    const db = this.dbConnection.getDatabase()
    const result = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM profiles WHERE is_active = 1'
    )
    return result?.count || 0
  }

  private encryptPaymentMethod(paymentMethod: PaymentMethodData): string {
    const sensitiveData = {
      lastFourDigits: paymentMethod.lastFourDigits,
      expiryMonth: paymentMethod.expiryMonth,
      expiryYear: paymentMethod.expiryYear
    }

    return this.encryptionService.encrypt(JSON.stringify(sensitiveData))
  }

  private decryptPaymentMethod(encryptedData: string): Partial<PaymentMethodData> {
    try {
      const decryptedText = this.encryptionService.decrypt(encryptedData)
      return JSON.parse(decryptedText)
    } catch (error) {
      throw new Error(
        `Failed to decrypt payment method data: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private mapRowToProfile(row: ProfileRow): Profile {
    const decryptedPaymentData = this.decryptPaymentMethod(row.payment_method_encrypted_data)

    const shippingAddress: AddressData = {
      firstName: row.shipping_first_name,
      lastName: row.shipping_last_name,
      addressLine1: row.shipping_address_line1,
      addressLine2: row.shipping_address_line2 || undefined,
      city: row.shipping_city,
      state: row.shipping_state,
      postalCode: row.shipping_postal_code,
      country: row.shipping_country
    }

    const billingAddress: AddressData | undefined = row.billing_first_name
      ? {
          firstName: row.billing_first_name,
          lastName: row.billing_last_name!,
          addressLine1: row.billing_address_line1!,
          addressLine2: row.billing_address_line2 || undefined,
          city: row.billing_city!,
          state: row.billing_state!,
          postalCode: row.billing_postal_code!,
          country: row.billing_country!
        }
      : undefined

    const paymentMethod: PaymentMethodData = {
      type: row.payment_method_type as PaymentMethodType,
      lastFourDigits: decryptedPaymentData.lastFourDigits,
      expiryMonth: decryptedPaymentData.expiryMonth,
      expiryYear: decryptedPaymentData.expiryYear,
      holderName: row.payment_holder_name
    }

    const profileData: ProfileData = {
      id: { value: row.id },
      name: row.name,
      email: row.email,
      phoneNumber: row.phone_number || undefined,
      shippingAddress,
      billingAddress,
      paymentMethod,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
      purchaseCount: row.purchase_count,
      isActive: row.is_active === 1
    }

    return Profile.fromData(profileData)
  }
}
