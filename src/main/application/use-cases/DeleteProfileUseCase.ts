import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../domain/errors/ProfileErrors'

export class DeleteProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(profileId: string): Promise<void> {
    const id = ProfileId.create(profileId)

    // Verify profile exists before attempting deletion
    const exists = await this.profileRepository.exists(id)
    if (!exists) {
      throw new ProfileNotFoundError(profileId)
    }

    // Delete the profile
    await this.profileRepository.delete(id)
  }
}
