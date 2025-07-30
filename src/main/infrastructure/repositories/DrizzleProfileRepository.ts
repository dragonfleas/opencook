import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { Profile } from '../../domain/entities/Profile'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileName } from '../../domain/value-objects/ProfileName'
import { DrizzleConnection } from '../database/DrizzleConnection'
import { getEncryptionService } from '../encryption/EncryptionService'
import {
  ProfileData,
  PaymentMethodData,
  AddressData,
  PaymentMethodType
} from '../../../shared/types/profile.types'
import { profiles } from '../database/schema'
import { eq, desc, count } from 'drizzle-orm'

/**
 * Drizzle-based implementation of the profile repository.
 * Handles CRUD operations for profiles using Drizzle ORM.
 * Direct replacement for PrismaProfileRepository with identical interface.
 */
export class DrizzleProfileRepository implements IProfileRepository {
  private readonly drizzleConnection: DrizzleConnection
  private readonly encryptionService = getEncryptionService()

  constructor() {
    this.drizzleConnection = DrizzleConnection.getInstance()
  }

  /**
   * Saves a profile to the database.
   * @param profile - The profile entity to save
   * @throws {Error} If save operation fails
   */
  async save(profile: Profile): Promise<void> {
    const db = this.drizzleConnection.getClient()
    const profileData = profile.toData()

    // Encrypt payment method data
    const encryptedPaymentData = await this.encryptionService.encrypt(
      JSON.stringify({
        lastFourDigits: profileData.paymentMethod.lastFourDigits,
        expiryMonth: profileData.paymentMethod.expiryMonth,
        expiryYear: profileData.paymentMethod.expiryYear,
        fullCardNumber: profileData.paymentMethod.fullCardNumber,
        cvv: profileData.paymentMethod.cvv
      })
    )

    const data = {
      id: profileData.id.value,
      name: profileData.name,
      email: profileData.email,
      phoneNumber: profileData.phoneNumber || null,

      // Shipping address
      shippingFirstName: profileData.shippingAddress.firstName,
      shippingLastName: profileData.shippingAddress.lastName,
      shippingAddressLine1: profileData.shippingAddress.addressLine1,
      shippingAddressLine2: profileData.shippingAddress.addressLine2 || null,
      shippingCity: profileData.shippingAddress.city,
      shippingState: profileData.shippingAddress.state,
      shippingPostalCode: profileData.shippingAddress.postalCode,
      shippingCountry: profileData.shippingAddress.country,

      // Billing address
      billingFirstName: profileData.billingAddress?.firstName || null,
      billingLastName: profileData.billingAddress?.lastName || null,
      billingAddressLine1: profileData.billingAddress?.addressLine1 || null,
      billingAddressLine2: profileData.billingAddress?.addressLine2 || null,
      billingCity: profileData.billingAddress?.city || null,
      billingState: profileData.billingAddress?.state || null,
      billingPostalCode: profileData.billingAddress?.postalCode || null,
      billingCountry: profileData.billingAddress?.country || null,

      // Payment method
      paymentMethodType: profileData.paymentMethod.type,
      paymentMethodEncryptedData: encryptedPaymentData,
      paymentHolderName: profileData.paymentMethod.holderName,

      // Metadata
      lastUsedAt: profileData.lastUsedAt?.toISOString() || null,
      purchaseCount: profileData.purchaseCount,
      isActive: profileData.isActive,
      // dailyPurchases is handled by entity internally
      updatedAt: new Date().toISOString()
    }

    // Use INSERT with ON CONFLICT DO UPDATE (upsert)
    await db
      .insert(profiles)
      .values(data)
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          shippingFirstName: data.shippingFirstName,
          shippingLastName: data.shippingLastName,
          shippingAddressLine1: data.shippingAddressLine1,
          shippingAddressLine2: data.shippingAddressLine2,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState,
          shippingPostalCode: data.shippingPostalCode,
          shippingCountry: data.shippingCountry,
          billingFirstName: data.billingFirstName,
          billingLastName: data.billingLastName,
          billingAddressLine1: data.billingAddressLine1,
          billingAddressLine2: data.billingAddressLine2,
          billingCity: data.billingCity,
          billingState: data.billingState,
          billingPostalCode: data.billingPostalCode,
          billingCountry: data.billingCountry,
          paymentMethodType: data.paymentMethodType,
          paymentMethodEncryptedData: data.paymentMethodEncryptedData,
          paymentHolderName: data.paymentHolderName,
          lastUsedAt: data.lastUsedAt,
          purchaseCount: data.purchaseCount,
          isActive: data.isActive,
          updatedAt: data.updatedAt
        }
      })
  }

  /**
   * Finds a profile by its unique identifier.
   * @param id - The profile ID to search for
   * @returns Promise resolving to the profile or null if not found
   */
  async findById(id: ProfileId): Promise<Profile | null> {
    const db = this.drizzleConnection.getClient()

    const result = await db.select().from(profiles).where(eq(profiles.id, id.value)).limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToProfile(result[0])
  }

  /**
   * Finds a profile by its name.
   * @param name - The profile name to search for
   * @returns Promise resolving to the profile or null if not found
   */
  async findByName(name: ProfileName): Promise<Profile | null> {
    const db = this.drizzleConnection.getClient()

    const result = await db.select().from(profiles).where(eq(profiles.name, name.value)).limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToProfile(result[0])
  }

  /**
   * Retrieves all profiles in the repository.
   * @returns Promise resolving to array of profiles
   */
  async findAll(): Promise<Profile[]> {
    const db = this.drizzleConnection.getClient()

    const result = await db.select().from(profiles).orderBy(desc(profiles.createdAt))

    return Promise.all(result.map((row) => this.mapRowToProfile(row)))
  }

  /**
   * Retrieves only profiles that are currently active.
   * @returns Promise resolving to array of active profiles
   */
  async findActive(): Promise<Profile[]> {
    const db = this.drizzleConnection.getClient()

    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.isActive, true))
      .orderBy(desc(profiles.createdAt))

    return Promise.all(result.map((row) => this.mapRowToProfile(row)))
  }

  /**
   * Permanently removes a profile from the repository.
   * @param id - The unique identifier of the profile to delete
   * @returns Promise that resolves when the delete operation completes
   */
  async delete(id: ProfileId): Promise<void> {
    const db = this.drizzleConnection.getClient()

    await db.delete(profiles).where(eq(profiles.id, id.value))
  }

  /**
   * Deletes a profile by its unique identifier.
   * @param id - The profile ID to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteById(id: ProfileId): Promise<boolean> {
    const db = this.drizzleConnection.getClient()

    try {
      const result = await db.delete(profiles).where(eq(profiles.id, id.value))

      // Check if any rows were affected - better-sqlite3 returns changes
      return result.changes > 0
    } catch {
      return false
    }
  }

  /**
   * Checks whether a profile exists with the given ID.
   * @param id - The unique profile identifier to check
   * @returns Promise that resolves to true if profile exists, false otherwise
   */
  async exists(id: ProfileId): Promise<boolean> {
    const db = this.drizzleConnection.getClient()

    const result = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, id.value))
      .limit(1)

    return result.length > 0
  }

  /**
   * Checks whether a profile exists with the given name.
   * @param name - The profile name to check for existence
   * @returns Promise that resolves to true if profile with name exists, false otherwise
   */
  async existsByName(name: ProfileName): Promise<boolean> {
    const db = this.drizzleConnection.getClient()

    const result = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.name, name.value))
      .limit(1)

    return result.length > 0
  }

  /**
   * Counts the total number of profiles in the repository.
   * @returns Promise that resolves to the total profile count
   */
  async count(): Promise<number> {
    const db = this.drizzleConnection.getClient()

    const result = await db.select({ count: count() }).from(profiles)

    return result[0]?.count || 0
  }

  /**
   * Counts only the active profiles in the repository.
   * @returns Promise that resolves to the active profile count
   */
  async countActive(): Promise<number> {
    const db = this.drizzleConnection.getClient()

    const result = await db
      .select({ count: count() })
      .from(profiles)
      .where(eq(profiles.isActive, true))

    return result[0]?.count || 0
  }

  /**
   * Gets the total count of profiles, optionally filtered by active status.
   * @param activeOnly - If true, only counts active profiles
   * @returns Promise resolving to the count
   */
  async getCount(activeOnly = false): Promise<number> {
    return activeOnly ? this.countActive() : this.count()
  }

  /**
   * Updates the last used timestamp for a profile.
   * @param id - The profile ID to update
   * @param timestamp - The timestamp to set
   */
  async updateLastUsed(id: ProfileId, timestamp: Date): Promise<void> {
    const db = this.drizzleConnection.getClient()

    await db
      .update(profiles)
      .set({
        lastUsedAt: timestamp.toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(profiles.id, id.value))
  }

  /**
   * Updates the purchase count for a profile.
   * @param id - The profile ID to update
   * @param count - The new purchase count
   */
  async updatePurchaseCount(id: ProfileId, count: number): Promise<void> {
    const db = this.drizzleConnection.getClient()

    await db
      .update(profiles)
      .set({
        purchaseCount: count,
        updatedAt: new Date().toISOString()
      })
      .where(eq(profiles.id, id.value))
  }

  /**
   * Toggles the active status of a profile.
   * @param id - The profile ID to update
   * @param isActive - The new active status
   */
  async updateActiveStatus(id: ProfileId, isActive: boolean): Promise<void> {
    const db = this.drizzleConnection.getClient()

    await db
      .update(profiles)
      .set({
        isActive,
        updatedAt: new Date().toISOString()
      })
      .where(eq(profiles.id, id.value))
  }

  /**
   * Maps a database row to a Profile domain entity.
   * @param row - The database row
   * @returns Promise resolving to the Profile entity
   * @private
   */
  private async mapRowToProfile(row: typeof profiles.$inferSelect): Promise<Profile> {
    // Decrypt payment method data
    const decryptedPaymentData = await this.encryptionService.decrypt(
      row.paymentMethodEncryptedData
    )
    const paymentData = JSON.parse(decryptedPaymentData)

    const shippingAddress: AddressData = {
      firstName: row.shippingFirstName,
      lastName: row.shippingLastName,
      addressLine1: row.shippingAddressLine1,
      addressLine2: row.shippingAddressLine2 || '',
      city: row.shippingCity,
      state: row.shippingState,
      postalCode: row.shippingPostalCode,
      country: row.shippingCountry
    }

    const billingAddress: AddressData | null = row.billingFirstName
      ? {
          firstName: row.billingFirstName,
          lastName: row.billingLastName!,
          addressLine1: row.billingAddressLine1!,
          addressLine2: row.billingAddressLine2 || '',
          city: row.billingCity!,
          state: row.billingState!,
          postalCode: row.billingPostalCode!,
          country: row.billingCountry!
        }
      : null

    const paymentMethod: PaymentMethodData = {
      type: row.paymentMethodType as PaymentMethodType,
      holderName: row.paymentHolderName,
      lastFourDigits: paymentData.lastFourDigits,
      expiryMonth: paymentData.expiryMonth,
      expiryYear: paymentData.expiryYear,
      fullCardNumber: paymentData.fullCardNumber,
      cvv: paymentData.cvv
    }

    const profileData: ProfileData = {
      id: { value: row.id },
      name: row.name,
      email: row.email,
      phoneNumber: row.phoneNumber || undefined,
      shippingAddress,
      billingAddress: billingAddress || undefined,
      paymentMethod,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt) : undefined,
      purchaseCount: row.purchaseCount,
      isActive: row.isActive
    }

    return Profile.fromData(profileData)
  }
}
