import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileListDto, ProfileDtoMapper } from '../dto/ProfileDto'

export interface ListProfilesOptions {
  activeOnly?: boolean
}

export class ListProfilesUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(options: ListProfilesOptions = {}): Promise<ProfileListDto> {
    const { activeOnly = false } = options

    // Get profiles based on filter
    const profiles = activeOnly
      ? await this.profileRepository.findActive()
      : await this.profileRepository.findAll()

    // Get counts
    const total = await this.profileRepository.count()
    const activeCount = await this.profileRepository.countActive()

    // Convert to summary DTOs
    const profileSummaries = profiles.map((profile) =>
      ProfileDtoMapper.toSummaryDto(profile.toData())
    )

    return {
      profiles: profileSummaries,
      total,
      activeCount
    }
  }
}
