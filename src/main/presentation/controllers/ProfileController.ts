import { IpcMainInvokeEvent } from 'electron'
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

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export class ProfileController {
  constructor(
    private readonly createProfile: CreateProfileUseCase,
    private readonly getProfile: GetProfileUseCase,
    private readonly listProfiles: ListProfilesUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly deleteProfile: DeleteProfileUseCase,
    private readonly toggleProfileActive: ToggleProfileActiveUseCase,
    private readonly validateProfileForPurchase: ValidateProfileForPurchaseUseCase
  ) {}

  async handleCreateProfile(
    _event: IpcMainInvokeEvent,
    dto: CreateProfileDto
  ): Promise<IpcResponse<ProfileResponseDto>> {
    try {
      const profile = await this.createProfile.execute(dto)
      return {
        success: true,
        data: profile
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async handleGetProfile(
    _event: IpcMainInvokeEvent,
    profileId: string
  ): Promise<IpcResponse<ProfileResponseDto>> {
    try {
      const profile = await this.getProfile.execute(profileId)
      return {
        success: true,
        data: profile
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async handleListProfiles(
    _event: IpcMainInvokeEvent,
    activeOnly: boolean = false
  ): Promise<IpcResponse<ProfileListResponseDto>> {
    try {
      const profiles = await this.listProfiles.execute({ activeOnly })
      return {
        success: true,
        data: profiles
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async handleUpdateProfile(
    _event: IpcMainInvokeEvent,
    dto: UpdateProfileDto
  ): Promise<IpcResponse<ProfileResponseDto>> {
    try {
      const profile = await this.updateProfile.execute(dto)
      return {
        success: true,
        data: profile
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async handleDeleteProfile(
    _event: IpcMainInvokeEvent,
    profileId: string
  ): Promise<IpcResponse<void>> {
    try {
      await this.deleteProfile.execute(profileId)
      return {
        success: true
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async handleToggleProfileActive(
    _event: IpcMainInvokeEvent,
    profileId: string,
    isActive: boolean
  ): Promise<IpcResponse<ProfileResponseDto>> {
    try {
      const profile = await this.toggleProfileActive.execute(profileId, isActive)
      return {
        success: true,
        data: profile
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async handleValidateProfileForPurchase(
    _event: IpcMainInvokeEvent,
    profileId: string
  ): Promise<IpcResponse<ProfileValidationResult>> {
    try {
      const result = await this.validateProfileForPurchase.execute(profileId)
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  private handleError(error: unknown): IpcResponse {
    if (error instanceof ProfileNotFoundError) {
      return {
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: error.message
        }
      }
    }

    if (error instanceof MaxProfilesExceededError) {
      return {
        success: false,
        error: {
          code: 'MAX_PROFILES_EXCEEDED',
          message: error.message
        }
      }
    }

    if (error instanceof DuplicateProfileError) {
      return {
        success: false,
        error: {
          code: 'DUPLICATE_PROFILE',
          message: error.message
        }
      }
    }

    if (error instanceof ProfileInactiveError) {
      return {
        success: false,
        error: {
          code: 'PROFILE_INACTIVE',
          message: error.message
        }
      }
    }

    if (error instanceof ProfileCooldownError) {
      return {
        success: false,
        error: {
          code: 'PROFILE_COOLDOWN',
          message: error.message,
          details: {
            remainingTime: error.remainingTime
          }
        }
      }
    }

    if (error instanceof ProfilePurchaseLimitError) {
      return {
        success: false,
        error: {
          code: 'PROFILE_PURCHASE_LIMIT',
          message: error.message
        }
      }
    }

    if (error instanceof ProfileSuspiciousActivityError) {
      return {
        success: false,
        error: {
          code: 'PROFILE_SUSPICIOUS_ACTIVITY',
          message: error.message
        }
      }
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: {
            field: error.field,
            value: error.value
          }
        }
      }
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Unhandled error in ProfileController:', error)

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: errorMessage
      }
    }
  }
}
