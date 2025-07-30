import type {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
  ProfileListResponseDto,
  ProfileValidationResult,
  IpcResponse
} from '@/types/profile'

export class ProfileAPI {
  static async create(dto: CreateProfileDto): Promise<IpcResponse<ProfileResponseDto>> {
    return window.api.profile.create(dto)
  }

  static async get(profileId: string): Promise<IpcResponse<ProfileResponseDto>> {
    return window.api.profile.get(profileId)
  }

  static async list(activeOnly?: boolean): Promise<IpcResponse<ProfileListResponseDto>> {
    return window.api.profile.list(activeOnly)
  }

  static async update(dto: UpdateProfileDto): Promise<IpcResponse<ProfileResponseDto>> {
    return window.api.profile.update(dto)
  }

  static async delete(profileId: string): Promise<IpcResponse<void>> {
    return window.api.profile.delete(profileId)
  }

  static async toggleActive(
    profileId: string,
    isActive: boolean
  ): Promise<IpcResponse<ProfileResponseDto>> {
    return window.api.profile.toggleActive(profileId, isActive)
  }

  static async validateForPurchase(
    profileId: string
  ): Promise<IpcResponse<ProfileValidationResult>> {
    return window.api.profile.validateForPurchase(profileId)
  }
}
