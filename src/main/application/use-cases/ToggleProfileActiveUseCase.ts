import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../domain/errors/ProfileErrors'
import { ProfileResponseDto, ProfileDtoMapper } from '../dto/ProfileDto'

export class ToggleProfileActiveUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(profileId: string, isActive: boolean): Promise<ProfileResponseDto> {
    const id = ProfileId.create(profileId)
    const profile = await this.profileRepository.findById(id)

    if (!profile) {
      throw new ProfileNotFoundError(profileId)
    }

    // Toggle active state
    if (isActive) {
      profile.activate()
    } else {
      profile.deactivate()
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
