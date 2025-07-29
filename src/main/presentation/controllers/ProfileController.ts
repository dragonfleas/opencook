import { BaseController } from './BaseController'
import { CreateProfileUseCase } from '../../application/use-cases/CreateProfileUseCase'
import { GetProfileUseCase } from '../../application/use-cases/GetProfileUseCase'
import { ListProfilesUseCase } from '../../application/use-cases/ListProfilesUseCase'
import { UpdateProfileUseCase } from '../../application/use-cases/UpdateProfileUseCase'
import { DeleteProfileUseCase } from '../../application/use-cases/DeleteProfileUseCase'
import { ToggleProfileActiveUseCase } from '../../application/use-cases/ToggleProfileActiveUseCase'
import { ValidateProfileForPurchaseUseCase } from '../../application/use-cases/ValidateProfileForPurchaseUseCase'
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
  ProfileListResponseDto
} from '../../application/dto/ProfileDto'
import type { ProfileValidationResult } from '../../application/use-cases/ValidateProfileForPurchaseUseCase'
import { BaseListQuery } from '../../../shared/types/ipc.types'
import {
  ProfileNotFoundError,
  MaxProfilesExceededError,
  DuplicateProfileError,
  ProfileInactiveError,
  ProfileCooldownError,
  ProfilePurchaseLimitError,
  ProfileSuspiciousActivityError
} from '../../domain/errors/ProfileErrors'
import { ValidationError } from '../../domain/errors/ValidationError'

interface ProfileListQuery extends BaseListQuery {
  // Profile-specific query parameters can be added here
  // activeOnly is already included from BaseListQuery
}

export class ProfileController extends BaseController<
  ProfileResponseDto,
  CreateProfileDto,
  UpdateProfileDto,
  ProfileValidationResult,
  ProfileListQuery
> {
  constructor(
    private readonly createProfile: CreateProfileUseCase,
    private readonly getProfile: GetProfileUseCase,
    private readonly listProfiles: ListProfilesUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly deleteProfile: DeleteProfileUseCase,
    private readonly toggleProfileActive: ToggleProfileActiveUseCase,
    private readonly validateProfileForPurchase: ValidateProfileForPurchaseUseCase
  ) {
    super({
      entityName: 'profile',
      enableLogging: true,
      maxListLimit: 100,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc'
    })
  }

  protected async executeCreate(dto: CreateProfileDto): Promise<ProfileResponseDto> {
    return await this.createProfile.execute(dto)
  }

  protected async executeGet(id: string): Promise<ProfileResponseDto> {
    return await this.getProfile.execute(id)
  }

  protected async executeList(query?: ProfileListQuery): Promise<ProfileListResponseDto> {
    const activeOnly = query?.activeOnly ?? false
    return await this.listProfiles.execute({ activeOnly })
  }

  protected async executeUpdate(dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    return await this.updateProfile.execute(dto)
  }

  protected async executeDelete(id: string): Promise<void> {
    await this.deleteProfile.execute(id)
  }

  protected async executeToggleActive(id: string, isActive: boolean): Promise<ProfileResponseDto> {
    return await this.toggleProfileActive.execute(id, isActive)
  }

  protected async executeValidate(id: string): Promise<ProfileValidationResult> {
    return await this.validateProfileForPurchase.execute(id)
  }

  protected mapErrorToDetails(error: unknown): { code: string; details?: unknown } | null {
    if (error instanceof ProfileNotFoundError) {
      return { code: 'PROFILE_NOT_FOUND' }
    }

    if (error instanceof MaxProfilesExceededError) {
      return { code: 'MAX_PROFILES_EXCEEDED' }
    }

    if (error instanceof DuplicateProfileError) {
      return { code: 'DUPLICATE_PROFILE' }
    }

    if (error instanceof ProfileInactiveError) {
      return { code: 'PROFILE_INACTIVE' }
    }

    if (error instanceof ProfileCooldownError) {
      return {
        code: 'PROFILE_COOLDOWN',
        details: {
          remainingTime: error.remainingTime
        }
      }
    }

    if (error instanceof ProfilePurchaseLimitError) {
      return { code: 'PROFILE_PURCHASE_LIMIT' }
    }

    if (error instanceof ProfileSuspiciousActivityError) {
      return { code: 'PROFILE_SUSPICIOUS_ACTIVITY' }
    }

    if (error instanceof ValidationError) {
      return {
        code: 'VALIDATION_ERROR',
        details: {
          field: error.field,
          value: error.value
        }
      }
    }

    return null // Let BaseController handle generic errors
  }
}
