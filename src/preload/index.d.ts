import { ElectronAPI } from '@electron-toolkit/preload'
import {
  CreateProfileDto,
  UpdateProfileDto,
  ProfileResponseDto,
  ProfileListResponseDto
} from '../main/application/dto/ProfileDto'
import type { ProfileValidationResult } from '../main/application/use-cases/ValidateProfileForPurchaseUseCase'

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

interface ProfileApi {
  create: (dto: CreateProfileDto) => Promise<IpcResponse<ProfileResponseDto>>
  get: (profileId: string) => Promise<IpcResponse<ProfileResponseDto>>
  list: (activeOnly?: boolean) => Promise<IpcResponse<ProfileListResponseDto>>
  update: (dto: UpdateProfileDto) => Promise<IpcResponse<ProfileResponseDto>>
  delete: (profileId: string) => Promise<IpcResponse<void>>
  toggleActive: (profileId: string, isActive: boolean) => Promise<IpcResponse<ProfileResponseDto>>
  validateForPurchase: (profileId: string) => Promise<IpcResponse<ProfileValidationResult>>
}

interface API {
  profile: ProfileApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
