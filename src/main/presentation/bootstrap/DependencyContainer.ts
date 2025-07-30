import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { DrizzleProfileRepository } from '../../infrastructure/repositories/DrizzleProfileRepository'
import { DrizzleConnection } from '../../infrastructure/database/DrizzleConnection'

import { CreateProfileUseCase } from '../../application/use-cases/CreateProfileUseCase'
import { GetProfileUseCase } from '../../application/use-cases/GetProfileUseCase'
import { ListProfilesUseCase } from '../../application/use-cases/ListProfilesUseCase'
import { UpdateProfileUseCase } from '../../application/use-cases/UpdateProfileUseCase'
import { DeleteProfileUseCase } from '../../application/use-cases/DeleteProfileUseCase'
import { ToggleProfileActiveUseCase } from '../../application/use-cases/ToggleProfileActiveUseCase'
import { ValidateProfileForPurchaseUseCase } from '../../application/use-cases/ValidateProfileForPurchaseUseCase'

import { ProfileController } from '../controllers/ProfileController'
import { ProfileIpcHandlers } from '../ipc/ProfileIpcHandlers'

export class DependencyContainer {
  private static instance: DependencyContainer
  private _profileRepository!: IProfileRepository
  private _profileController!: ProfileController
  private _profileIpcHandlers!: ProfileIpcHandlers

  private constructor() {
    // Initialize dependencies in correct order
    this.initializeInfrastructure()
    this.initializeApplication()
    this.initializePresentation()
  }

  static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer()
    }
    return DependencyContainer.instance
  }

  private initializeInfrastructure(): void {
    // Infrastructure layer - repositories
    this._profileRepository = new DrizzleProfileRepository()
  }

  private initializeApplication(): void {
    // Application layer - use cases
    const createProfileUseCase = new CreateProfileUseCase(this._profileRepository)
    const getProfileUseCase = new GetProfileUseCase(this._profileRepository)
    const listProfilesUseCase = new ListProfilesUseCase(this._profileRepository)
    const updateProfileUseCase = new UpdateProfileUseCase(this._profileRepository)
    const deleteProfileUseCase = new DeleteProfileUseCase(this._profileRepository)
    const toggleProfileActiveUseCase = new ToggleProfileActiveUseCase(this._profileRepository)
    const validateProfileForPurchaseUseCase = new ValidateProfileForPurchaseUseCase(
      this._profileRepository
    )

    // Presentation layer - controllers
    this._profileController = new ProfileController(
      createProfileUseCase,
      getProfileUseCase,
      listProfilesUseCase,
      updateProfileUseCase,
      deleteProfileUseCase,
      toggleProfileActiveUseCase,
      validateProfileForPurchaseUseCase
    )
  }

  private initializePresentation(): void {
    // Presentation layer - IPC handlers
    this._profileIpcHandlers = new ProfileIpcHandlers(this._profileController)
  }

  async initialize(): Promise<void> {
    // Initialize database connection
    try {
      console.log('Connecting to database...')
      const drizzleConnection = DrizzleConnection.getInstance()
      await drizzleConnection.connect()
      console.log('Database connected successfully')
    } catch (error) {
      console.error('Database connection failed:', error)
      console.error('This will cause "Database not connected" errors in the application')
      console.error('Continuing with IPC registration to allow app to show error state...')
      // Don't throw here - let the app start and show the error to the user
    }

    // Always register IPC handlers - app needs to function even with DB issues
    try {
      console.log('Registering IPC handlers...')
      this._profileIpcHandlers.register()
      console.log('IPC handlers registered successfully')
    } catch (error) {
      console.error('Failed to register IPC handlers:', error)
      throw error // This is critical - app can't function without IPC
    }
  }

  async cleanup(): Promise<void> {
    // Unregister IPC handlers
    this._profileIpcHandlers.unregister()

    // Close database connection
    const drizzleConnection = DrizzleConnection.getInstance()
    await drizzleConnection.disconnect()
  }

  // Getters for accessing dependencies (useful for testing)
  get profileRepository(): IProfileRepository {
    return this._profileRepository
  }

  get profileController(): ProfileController {
    return this._profileController
  }

  get profileIpcHandlers(): ProfileIpcHandlers {
    return this._profileIpcHandlers
  }
}
