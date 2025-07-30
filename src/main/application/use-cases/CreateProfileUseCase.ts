import { Profile } from '../../domain/entities/Profile'
import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileName } from '../../domain/value-objects/ProfileName'
import { DuplicateProfileError, ProfileLimitExceededError } from '../../domain/errors/ProfileErrors'
import { CreateProfileDto, ProfileResponseDto, ProfileDtoMapper } from '../dto/ProfileDto'

/**
 * Use case for creating new user profiles with anti-scalping measures.
 * This use case handles the business logic for profile creation, including:
 * - Enforcing maximum profile limits to prevent scalping
 * - Ensuring profile name uniqueness
 * - Validating all profile data
 * - Persisting the new profile
 * @example
 * ```typescript
 * const createProfile = new CreateProfileUseCase(profileRepository);
 * const profileDto: CreateProfileDto = {
 *   name: 'Main Profile',
 *   email: 'user@example.com',
 *   shippingAddress: { ... },
 *   paymentMethod: { ... }
 * };
 * try {
 *   const result = await createProfile.execute(profileDto);
 *   console.log(`Profile created with ID: ${result.id}`);
 * } catch (error) {
 *   if (error instanceof ProfileLimitExceededError) {
 *     console.log('Maximum profile limit reached');
 *   }
 * }
 * ```
 */
export class CreateProfileUseCase {
  /** Maximum number of profiles per user to prevent scalping behavior */
  private static readonly MAX_PROFILES = 5

  /**
   * Creates a new CreateProfileUseCase instance.
   * @param profileRepository - Repository for profile persistence operations
   */
  constructor(private readonly profileRepository: IProfileRepository) {}

  /**
   * Executes the profile creation use case.
   * This method validates the request, checks business rules, creates the profile
   * entity, and persists it to storage. It includes anti-scalping measures by
   * limiting the total number of profiles that can be created.
   * @param dto - Profile creation data transfer object
   * @returns Promise that resolves to the created profile response DTO
   * @throws {ProfileLimitExceededError} When maximum profile limit is reached
   * @throws {DuplicateProfileError} When a profile with the same name already exists
   * @throws {InvalidProfileError} When profile data validation fails
   * @throws {InvalidAddressError} When address data is invalid
   * @throws {InvalidPaymentMethodError} When payment method data is invalid
   * @example
   * ```typescript
   * const dto: CreateProfileDto = {
   *   name: 'Shopping Profile',
   *   email: 'user@example.com',
   *   phoneNumber: '+1234567890',
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
   *     type: 'credit_card',
   *     lastFourDigits: '1234',
   *     expiryMonth: 12,
   *     expiryYear: 2025,
   *     holderName: 'John Doe'
   *   }
   * };
   * const profile = await useCase.execute(dto);
   * ```
   */
  async execute(dto: CreateProfileDto): Promise<ProfileResponseDto> {
    // Check profile limit (anti-scalping measure)
    const currentCount = await this.profileRepository.count()
    if (currentCount >= CreateProfileUseCase.MAX_PROFILES) {
      throw new ProfileLimitExceededError(currentCount, CreateProfileUseCase.MAX_PROFILES)
    }

    // Check for duplicate profile name
    const profileName = ProfileName.create(dto.name)
    const existingProfile = await this.profileRepository.findByName(profileName)
    if (existingProfile) {
      throw new DuplicateProfileError(dto.name)
    }

    // Create and save the profile
    const profileData = ProfileDtoMapper.toCreationData(dto)
    const profile = Profile.create(profileData)

    await this.profileRepository.save(profile)

    // Return response DTO with computed values
    const responseDto = ProfileDtoMapper.toResponseDto(profile.toData())
    responseDto.paymentMethod.maskedDisplay = profile.paymentMethod.maskedDisplay
    responseDto.paymentMethod.isExpired = profile.paymentMethod.isExpired
    responseDto.isSuspicious = profile.isSuspicious
    responseDto.cooldownRemaining = profile.cooldownRemaining

    return responseDto
  }
}
