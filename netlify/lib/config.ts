// Thrown when a required environment variable is missing or unusable.
// It holds only the variable's NAME (never its value), so serverError()
// can safely log which setting to fix.
export class ConfigError extends Error {
  readonly variable: string

  constructor(variable: string, problem = 'is not set') {
    super(`${variable} ${problem}`)
    this.name = 'ConfigError'
    this.variable = variable
  }
}
