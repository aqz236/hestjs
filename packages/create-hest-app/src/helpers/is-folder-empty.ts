import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { red } from 'picocolors'

export function isFolderEmpty(root: string, name: string): boolean {
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'LICENSE',
    'Thumbs.db',
    'docs',
    'mkdocs.yml',
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
    'yarnrc.yml',
    '.yarn',
  ]

  const conflicts = readdirSync(root).filter(
    (file) => !validFiles.includes(file)
  )

  if (conflicts.length > 0) {
    console.log(
      `The directory ${red(name)} contains files that could conflict:`
    )
    console.log()
    for (const file of conflicts) {
      try {
        const stats = readdirSync(join(root, file))
        if (stats.length > 0) {
          console.log(`  ${red(file)}/`)
        } else {
          console.log(`  ${red(file)}`)
        }
      } catch {
        console.log(`  ${red(file)}`)
      }
    }
    console.log()
    console.log(
      'Either try using a new directory name, or remove the files listed above.'
    )
    console.log()
    return false
  }

  return true
}
