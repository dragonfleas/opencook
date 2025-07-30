import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileName } from '../../domain/value-objects/ProfileName'
import { Address } from '../../domain/value-objects/Address'
import { PaymentMethod } from '../../domain/value-objects/PaymentMethod'
import { ProfileNotFoundError, DuplicateProfileError } from '../../domain/errors/ProfileErrors'
import { UpdateProfileDto, ProfileResponseDto, ProfileDtoMapper } from '../dto/ProfileDto'
import { PaymentMethodType } from '../../../shared/types/profile.types'

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const profileId = ProfileId.create(dto.id)
    const profile = await this.profileRepository.findById(profileId)

    if (!profile) {
      throw new ProfileNotFoundError(dto.id)
    }

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== profile.name.value) {
      const newName = ProfileName.create(dto.name)
      const existingProfile = await this.profileRepository.findByName(newName)
      if (existingProfile && !existingProfile.id.equals(profileId)) {
        throw new DuplicateProfileError(dto.name)
      }
      profile.updateName(dto.name)
    }

    // Update email if provided
    if (dto.email) {
      profile.updateEmail(dto.email)
    }

    // Update phone number if provided (including clearing it)
    if (dto.phoneNumber !== undefined) {
      profile.updatePhoneNumber(dto.phoneNumber)
    }

    // Update shipping address if provided
    if (dto.shippingAddress) {
      const shippingAddress = Address.create(dto.shippingAddress)
      profile.updateShippingAddress(shippingAddress)
    }

    // Update billing address if provided (including clearing it)
    if (dto.billingAddress !== undefined) {
      const billingAddress = dto.billingAddress ? Address.create(dto.billingAddress) : undefined
      profile.updateBillingAddress(billingAddress)
    }

    // Update payment method if provided
    if (dto.paymentMethod) {
      const paymentMethod = PaymentMethod.create({
        ...dto.paymentMethod,
        type: dto.paymentMethod.type as PaymentMethodType
      })
      profile.updatePaymentMethod(paymentMethod)
    }

    // Save the updated profile
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
