import { spawn } from 'cross-spawn'
import type { PackageManager } from './get-pkg-manager.js'

export function install(
  root: string,
  dependencies: string[] | null,
  { packageManager, isOnline }: { packageManager: PackageManager; isOnline: boolean }
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string
    let args: string[]

    if (dependencies && dependencies.length) {
      switch (packageManager) {
        case 'yarn':
          command = 'yarn'
          args = ['add', ...dependencies]
          break
        case 'pnpm':
          command = 'pnpm'
          args = ['add', ...dependencies]
          break
        case 'bun':
          command = 'bun'
          args = ['add', ...dependencies]
          break
        default:
          command = 'npm'
          args = ['install', ...dependencies]
          break
      }
    } else {
      switch (packageManager) {
        case 'yarn':
          command = 'yarn'
          args = isOnline ? [] : ['--offline']
          break
        case 'pnpm':
          command = 'pnpm'
          args = ['install']
          break
        case 'bun':
          command = 'bun'
          args = ['install']
          break
        default:
          command = 'npm'
          args = ['install']
          break
      }
    }

    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' },
      cwd: root,
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(' ')}` })
        return
      }
      resolve()
    })
  })
}
