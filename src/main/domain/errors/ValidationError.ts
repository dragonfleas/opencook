export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ValidationError extends DomainError {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    message: string
  ) {
    super(message)
  }
}
