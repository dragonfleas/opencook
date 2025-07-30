import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../domain/errors/ProfileErrors'
import { ProfileResponseDto, ProfileDtoMapper } from '../dto/ProfileDto'

export class GetProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(profileId: string): Promise<ProfileResponseDto> {
    const id = ProfileId.create(profileId)
    const profile = await this.profileRepository.findById(id)

    if (!profile) {
      throw new ProfileNotFoundError(profileId)
    }

    // Convert to response DTO with computed values
    const responseDto = ProfileDtoMapper.toResponseDto(profile.toData())
    responseDto.paymentMethod.maskedDisplay = profile.paymentMethod.maskedDisplay
    responseDto.paymentMethod.isExpired = profile.paymentMethod.isExpired
    responseDto.isSuspicious = profile.isSuspicious
    responseDto.cooldownRemaining = profile.cooldownRemaining

    return responseDto
  }
}
