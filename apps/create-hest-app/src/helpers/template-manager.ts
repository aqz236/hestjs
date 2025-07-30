import * as fs from 'fs-extra'
import * as path from 'path'
import { cyan } from 'picocolors'

export class TemplateManager {
  private static getTemplatePath(templateName: string): string {
    const currentDir = import.meta.url.startsWith('file:') 
      ? path.dirname(new URL(import.meta.url).pathname)
      : __dirname
    return path.join(currentDir, '..', 'templates', templateName)
  }

  static async copyTemplate(
    root: string, 
    template: string, 
    useSwagger: boolean,
    eslint: boolean
  ): Promise<void> {
    const templateName = useSwagger ? `${template}_scalar` : template
    const templatePath = this.getTemplatePath(templateName)
    
    try {
      console.log(`Using template: ${cyan(template)}${useSwagger ? ' with Swagger/Scalar documentation' : ''}`)
      if (useSwagger) {
        console.log(`${cyan('Note:')} Swagger/Scalar will increase build size by approximately 12MB`)
      }
      console.log(`Copying files from template...`)
      console.log()
      
      // Check if template exists
      if (!await fs.pathExists(templatePath)) {
        throw new Error(`Template "${templateName}" not found at ${templatePath}`)
      }
      
      // Copy all files except node_modules, dist, and .git
      await fs.copy(templatePath, root, {
        filter: (src) => {
          const basename = path.basename(src)
          const relativePath = path.relative(templatePath, src)
          
          // Skip these directories and files
          const skipPatterns = [
            'node_modules',
            'dist',
            '.git',
            '.turbo',
            '.next',
            'coverage',
            '.nyc_output',
            '.DS_Store'
          ]
          
          // Skip ESLint files if ESLint is not wanted
          if (!eslint && (basename === 'eslint.config.js' || basename === 'eslint.config.ts' || basename === '.eslintrc.json')) {
            return false
          }
          
          return !skipPatterns.some(pattern => 
            basename === pattern || relativePath.startsWith(pattern + path.sep)
          )
        }
      })
      
      console.log('Template files copied successfully!')
      console.log()
    } catch (error) {
      throw new Error(`Failed to copy template: ${error}`)
    }
  }

  static async updatePackageJson(root: string, appName: string, eslint: boolean): Promise<void> {
    const packageJsonPath = path.join(root, 'package.json')
    
    try {
      const packageJson = await fs.readJson(packageJsonPath)
      
      // Update name and reset version
      packageJson.name = appName
      packageJson.version = '0.1.0'
      packageJson.description = `A HestJS application`
      
      // Remove specific repository information
      delete packageJson.repository
      delete packageJson.homepage
      delete packageJson.bugs
      
      // Remove ESLint dependencies if not wanted
      if (!eslint && packageJson.devDependencies) {
        const eslintPackages = Object.keys(packageJson.devDependencies).filter(pkg => 
          pkg.includes('eslint') || pkg.includes('@hestjs/eslint-config')
        )
        eslintPackages.forEach(pkg => {
          delete packageJson.devDependencies[pkg]
        })
      }
      
      // Write updated package.json
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
      
      console.log(`Updated ${cyan('package.json')} with new app name: ${cyan(appName)}`)
      console.log()
    } catch (error) {
      console.warn(`Warning: Could not update package.json: ${error}`)
    }
  }

  static getAvailableTemplates(): string[] {
    return ['base', 'cqrs']
  }

  static async validateTemplate(template: string, useSwagger: boolean): Promise<boolean> {
    const templateName = useSwagger ? `${template}_scalar` : template
    const templatePath = this.getTemplatePath(templateName)
    return await fs.pathExists(templatePath)
  }
}
