import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { Profile } from '../../domain/entities/Profile'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileName } from '../../domain/value-objects/ProfileName'
import { PrismaConnection } from '../database/PrismaConnection'
import { getEncryptionService } from '../encryption/EncryptionService'
import {
  ProfileData,
  PaymentMethodData,
  AddressData,
  PaymentMethodType
} from '../../../shared/types/profile.types'
import type { Profile as PrismaProfile } from '@prisma/client'

/**
 * Prisma-based implementation of the profile repository.
 * Handles CRUD operations for profiles using Prisma ORM.
 */
export class PrismaProfileRepository implements IProfileRepository {
  private readonly prismaConnection: PrismaConnection
  private readonly encryptionService = getEncryptionService()

  constructor() {
    this.prismaConnection = PrismaConnection.getInstance()
  }

  /**
   * Saves a profile to the database.
   * @param profile - The profile entity to save
   * @throws {Error} If save operation fails
   */
  async save(profile: Profile): Promise<void> {
    const prisma = this.prismaConnection.getClient()
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
      lastUsedAt: profileData.lastUsedAt || null,
      purchaseCount: profileData.purchaseCount,
      isActive: profileData.isActive
      // dailyPurchases is handled by entity internally
    }

    await prisma.profile.upsert({
      where: { id: profileData.id.value },
      update: data,
      create: data
    })
  }

  /**
   * Finds a profile by its unique identifier.
   * @param id - The profile ID to search for
   * @returns Promise resolving to the profile or null if not found
   */
  async findById(id: ProfileId): Promise<Profile | null> {
    const prisma = this.prismaConnection.getClient()

    const row = await prisma.profile.findUnique({
      where: { id: id.value }
    })

    if (!row) {
      return null
    }

    return this.mapRowToProfile(row)
  }

  /**
   * Finds a profile by its name.
   * @param name - The profile name to search for
   * @returns Promise resolving to the profile or null if not found
   */
  async findByName(name: ProfileName): Promise<Profile | null> {
    const prisma = this.prismaConnection.getClient()

    const row = await prisma.profile.findUnique({
      where: { name: name.value }
    })

    if (!row) {
      return null
    }

    return this.mapRowToProfile(row)
  }

  /**
   * Retrieves all profiles in the repository.
   * @returns Promise resolving to array of profiles
   */
  async findAll(): Promise<Profile[]> {
    const prisma = this.prismaConnection.getClient()

    const rows = await prisma.profile.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return Promise.all(rows.map((row) => this.mapRowToProfile(row)))
  }

  /**
   * Retrieves only profiles that are currently active.
   * @returns Promise resolving to array of active profiles
   */
  async findActive(): Promise<Profile[]> {
    const prisma = this.prismaConnection.getClient()

    const rows = await prisma.profile.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    return Promise.all(rows.map((row) => this.mapRowToProfile(row)))
  }

  /**
   * Permanently removes a profile from the repository.
   * @param id - The unique identifier of the profile to delete
   * @returns Promise that resolves when the delete operation completes
   */
  async delete(id: ProfileId): Promise<void> {
    const prisma = this.prismaConnection.getClient()

    await prisma.profile.delete({
      where: { id: id.value }
    })
  }

  /**
   * Deletes a profile by its unique identifier.
   * @param id - The profile ID to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  async deleteById(id: ProfileId): Promise<boolean> {
    const prisma = this.prismaConnection.getClient()

    try {
      await prisma.profile.delete({
        where: { id: id.value }
      })
      return true
    } catch {
      // Prisma throws if record not found
      return false
    }
  }

  /**
   * Checks whether a profile exists with the given ID.
   * @param id - The unique profile identifier to check
   * @returns Promise that resolves to true if profile exists, false otherwise
   */
  async exists(id: ProfileId): Promise<boolean> {
    const prisma = this.prismaConnection.getClient()

    const profile = await prisma.profile.findUnique({
      where: { id: id.value }
    })

    return profile !== null
  }

  /**
   * Checks whether a profile exists with the given name.
   * @param name - The profile name to check for existence
   * @returns Promise that resolves to true if profile with name exists, false otherwise
   */
  async existsByName(name: ProfileName): Promise<boolean> {
    const prisma = this.prismaConnection.getClient()

    const profile = await prisma.profile.findFirst({
      where: {
        name: name.value
      }
    })

    return profile !== null
  }

  /**
   * Counts the total number of profiles in the repository.
   * @returns Promise that resolves to the total profile count
   */
  async count(): Promise<number> {
    const prisma = this.prismaConnection.getClient()

    return prisma.profile.count()
  }

  /**
   * Counts only the active profiles in the repository.
   * @returns Promise that resolves to the active profile count
   */
  async countActive(): Promise<number> {
    const prisma = this.prismaConnection.getClient()

    return prisma.profile.count({
      where: { isActive: true }
    })
  }

  /**
   * Gets the total count of profiles, optionally filtered by active status.
   * @param activeOnly - If true, only counts active profiles
   * @returns Promise resolving to the count
   */
  async getCount(activeOnly = false): Promise<number> {
    const prisma = this.prismaConnection.getClient()

    return prisma.profile.count({
      where: activeOnly ? { isActive: true } : undefined
    })
  }

  /**
   * Updates the last used timestamp for a profile.
   * @param id - The profile ID to update
   * @param timestamp - The timestamp to set
   */
  async updateLastUsed(id: ProfileId, timestamp: Date): Promise<void> {
    const prisma = this.prismaConnection.getClient()

    await prisma.profile.update({
      where: { id: id.value },
      data: { lastUsedAt: timestamp }
    })
  }

  /**
   * Updates the purchase count for a profile.
   * @param id - The profile ID to update
   * @param count - The new purchase count
   */
  async updatePurchaseCount(id: ProfileId, count: number): Promise<void> {
    const prisma = this.prismaConnection.getClient()

    await prisma.profile.update({
      where: { id: id.value },
      data: { purchaseCount: count }
    })
  }

  /**
   * Toggles the active status of a profile.
   * @param id - The profile ID to update
   * @param isActive - The new active status
   */
  async updateActiveStatus(id: ProfileId, isActive: boolean): Promise<void> {
    const prisma = this.prismaConnection.getClient()

    await prisma.profile.update({
      where: { id: id.value },
      data: { isActive }
    })
  }

  /**
   * Maps a database row to a Profile domain entity.
   * @param row - The database row
   * @returns Promise resolving to the Profile entity
   * @private
   */
  private async mapRowToProfile(row: PrismaProfile): Promise<Profile> {
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastUsedAt: row.lastUsedAt || undefined,
      purchaseCount: row.purchaseCount,
      isActive: row.isActive
    }

    return Profile.fromData(profileData)
  }
}
