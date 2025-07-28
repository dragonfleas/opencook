import { Profile } from '../entities/Profile'
import { ProfileId } from '../value-objects/ProfileId'
import { ProfileName } from '../value-objects/ProfileName'

/**
 * Repository interface for managing Profile persistence operations.
 *
 * This interface defines the contract for Profile data access operations,
 * following the repository pattern to decouple domain logic from data
 * storage implementation details.
 *
 * @example
 * ```typescript
 * class SqliteProfileRepository implements IProfileRepository {
 *   async save(profile: Profile): Promise<void> {
 *     // Implementation for SQLite storage
 *   }
 *   // ... other methods
 * }
 * ```
 *
 * @since 1.0.0
 */
export interface IProfileRepository {
  /**
   * Persists a profile to the repository.
   *
   * If the profile already exists (based on ID), it will be updated.
   * Otherwise, a new profile record will be created.
   *
   * @param profile - The profile entity to save
   * @returns Promise that resolves when the save operation completes
   *
   * @throws {RepositoryError} When persistence operation fails
   */
  save(profile: Profile): Promise<void>

  /**
   * Retrieves a profile by its unique identifier.
   *
   * @param id - The unique profile identifier
   * @returns Promise that resolves to the profile if found, null otherwise
   *
   * @throws {RepositoryError} When retrieval operation fails
   */
  findById(id: ProfileId): Promise<Profile | null>

  /**
   * Retrieves a profile by its name.
   *
   * Profile names are unique within the system, so this method returns
   * at most one profile.
   *
   * @param name - The profile name to search for
   * @returns Promise that resolves to the profile if found, null otherwise
   *
   * @throws {RepositoryError} When retrieval operation fails
   */
  findByName(name: ProfileName): Promise<Profile | null>

  /**
   * Retrieves all profiles in the repository.
   *
   * @returns Promise that resolves to an array of all profiles
   *
   * @throws {RepositoryError} When retrieval operation fails
   */
  findAll(): Promise<Profile[]>

  /**
   * Retrieves only profiles that are currently active.
   *
   * @returns Promise that resolves to an array of active profiles only
   *
   * @throws {RepositoryError} When retrieval operation fails
   */
  findActive(): Promise<Profile[]>

  /**
   * Permanently removes a profile from the repository.
   *
   * @param id - The unique identifier of the profile to delete
   * @returns Promise that resolves when the delete operation completes
   *
   * @throws {RepositoryError} When deletion operation fails
   */
  delete(id: ProfileId): Promise<void>

  /**
   * Checks whether a profile exists with the given ID.
   *
   * @param id - The unique profile identifier to check
   * @returns Promise that resolves to true if profile exists, false otherwise
   *
   * @throws {RepositoryError} When existence check fails
   */
  exists(id: ProfileId): Promise<boolean>

  /**
   * Checks whether a profile exists with the given name.
   *
   * Since profile names must be unique, this is useful for preventing
   * duplicate name violations before creating new profiles.
   *
   * @param name - The profile name to check for existence
   * @returns Promise that resolves to true if profile with name exists, false otherwise
   *
   * @throws {RepositoryError} When existence check fails
   */
  existsByName(name: ProfileName): Promise<boolean>

  /**
   * Counts the total number of profiles in the repository.
   *
   * @returns Promise that resolves to the total profile count
   *
   * @throws {RepositoryError} When count operation fails
   */
  count(): Promise<number>

  /**
   * Counts only the active profiles in the repository.
   *
   * @returns Promise that resolves to the active profile count
   *
   * @throws {RepositoryError} When count operation fails
   */
  countActive(): Promise<number>
}
