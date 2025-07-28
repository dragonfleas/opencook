export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class InvalidProfileError extends DomainError {
  constructor(
    public readonly field: string,
    public readonly reason: string
  ) {
    super(`Invalid profile: ${field} - ${reason}`)
  }
}

export class ProfileLimitExceededError extends DomainError {
  constructor(
    public readonly currentCount: number,
    public readonly maxLimit: number
  ) {
    super(`Profile limit exceeded. Current: ${currentCount}, Maximum: ${maxLimit}`)
  }
}

export class MaxProfilesExceededError extends DomainError {
  constructor(
    public readonly currentCount: number,
    public readonly maxLimit: number
  ) {
    super(`Maximum profiles exceeded. Current: ${currentCount}, Maximum: ${maxLimit}`)
  }
}

export class DuplicateProfileError extends DomainError {
  constructor(public readonly profileName: string) {
    super(`Profile with name "${profileName}" already exists`)
  }
}

export class ProfileNotFoundError extends DomainError {
  constructor(public readonly profileId: string) {
    super(`Profile with ID "${profileId}" not found`)
  }
}

export class ProfileInactiveError extends DomainError {
  constructor(public readonly profileId: string) {
    super(`Profile with ID "${profileId}" is inactive`)
  }
}

export class PurchaseCooldownError extends DomainError {
  constructor(public readonly remainingTime: number) {
    super(`Purchase cooldown active. Please wait ${remainingTime} seconds before next purchase`)
  }
}

export class ProfileCooldownError extends DomainError {
  constructor(public readonly remainingTime: number) {
    super(`Profile cooldown active. Please wait ${remainingTime} seconds before next purchase`)
  }
}

export class ProfilePurchaseLimitError extends DomainError {
  constructor(public readonly profileId: string) {
    super(`Profile with ID "${profileId}" has reached daily purchase limit`)
  }
}

export class ProfileSuspiciousActivityError extends DomainError {
  constructor(public readonly profileId: string) {
    super(`Profile with ID "${profileId}" has suspicious activity and is temporarily restricted`)
  }
}

export class InvalidAddressError extends DomainError {
  constructor(
    public readonly field: string,
    public readonly reason: string
  ) {
    super(`Invalid address: ${field} - ${reason}`)
  }
}

export class InvalidPaymentMethodError extends DomainError {
  constructor(public readonly reason: string) {
    super(`Invalid payment method: ${reason}`)
  }
}
