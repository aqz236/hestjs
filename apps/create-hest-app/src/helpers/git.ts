import spawn from 'cross-spawn'

export function tryGitInit(root: string): boolean {
  let didInit = false
  try {
    spawn.sync('git', ['--version'], { stdio: 'ignore' })
    if (isInGitRepository(root)) {
      return false
    }

    spawn.sync('git', ['init'], { stdio: 'ignore', cwd: root })
    didInit = true

    spawn.sync('git', ['checkout', '-b', 'main'], {
      stdio: 'ignore',
      cwd: root,
    })

    spawn.sync('git', ['add', '-A'], { stdio: 'ignore', cwd: root })
    spawn.sync(
      'git',
      ['commit', '-m', 'Initial commit from create-hest-app'],
      {
        stdio: 'ignore',
        cwd: root,
      }
    )
    return true
  } catch (e) {
    if (didInit) {
      try {
        spawn.sync('rm', ['-rf', '.git'], {
          stdio: 'ignore',
          cwd: root,
        })
      } catch {
        // ignore
      }
    }
    return false
  }
}

function isInGitRepository(root: string): boolean {
  try {
    spawn.sync('git', ['rev-parse', '--is-inside-work-tree'], {
      stdio: 'ignore',
      cwd: root,
    })
    return true
  } catch {
    return false
  }
}
