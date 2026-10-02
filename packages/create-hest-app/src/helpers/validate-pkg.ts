import validateProjectName from 'validate-npm-package-name'

export interface ValidationResult {
  valid: boolean
  problems?: string[]
}

export function validateNpmName(name: string): ValidationResult {
  const nameValidation = validateProjectName(name)
  if (nameValidation.validForNewPackages) {
    return { valid: true }
  }

  return {
    valid: false,
    problems: [
      ...(nameValidation.errors || []),
      ...(nameValidation.warnings || []),
    ],
  }
}
