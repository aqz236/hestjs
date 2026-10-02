#!/usr/bin/env node

import { Command } from 'commander'
import Conf from 'conf'
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { bold, cyan, green, red, yellow } from 'picocolors'
import updateCheck from 'update-check'
import { createApp, DownloadError } from './create-app.js'
import { getPkgManager } from './helpers/get-pkg-manager.js'
import { isFolderEmpty } from './helpers/is-folder-empty.js'
import { validateNpmName } from './helpers/validate-pkg.js'
import { promptForProjectName, promptForOptions, promptForRetry, promptForAlternativeTemplate } from './prompts/index.js'
import type { CreateOptions, PackageManager } from './types.js'

const packageJson = {
  name: 'create-hest-app',
  version: '0.1.0'
}

const handleSigTerm = () => process.exit(0)
process.on('SIGINT', handleSigTerm)
process.on('SIGTERM', handleSigTerm)

const program = new Command(packageJson.name)
  .version(packageJson.version, '-v, --version', 'Output the current version of create-hest-app.')
  .argument('[project-directory]')
  .usage('[project-directory] [options]')
  .helpOption('-h, --help', 'Display this help message.')
  .option('--eslint', 'Initialize with ESLint config.')
  .option('--no-eslint', 'Skip ESLint configuration.')
  .option('--use-npm', 'Explicitly tell the CLI to bootstrap the application using npm.')
  .option('--use-pnpm', 'Explicitly tell the CLI to bootstrap the application using pnpm.')
  .option('--use-yarn', 'Explicitly tell the CLI to bootstrap the application using Yarn.')
  .option('--use-bun', 'Explicitly tell the CLI to bootstrap the application using Bun.')
  .option('--skip-install', 'Explicitly tell the CLI to skip installing packages.')
  .option('--template <template-name>', 'Specify the template to use (base, cqrs).')
  .allowUnknownOption()
  .parse(process.argv)

const run = async (): Promise<void> => {
  const conf = new Conf({ projectName: 'create-hest-app' })

  if (program.opts().resetPreferences) {
    conf.clear()
    console.log(`${green('✓')} Preferences reset successfully`)
    return
  }

  // Get project path
  let resolvedProjectPath = program.args[0]
  if (!resolvedProjectPath) {
    resolvedProjectPath = await promptForProjectName()
  }

  if (typeof resolvedProjectPath === 'string') {
    resolvedProjectPath = resolvedProjectPath.trim()
  }

  // Validate project name
  const resolvedProjectName = basename(resolve(resolvedProjectPath))
  const validation = validateNpmName(resolvedProjectName)

  if (!validation.valid) {
    console.error(`Could not create a project called ${red(`"${resolvedProjectName}"`)} because of npm naming restrictions:`)
    validation.problems!.forEach((p: string) => console.error(`    ${red(bold('*'))} ${p}`))
    process.exit(1)
  }

  // Check if folder exists and is empty
  const root = resolve(resolvedProjectPath)
  const appName = basename(root)
  const folderExists = existsSync(root)

  if (folderExists && !isFolderEmpty(root, appName)) {
    process.exit(1)
  }

  // Get preferences and defaults
  const preferences = (conf.get('preferences') || {}) as Record<string, unknown>
  const defaults: CreateOptions = {
    eslint: true,
    skipInstall: false,
    template: 'base',
    useSwagger: false,
    packageManager: getPkgManager()
  }

  const getPrefOrDefault = (field: string) => preferences[field] ?? defaults[field as keyof CreateOptions]

  // Get user preferences from prompts or CLI options
  let userOptions: Partial<CreateOptions> = {}

  const hasCliOptions = program.opts().eslint !== undefined || 
                       program.opts().template || 
                       program.opts().useNpm || 
                       program.opts().usePnpm || 
                       program.opts().useYarn || 
                       program.opts().useBun

  if (!hasCliOptions) {
    userOptions = await promptForOptions({
      ...defaults,
      eslint: getPrefOrDefault('eslint') as boolean,
      template: getPrefOrDefault('template') as string,
      useSwagger: getPrefOrDefault('useSwagger') as boolean,
      packageManager: getPrefOrDefault('packageManager') as string
    })
  }

  // Merge CLI options with user choices
  const finalOptions = {
    eslint: program.opts().eslint ?? userOptions.eslint ?? defaults.eslint,
    skipInstall: program.opts().skipInstall ?? userOptions.skipInstall ?? defaults.skipInstall,
    template: program.opts().template ?? userOptions.template ?? defaults.template,
    useSwagger: userOptions.useSwagger ?? defaults.useSwagger,
    packageManager: (() => {
      if (program.opts().useNpm) return 'npm'
      if (program.opts().usePnpm) return 'pnpm'
      if (program.opts().useYarn) return 'yarn'
      if (program.opts().useBun) return 'bun'
      return userOptions.packageManager ?? defaults.packageManager
    })()
  }

  // Update preferences
  Object.assign(preferences, userOptions)
  conf.set('preferences', preferences)

  try {
    await createApp({
      appPath: resolvedProjectPath,
      packageManager: finalOptions.packageManager as PackageManager,
      eslint: finalOptions.eslint,
      skipInstall: finalOptions.skipInstall,
      template: finalOptions.template,
      useSwagger: finalOptions.useSwagger
    })
  } catch (reason) {
    if (!(reason instanceof DownloadError)) {
      throw reason
    }

    const shouldRetry = await promptForRetry(finalOptions.template)
    if (!shouldRetry) process.exit(0)

    const alternativeTemplate = await promptForAlternativeTemplate()
    await createApp({
      appPath: resolvedProjectPath,
      packageManager: finalOptions.packageManager as PackageManager,
      eslint: finalOptions.eslint,
      skipInstall: finalOptions.skipInstall,
      template: alternativeTemplate,
      useSwagger: finalOptions.useSwagger
    })
  }
}

// Update check and notification
const update = updateCheck({
  pkg: packageJson,
  updateCheckUrl: 'https://registry.npmjs.org/create-hest-app/latest'
}).catch(() => null)

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update
    if (res?.latest) {
      const pkgManager = getPkgManager()
      const updateMessage = pkgManager === 'yarn'
        ? 'yarn global add create-hest-app'
        : pkgManager === 'pnpm'
        ? 'pnpm add -g create-hest-app'
        : pkgManager === 'bun'
        ? 'bun add -g create-hest-app'
        : 'npm i -g create-hest-app'

      console.log(
        yellow(bold('A new version of `create-hest-app` is available!')) +
        '\n' + 'You can update by running: ' + cyan(updateMessage) + '\n'
      )
    }
    process.exit()
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log()
    console.log('Aborting installation.')
    if (reason.command) {
      console.log(`  ${cyan(reason.command)} has failed.`)
    } else {
      console.log(red('Unexpected error. Please report it as a bug:') + '\n', reason)
    }
    console.log()
    await notifyUpdate()
    process.exit(1)
  })
