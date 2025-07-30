import { mkdirSync } from 'node:fs'
import * as path from 'path'
import { cyan, green } from 'picocolors'
import type { CreateAppOptions } from './types.js'
import { install } from './helpers/install.js'
import { isFolderEmpty } from './helpers/is-folder-empty.js'
import { tryGitInit } from './helpers/git.js'
import { TemplateManager } from './helpers/template-manager.js'

export class DownloadError extends Error {}

export async function createApp({
  appPath,
  packageManager,
  eslint,
  skipInstall,
  template,
  useSwagger
}: CreateAppOptions): Promise<void> {
  const root = path.resolve(appPath)
  const appName = path.basename(root)

  // Create the app directory
  mkdirSync(root, { recursive: true })
  if (!isFolderEmpty(root, appName)) {
    process.exit(1)
  }

  const originalDirectory = process.cwd()
  console.log(`Creating a new HestJS app in ${green(root)}.`)
  console.log()

  process.chdir(root)

  try {
    // Validate template exists
    if (!await TemplateManager.validateTemplate(template, useSwagger)) {
      throw new Error(`Template "${template}${useSwagger ? ' with Swagger' : ''}" not found`)
    }

    // Copy template files
    await TemplateManager.copyTemplate(root, template, useSwagger, eslint)
    
    // Update package.json with the new app name and ESLint preferences
    await TemplateManager.updatePackageJson(root, appName, eslint)
    
    // Install dependencies if not skipped
    if (!skipInstall) {
      console.log('Installing dependencies...')
      console.log()
      
      await install(root, null, { 
        packageManager, 
        isOnline: true 
      })
      
      console.log()
    }

    // Initialize git repository
    if (tryGitInit(root)) {
      console.log('Initialized a git repository.')
      console.log()
    }

    // Success message
    const cdpath = path.join(originalDirectory, appName) === appPath ? appName : appPath

    console.log(`${green('Success!')} Created ${appName} at ${appPath}`)
    console.log('Inside that directory, you can run several commands:')
    console.log()
    console.log(cyan(`  ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`))
    console.log('    Starts the development server.')
    console.log()
    console.log(cyan(`  ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}build`))
    console.log('    Builds the app for production.')
    console.log()
    console.log(cyan(`  ${packageManager} ${packageManager === 'npm' ? 'run ' : ''}start`))
    console.log('    Runs the built app in production mode.')
    console.log()
    
    if (skipInstall) {
      console.log('Dependencies were not installed. To install them, run:')
      console.log()
      console.log(cyan('  cd'), cdpath)
      console.log(`  ${cyan(`${packageManager} install`)}`)
      console.log()
      console.log('Then start the development server:')
      console.log()
      console.log(`  ${cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`)}`)
    } else {
      console.log('We suggest that you begin by typing:')
      console.log()
      console.log(cyan('  cd'), cdpath)
      console.log(`  ${cyan(`${packageManager} ${packageManager === 'npm' ? 'run ' : ''}dev`)}`)
    }
    console.log()
  } catch (reason) {
    throw new DownloadError(`Failed to create app: ${reason}`)
  }
}
