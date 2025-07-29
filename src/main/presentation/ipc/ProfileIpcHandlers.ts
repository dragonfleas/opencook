import { BaseIpcHandlers } from './BaseIpcHandlers'
import { ProfileController } from '../controllers/ProfileController'
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto
} from '../../application/dto/ProfileDto'
import type { ProfileValidationResult } from '../../application/use-cases/ValidateProfileForPurchaseUseCase'
import { BaseListQuery } from '../../../shared/types/ipc.types'

interface ProfileListQuery extends BaseListQuery {
  // Profile-specific query parameters can be added here
  // activeOnly is already included from BaseListQuery
}

export class ProfileIpcHandlers extends BaseIpcHandlers<
  ProfileResponseDto,
  CreateProfileDto,
  UpdateProfileDto,
  ProfileValidationResult,
  ProfileListQuery
> {
  constructor(profileController: ProfileController) {
    super('profile', profileController)
  }

  protected registerCustomHandlers(): void {
    // No custom handlers needed - all operations use standard patterns
  }
}
