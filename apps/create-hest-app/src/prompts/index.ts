import inquirer from 'inquirer'
import type { CreateOptions, PackageManager, TemplateChoice } from '../types.js'

export const TEMPLATE_CHOICES: TemplateChoice[] = [
  {
    name: 'Base - A simple HestJS application with basic features',
    value: 'base'
  },
  {
    name: 'CQRS - Complete application with CQRS pattern implementation',
    value: 'cqrs'
  }
]

export const PACKAGE_MANAGER_CHOICES = [
  { name: 'npm', value: 'npm' },
  { name: 'yarn', value: 'yarn' },
  { name: 'pnpm', value: 'pnpm' },
  { name: 'bun', value: 'bun' }
]

export async function promptForProjectName(): Promise<string> {
  const { projectPath } = await inquirer.prompt<{ projectPath: string }>({
    type: 'input',
    name: 'projectPath',
    message: 'What is your project named?',
    default: 'my-hest-app'
  })
  return projectPath
}

export async function promptForOptions(defaults: CreateOptions): Promise<Partial<CreateOptions>> {
  const options: Partial<CreateOptions> = {}

  // ESLint
  const { eslint } = await inquirer.prompt<{ eslint: boolean }>({
    type: 'confirm',
    name: 'eslint',
    message: 'Would you like to use ESLint?',
    default: defaults.eslint
  })
  options.eslint = eslint

  // Template
  const { template } = await inquirer.prompt<{ template: string }>({
    type: 'list',
    name: 'template',
    message: 'Which template would you like to use?',
    choices: TEMPLATE_CHOICES,
    default: defaults.template
  })
  options.template = template

  // Swagger/Scalar
  const { useSwagger } = await inquirer.prompt<{ useSwagger: boolean }>({
    type: 'confirm',
    name: 'useSwagger',
    message: 'Would you like to include Swagger/Scalar API documentation? (adds ~12MB to build size)',
    default: defaults.useSwagger
  })
  options.useSwagger = useSwagger

  // Package Manager
  const { packageManager } = await inquirer.prompt<{ packageManager: PackageManager }>({
    type: 'list',
    name: 'packageManager',
    message: 'Which package manager would you like to use?',
    choices: PACKAGE_MANAGER_CHOICES,
    default: defaults.packageManager
  })
  options.packageManager = packageManager

  // Install dependencies
  const { skipInstall } = await inquirer.prompt<{ skipInstall: boolean }>({
    type: 'confirm',
    name: 'skipInstall',
    message: 'Skip installing dependencies?',
    default: false
  })
  options.skipInstall = skipInstall

  return options
}

export async function promptForRetry(example: string): Promise<boolean> {
  const { retry } = await inquirer.prompt<{ retry: boolean }>({
    type: 'confirm',
    name: 'retry',
    message: `Could not download "${example}" because of a connectivity issue.\nDo you want to try a different template?`,
    default: true
  })
  return retry
}

export async function promptForAlternativeTemplate(): Promise<string> {
  const { alternativeExample } = await inquirer.prompt<{ alternativeExample: string }>({
    type: 'input',
    name: 'alternativeExample',
    message: 'Please specify an alternative template:'
  })
  return alternativeExample
}
