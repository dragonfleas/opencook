import { ProfileData, ProfileCreationData } from '../../../shared/types/profile.types'
import { ProfileId } from '../value-objects/ProfileId'
import { ProfileName } from '../value-objects/ProfileName'
import { Email } from '../value-objects/Email'
import { PhoneNumber } from '../value-objects/PhoneNumber'
import { Address } from '../value-objects/Address'
import { PaymentMethod } from '../value-objects/PaymentMethod'
import {
  InvalidProfileError,
  PurchaseCooldownError,
  ProfileInactiveError
} from '../errors/ProfileErrors'

/**
 * Domain entity representing a user profile for retail automation.
 *
 * This entity encapsulates all business rules related to user profiles,
 * including anti-scalping measures, purchase tracking, and validation logic.
 *
 * @example
 * ```typescript
 * const profileData: ProfileCreationData = {
 *   name: 'Main Profile',
 *   email: 'user@example.com',
 *   shippingAddress: { ... },
 *   paymentMethod: { ... }
 * };
 *
 * const profile = Profile.create(profileData);
 * profile.canMakePurchase(); // Check if profile can make purchase
 * profile.recordPurchase(); // Record a successful purchase
 * ```
 *
 * @since 1.0.0
 */
export class Profile {
  /** Cooldown period between purchases in seconds (5 minutes) */
  private static readonly PURCHASE_COOLDOWN_SECONDS = 300

  /** Maximum number of purchases allowed per day */
  private static readonly MAX_DAILY_PURCHASES = 3

  /** Threshold for flagging profiles with suspicious activity */
  private static readonly SUSPICIOUS_PURCHASE_THRESHOLD = 10

  /** Unique identifier for the profile */
  private _id: ProfileId

  /** Human-readable name for the profile */
  private _name: ProfileName

  /** Email address associated with the profile */
  private _email: Email

  /** Optional phone number for the profile */
  private _phoneNumber?: PhoneNumber

  /** Shipping address for deliveries */
  private _shippingAddress: Address

  /** Optional billing address (defaults to shipping if not provided) */
  private _billingAddress?: Address

  /** Payment method information */
  private _paymentMethod: PaymentMethod

  /** Timestamp when the profile was created */
  private _createdAt: Date

  /** Timestamp when the profile was last updated */
  private _updatedAt: Date

  /** Optional timestamp when the profile was last used for a purchase */
  private _lastUsedAt?: Date

  /** Total number of purchases made with this profile */
  private _purchaseCount: number

  /** Whether the profile is currently active and can be used */
  private _isActive: boolean

  /** Map tracking daily purchase counts (date string -> count) */
  private _dailyPurchases: Map<string, number>

  /**
   * Private constructor to ensure profiles are created through factory methods.
   *
   * @param data - Profile initialization data
   * @param data.id - Unique profile identifier
   * @param data.name - Profile name
   * @param data.email - Email address
   * @param data.phoneNumber - Optional phone number
   * @param data.shippingAddress - Shipping address
   * @param data.billingAddress - Optional billing address
   * @param data.paymentMethod - Payment method information
   * @param data.createdAt - Optional creation timestamp (defaults to now)
   * @param data.updatedAt - Optional update timestamp (defaults to now)
   * @param data.lastUsedAt - Optional last used timestamp
   * @param data.purchaseCount - Optional purchase count (defaults to 0)
   * @param data.isActive - Optional active status (defaults to true)
   */
  private constructor(data: {
    id: ProfileId
    name: ProfileName
    email: Email
    phoneNumber?: PhoneNumber
    shippingAddress: Address
    billingAddress?: Address
    paymentMethod: PaymentMethod
    createdAt?: Date
    updatedAt?: Date
    lastUsedAt?: Date
    purchaseCount?: number
    isActive?: boolean
  }) {
    this._id = data.id
    this._name = data.name
    this._email = data.email
    this._phoneNumber = data.phoneNumber
    this._shippingAddress = data.shippingAddress
    this._billingAddress = data.billingAddress
    this._paymentMethod = data.paymentMethod
    this._createdAt = data.createdAt || new Date(Date.now())
    this._updatedAt = data.updatedAt || new Date(Date.now())
    this._lastUsedAt = data.lastUsedAt
    this._purchaseCount = data.purchaseCount || 0
    this._isActive = data.isActive !== undefined ? data.isActive : true
    this._dailyPurchases = new Map()
  }

  /**
   * Factory method to create a new profile from creation data.
   *
   * This method generates a new unique ID and creates all necessary value objects
   * from the provided data. The profile is created in an active state by default.
   *
   * @param data - Profile creation data containing required fields
   * @returns New Profile instance with generated ID and current timestamps
   *
   * @throws {InvalidProfileError} When profile data validation fails
   * @throws {InvalidAddressError} When address data is invalid
   * @throws {InvalidPaymentMethodError} When payment method data is invalid
   *
   * @example
   * ```typescript
   * const profile = Profile.create({
   *   name: 'Main Profile',
   *   email: 'user@example.com',
   *   shippingAddress: {
   *     firstName: 'John',
   *     lastName: 'Doe',
   *     addressLine1: '123 Main St',
   *     city: 'Anytown',
   *     state: 'NY',
   *     postalCode: '12345',
   *     country: 'US'
   *   },
   *   paymentMethod: {
   *     type: PaymentMethodType.CREDIT_CARD,
   *     lastFourDigits: '1234',
   *     expiryMonth: 12,
   *     expiryYear: 2025,
   *     holderName: 'John Doe'
   *   }
   * });
   * ```
   */
  static create(data: ProfileCreationData): Profile {
    const profile = new Profile({
      id: ProfileId.create(),
      name: ProfileName.create(data.name),
      email: Email.create(data.email),
      phoneNumber: PhoneNumber.create(data.phoneNumber),
      shippingAddress: Address.create(data.shippingAddress),
      billingAddress: data.billingAddress ? Address.create(data.billingAddress) : undefined,
      paymentMethod: PaymentMethod.create(data.paymentMethod)
    })

    return profile
  }

  /**
   * Factory method to recreate a profile from stored data.
   *
   * This method is used to reconstruct Profile entities from data retrieved
   * from storage (database, etc.). Unlike create(), this preserves existing
   * IDs, timestamps, and state.
   *
   * @param data - Complete profile data including ID and metadata
   * @returns Profile instance recreated from stored data
   *
   * @throws {InvalidProfileError} When profile data validation fails
   *
   * @example
   * ```typescript
   * const profileData = await repository.findById(profileId);
   * const profile = Profile.fromData(profileData);
   * ```
   */
  static fromData(data: ProfileData): Profile {
    return new Profile({
      id: ProfileId.create(data.id.value),
      name: ProfileName.create(data.name),
      email: Email.create(data.email),
      phoneNumber: PhoneNumber.create(data.phoneNumber),
      shippingAddress: Address.create(data.shippingAddress),
      billingAddress: data.billingAddress ? Address.create(data.billingAddress) : undefined,
      paymentMethod: PaymentMethod.create(data.paymentMethod),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
      purchaseCount: data.purchaseCount,
      isActive: data.isActive
    })
  }

  // Anti-scalping methods
  /**
   * Validates whether the profile can make a purchase based on anti-scalping rules.
   *
   * This method enforces the following business rules:
   * 1. Profile must be active
   * 2. Must respect cooldown period between purchases (5 minutes)
   * 3. Must not exceed daily purchase limit (3 purchases per day)
   *
   * The cooldown prevents rapid-fire purchases that could indicate automated
   * scalping behavior. The daily limit prevents accumulation of excessive inventory.
   *
   * @throws {ProfileInactiveError} When the profile is deactivated
   * @throws {PurchaseCooldownError} When attempting purchase before cooldown expires
   * @throws {InvalidProfileError} When daily purchase limit is exceeded
   *
   * @example
   * ```typescript
   * try {
   *   profile.canMakePurchase();
   *   // Safe to proceed with purchase
   * } catch (error) {
   *   if (error instanceof PurchaseCooldownError) {
   *     console.log(`Wait ${error.remainingSeconds} seconds`);
   *   }
   * }
   * ```
   */
  canMakePurchase(): void {
    if (!this._isActive) {
      throw new ProfileInactiveError(this._id.value)
    }

    // Check cooldown period
    if (this._lastUsedAt) {
      const secondsSinceLastUse = (Date.now() - this._lastUsedAt.getTime()) / 1000
      if (secondsSinceLastUse < Profile.PURCHASE_COOLDOWN_SECONDS) {
        const remainingTime = Math.ceil(Profile.PURCHASE_COOLDOWN_SECONDS - secondsSinceLastUse)
        throw new PurchaseCooldownError(remainingTime)
      }
    }

    // Check daily purchase limit
    const today = new Date(Date.now()).toISOString().split('T')[0]
    const dailyCount = this._dailyPurchases.get(today) || 0
    if (dailyCount >= Profile.MAX_DAILY_PURCHASES) {
      throw new InvalidProfileError(
        'purchaseLimit',
        `Daily purchase limit of ${Profile.MAX_DAILY_PURCHASES} reached`
      )
    }
  }

  /**
   * Records a successful purchase and updates anti-scalping tracking data.
   *
   * This method performs the following actions:
   * 1. Validates purchase eligibility using canMakePurchase()
   * 2. Increments total purchase count
   * 3. Updates last used timestamp
   * 4. Increments daily purchase counter
   * 5. Cleans up old daily purchase records (keeps last 7 days)
   *
   * The method automatically maintains a rolling window of daily purchase
   * data to prevent memory leaks while preserving recent activity patterns.
   *
   * @throws {ProfileInactiveError} When the profile is deactivated
   * @throws {PurchaseCooldownError} When attempting purchase before cooldown expires
   * @throws {InvalidProfileError} When daily purchase limit is exceeded
   *
   * @example
   * ```typescript
   * try {
   *   profile.recordPurchase();
   *   console.log(`Purchase recorded. Total: ${profile.purchaseCount}`);
   * } catch (error) {
   *   console.error('Purchase failed:', error.message);
   * }
   * ```
   */
  recordPurchase(): void {
    this.canMakePurchase() // Validate before recording

    this._purchaseCount++
    const now = new Date(Date.now())
    this._lastUsedAt = now
    this._updatedAt = now

    // Update daily purchase count
    const today = now.toISOString().split('T')[0]
    const currentCount = this._dailyPurchases.get(today) || 0
    this._dailyPurchases.set(today, currentCount + 1)

    // Clean up old daily purchase records (keep last 7 days)
    const sevenDaysAgo = new Date(Date.now())
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]

    for (const [date] of this._dailyPurchases) {
      if (date < cutoffDate) {
        this._dailyPurchases.delete(date)
      }
    }
  }

  /**
   * Indicates whether the profile shows suspicious activity patterns.
   *
   * A profile is considered suspicious if it has made more purchases than
   * the threshold (10 purchases), which may indicate scalping behavior.
   * This flag can be used by monitoring systems to flag accounts for review.
   *
   * @returns True if purchase count exceeds suspicious threshold, false otherwise
   *
   * @example
   * ```typescript
   * if (profile.isSuspicious) {
   *   await notificationService.flagForReview(profile.id);
   * }
   * ```
   */
  get isSuspicious(): boolean {
    return this._purchaseCount > Profile.SUSPICIOUS_PURCHASE_THRESHOLD
  }

  /**
   * Gets the remaining cooldown time in seconds before next purchase is allowed.
   *
   * This method calculates how much time remains in the anti-scalping cooldown
   * period. Returns 0 if no cooldown is active (profile hasn't been used or
   * cooldown has expired).
   *
   * @returns Remaining cooldown time in seconds (0 if no cooldown active)
   *
   * @example
   * ```typescript
   * const remaining = profile.cooldownRemaining;
   * if (remaining > 0) {
   *   console.log(`Please wait ${remaining} seconds before next purchase`);
   * }
   * ```
   */
  get cooldownRemaining(): number {
    if (!this._lastUsedAt) return 0

    const secondsSinceLastUse = (Date.now() - this._lastUsedAt.getTime()) / 1000
    const remaining = Profile.PURCHASE_COOLDOWN_SECONDS - secondsSinceLastUse

    return remaining > 0 ? Math.ceil(remaining) : 0
  }

  // Update methods
  /**
   * Updates the profile name with validation.
   *
   * This method creates a new ProfileName value object to ensure the name
   * meets all validation requirements, then updates the profile's updatedAt
   * timestamp to track the modification.
   *
   * @param name - New name for the profile
   *
   * @throws {InvalidProfileNameError} When the name is invalid (empty, too long, etc.)
   *
   * @example
   * ```typescript
   * profile.updateName('Updated Profile Name');
   * console.log(`Profile renamed to: ${profile.name.value}`);
   * ```
   */
  updateName(name: string): void {
    this._name = ProfileName.create(name)
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Updates the profile email address with validation.
   *
   * This method creates a new Email value object to ensure the email
   * is properly formatted and valid, then updates the profile's updatedAt
   * timestamp to track the modification.
   *
   * @param email - New email address for the profile
   *
   * @throws {InvalidEmailError} When the email format is invalid
   *
   * @example
   * ```typescript
   * profile.updateEmail('newemail@example.com');
   * console.log(`Email updated to: ${profile.email.value}`);
   * ```
   */
  updateEmail(email: string): void {
    this._email = Email.create(email)
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Updates the profile phone number with validation.
   *
   * This method creates a new PhoneNumber value object (or undefined if not provided)
   * to ensure the phone number meets validation requirements, then updates the
   * profile's updatedAt timestamp.
   *
   * @param phoneNumber - New phone number for the profile (optional)
   *
   * @throws {InvalidPhoneNumberError} When the phone number format is invalid
   *
   * @example
   * ```typescript
   * profile.updatePhoneNumber('+1-555-123-4567');
   * // or remove phone number
   * profile.updatePhoneNumber(undefined);
   * ```
   */
  updatePhoneNumber(phoneNumber?: string): void {
    this._phoneNumber = PhoneNumber.create(phoneNumber)
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Updates the profile shipping address.
   *
   * This method replaces the current shipping address with the provided
   * Address value object and updates the profile's updatedAt timestamp.
   *
   * @param address - New shipping address for the profile
   *
   * @example
   * ```typescript
   * const newAddress = Address.create({
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   addressLine1: '456 New St',
   *   city: 'New City',
   *   state: 'CA',
   *   postalCode: '90210',
   *   country: 'US'
   * });
   * profile.updateShippingAddress(newAddress);
   * ```
   */
  updateShippingAddress(address: Address): void {
    this._shippingAddress = address
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Updates the profile billing address.
   *
   * This method replaces the current billing address with the provided
   * Address value object (or removes it if undefined is passed) and updates
   * the profile's updatedAt timestamp.
   *
   * @param address - New billing address for the profile (optional)
   *
   * @example
   * ```typescript
   * // Set billing address
   * const billingAddress = Address.create({ ... });
   * profile.updateBillingAddress(billingAddress);
   *
   * // Remove billing address (will use shipping address)
   * profile.updateBillingAddress(undefined);
   * ```
   */
  updateBillingAddress(address?: Address): void {
    this._billingAddress = address
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Updates the profile payment method.
   *
   * This method replaces the current payment method with the provided
   * PaymentMethod value object and updates the profile's updatedAt timestamp.
   *
   * @param paymentMethod - New payment method for the profile
   *
   * @example
   * ```typescript
   * const newPayment = PaymentMethod.create({
   *   type: PaymentMethodType.CREDIT_CARD,
   *   lastFourDigits: '5678',
   *   expiryMonth: 6,
   *   expiryYear: 2026,
   *   holderName: 'John Doe'
   * });
   * profile.updatePaymentMethod(newPayment);
   * ```
   */
  updatePaymentMethod(paymentMethod: PaymentMethod): void {
    this._paymentMethod = paymentMethod
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Activates the profile, allowing it to be used for purchases.
   *
   * This method sets the profile's active status to true and updates
   * the updatedAt timestamp. Active profiles can make purchases subject
   * to anti-scalping rules.
   *
   * @example
   * ```typescript
   * profile.activate();
   * console.log(`Profile ${profile.name.value} is now active`);
   * ```
   */
  activate(): void {
    this._isActive = true
    this._updatedAt = new Date(Date.now())
  }

  /**
   * Deactivates the profile, preventing it from being used for purchases.
   *
   * This method sets the profile's active status to false and updates
   * the updatedAt timestamp. Deactivated profiles cannot make purchases
   * and will throw ProfileInactiveError when canMakePurchase() is called.
   *
   * @example
   * ```typescript
   * profile.deactivate();
   * console.log(`Profile ${profile.name.value} has been deactivated`);
   * ```
   */
  deactivate(): void {
    this._isActive = false
    this._updatedAt = new Date(Date.now())
  }

  // Getters
  /**
   * Gets the unique identifier for this profile.
   *
   * @returns The profile's unique ID as a ProfileId value object
   */
  get id(): ProfileId {
    return this._id
  }

  /**
   * Gets the human-readable name for this profile.
   *
   * @returns The profile's name as a ProfileName value object
   */
  get name(): ProfileName {
    return this._name
  }

  /**
   * Gets the email address associated with this profile.
   *
   * @returns The profile's email as an Email value object
   */
  get email(): Email {
    return this._email
  }

  /**
   * Gets the phone number associated with this profile.
   *
   * @returns The profile's phone number as a PhoneNumber value object, or undefined if not set
   */
  get phoneNumber(): PhoneNumber | undefined {
    return this._phoneNumber
  }

  /**
   * Gets the shipping address for this profile.
   *
   * @returns The profile's shipping address as an Address value object
   */
  get shippingAddress(): Address {
    return this._shippingAddress
  }

  /**
   * Gets the billing address for this profile.
   *
   * @returns The profile's billing address as an Address value object, or undefined if not set
   */
  get billingAddress(): Address | undefined {
    return this._billingAddress
  }

  /**
   * Gets the payment method for this profile.
   *
   * @returns The profile's payment method as a PaymentMethod value object
   */
  get paymentMethod(): PaymentMethod {
    return this._paymentMethod
  }

  /**
   * Gets the timestamp when this profile was created.
   *
   * @returns The profile's creation date and time
   */
  get createdAt(): Date {
    return this._createdAt
  }

  /**
   * Gets the timestamp when this profile was last updated.
   *
   * This timestamp is automatically updated whenever any profile data changes.
   *
   * @returns The profile's last update date and time
   */
  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Gets the timestamp when this profile was last used for a purchase.
   *
   * This timestamp is used for anti-scalping cooldown calculations.
   *
   * @returns The profile's last usage date and time, or undefined if never used
   */
  get lastUsedAt(): Date | undefined {
    return this._lastUsedAt
  }

  /**
   * Gets the total number of purchases made with this profile.
   *
   * This count is used for suspicious activity detection and analytics.
   *
   * @returns The total number of purchases made with this profile
   */
  get purchaseCount(): number {
    return this._purchaseCount
  }

  /**
   * Gets whether this profile is currently active.
   *
   * Only active profiles can be used for purchases. Inactive profiles
   * will throw ProfileInactiveError when attempting to make purchases.
   *
   * @returns True if the profile is active, false if deactivated
   */
  get isActive(): boolean {
    return this._isActive
  }

  /**
   * Gets the effective billing address for this profile.
   *
   * If a specific billing address is set, returns that address.
   * Otherwise, returns the shipping address as the default billing address.
   *
   * @returns The billing address to use for transactions
   *
   * @example
   * ```typescript
   * const billingAddr = profile.effectiveBillingAddress;
   * // Will use specific billing address if set, otherwise shipping address
   * ```
   */
  get effectiveBillingAddress(): Address {
    return this._billingAddress || this._shippingAddress
  }

  /**
   * Converts the profile entity to a plain data object for serialization.
   *
   * This method extracts all profile data into a serializable format
   * suitable for storage, transmission, or logging. All value objects
   * are converted to their primitive representations.
   *
   * @returns Plain object containing all profile data
   *
   * @example
   * ```typescript
   * const profileData = profile.toData();
   * await repository.save(profileData);
   *
   * // or for logging
   * console.log('Profile data:', JSON.stringify(profileData, null, 2));
   * ```
   */
  toData(): ProfileData {
    return {
      id: { value: this._id.value },
      name: this._name.value,
      email: this._email.value,
      phoneNumber: this._phoneNumber?.value,
      shippingAddress: this._shippingAddress.toData(),
      billingAddress: this._billingAddress?.toData(),
      paymentMethod: this._paymentMethod.toData(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      lastUsedAt: this._lastUsedAt,
      purchaseCount: this._purchaseCount,
      isActive: this._isActive
    }
  }
}
