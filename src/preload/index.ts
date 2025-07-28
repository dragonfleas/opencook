import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
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

// Profile API exposed to renderer
const profileApi = {
  create: (dto: CreateProfileDto): Promise<IpcResponse<ProfileResponseDto>> =>
    ipcRenderer.invoke('profile:create', dto),

  get: (profileId: string): Promise<IpcResponse<ProfileResponseDto>> =>
    ipcRenderer.invoke('profile:get', profileId),

  list: (activeOnly?: boolean): Promise<IpcResponse<ProfileListResponseDto>> =>
    ipcRenderer.invoke('profile:list', activeOnly),

  update: (dto: UpdateProfileDto): Promise<IpcResponse<ProfileResponseDto>> =>
    ipcRenderer.invoke('profile:update', dto),

  delete: (profileId: string): Promise<IpcResponse<void>> =>
    ipcRenderer.invoke('profile:delete', profileId),

  toggleActive: (profileId: string, isActive: boolean): Promise<IpcResponse<ProfileResponseDto>> =>
    ipcRenderer.invoke('profile:toggle-active', profileId, isActive),

  validateForPurchase: (profileId: string): Promise<IpcResponse<ProfileValidationResult>> =>
    ipcRenderer.invoke('profile:validate-for-purchase', profileId)
}

// Custom APIs for renderer
const api = {
  profile: profileApi
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
