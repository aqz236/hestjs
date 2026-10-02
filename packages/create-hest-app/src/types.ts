export interface CreateOptions {
  eslint: boolean
  skipInstall: boolean
  template: string
  useSwagger: boolean
  packageManager: string
}

export interface ValidationResult {
  valid: boolean
  problems?: string[]
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

export interface TemplateChoice {
  name: string
  value: string
}

export interface CreateAppOptions {
  appPath: string
  packageManager: PackageManager
  eslint: boolean
  skipInstall: boolean
  template: string
  useSwagger: boolean
}
