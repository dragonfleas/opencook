import { IProfileRepository } from '../../domain/repositories/IProfileRepository'
import { ProfileId } from '../../domain/value-objects/ProfileId'
import { ProfileNotFoundError } from '../../domain/errors/ProfileErrors'

export interface ProfileValidationResult {
  isValid: boolean
  profileId: string
  profileName: string
  canPurchase: boolean
  cooldownRemaining: number
  errors: string[]
  warnings: string[]
}

export class ValidateProfileForPurchaseUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(profileId: string): Promise<ProfileValidationResult> {
    const id = ProfileId.create(profileId)
    const profile = await this.profileRepository.findById(id)

    if (!profile) {
      throw new ProfileNotFoundError(profileId)
    }

    const errors: string[] = []
    const warnings: string[] = []
    let canPurchase = true

    try {
      // Check if profile can make purchase (this validates all anti-scalping rules)
      profile.canMakePurchase()
    } catch (error) {
      canPurchase = false
      if (error instanceof Error) {
        errors.push(error.message)
      }
    }

    // Check for payment method expiry
    if (profile.paymentMethod.isExpired) {
      errors.push('Payment method has expired')
      canPurchase = false
    }

    // Add warnings for suspicious activity
    if (profile.isSuspicious) {
      warnings.push('Profile has suspicious purchase activity (high volume)')
    }

    // Add warning for cooldown
    const cooldownRemaining = profile.cooldownRemaining
    if (cooldownRemaining > 0) {
      warnings.push(
        `Purchase cooldown active: ${Math.ceil(cooldownRemaining / 60)} minutes remaining`
      )
    }

    return {
      isValid: errors.length === 0,
      profileId: profile.id.value,
      profileName: profile.name.value,
      canPurchase,
      cooldownRemaining,
      errors,
      warnings
    }
  }
}
