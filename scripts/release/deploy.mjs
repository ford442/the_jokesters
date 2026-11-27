import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
const allowedArgs = new Set(['--dry-run', '--verify'])

if (args.some((arg) => !allowedArgs.has(arg))) {
  console.error('Supported arguments: --dry-run, --verify')
  process.exit(2)
}

const env = {
  ...process.env,
  VITE_APP_BASE_PATH: process.env.VITE_APP_BASE_PATH || '/the-jokesters-staging/',
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { cwd: repoRoot, env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(npm, ['run', 'build'])
run(process.env.PYTHON || 'python3', ['scripts/deploy_dist.py', ...args])
