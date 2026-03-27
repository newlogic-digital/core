import fs from 'node:fs'
import path from 'node:path'
import { styleText } from 'node:util'
import { fileURLToPath } from 'node:url'
import { getPackageInfo } from 'vituum/utils/common.js'

const IS_WIN32 = process.platform === 'win32'
const { name } = getPackageInfo(new URL('../package.json', import.meta.url).href)
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const sourceSkillsDir = path.join(packageRoot, 'skills')
const projectRoot = process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD) : null

function isSameSymlinkTarget(targetPath, expectedSourcePath) {
  const currentTarget = fs.readlinkSync(targetPath)
  const resolvedTarget = path.resolve(path.dirname(targetPath), currentTarget)

  return resolvedTarget === expectedSourcePath
}

function getExistingTargetStat(targetPath) {
  try {
    return fs.lstatSync(targetPath)
  }
  catch (error) {
    if (error?.code === 'ENOENT') {
      return null
    }

    throw error
  }
}

function createDirectorySymlink(sourcePath, targetPath) {
  const symlinkTarget = IS_WIN32
    ? sourcePath
    : path.relative(path.dirname(targetPath), sourcePath)
  const symlinkType = IS_WIN32 ? 'junction' : 'dir'

  fs.symlinkSync(symlinkTarget, targetPath, symlinkType)
}

if (!projectRoot || projectRoot === packageRoot || !fs.existsSync(sourceSkillsDir)) {
  process.exit(0)
}

const targetAgentsDir = path.join(projectRoot, '.agents')
const targetSkillsDir = path.join(targetAgentsDir, 'skills')
const targetClaudeDir = path.join(projectRoot, '.claude')
const targetClaudeSkillsDir = path.join(targetClaudeDir, 'skills')
const skillEntries = fs.readdirSync(sourceSkillsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())

if (skillEntries.length === 0) {
  process.exit(0)
}

fs.mkdirSync(targetSkillsDir, { recursive: true })

let linkedCount = 0
let linkedClaudeSkillsDir = false

for (const entry of skillEntries) {
  const sourcePath = path.join(sourceSkillsDir, entry.name)
  const targetPath = path.join(targetSkillsDir, entry.name)
  const targetStat = getExistingTargetStat(targetPath)

  if (targetStat) {
    if (!targetStat.isSymbolicLink()) {
      console.warn(`${styleText(['cyan', 'bold'], name)} ${styleText('yellow', `Skipping skill "${entry.name}" because "${targetPath}" already exists and is not a symlink.`)}`)
      continue
    }

    if (isSameSymlinkTarget(targetPath, sourcePath)) {
      continue
    }

    fs.unlinkSync(targetPath)
  }

  createDirectorySymlink(sourcePath, targetPath)
  linkedCount += 1
}

const claudeStat = getExistingTargetStat(targetClaudeDir)
let shouldLinkClaudeSkillsDir = true

if (claudeStat?.isSymbolicLink()) {
  console.warn(`${styleText(['cyan', 'bold'], name)} ${styleText('yellow', `Skipping "${targetClaudeSkillsDir}" because "${targetClaudeDir}" already exists as a symlink. Remove "${targetClaudeDir}" and run the command again.`)}`)
  shouldLinkClaudeSkillsDir = false
}

if (shouldLinkClaudeSkillsDir) {
  fs.mkdirSync(targetClaudeDir, { recursive: true })

  const claudeSkillsStat = getExistingTargetStat(targetClaudeSkillsDir)

  if (claudeSkillsStat) {
    if (!claudeSkillsStat.isSymbolicLink()) {
      console.warn(`${styleText(['cyan', 'bold'], name)} ${styleText('yellow', `Skipping "${targetClaudeSkillsDir}" because it already exists and is not a symlink.`)}`)
    }
    else if (!isSameSymlinkTarget(targetClaudeSkillsDir, targetSkillsDir)) {
      fs.unlinkSync(targetClaudeSkillsDir)
      createDirectorySymlink(targetSkillsDir, targetClaudeSkillsDir)
      linkedClaudeSkillsDir = true
    }
  }
  else {
    createDirectorySymlink(targetSkillsDir, targetClaudeSkillsDir)
    linkedClaudeSkillsDir = true
  }
}

if (linkedCount > 0) {
  console.info(`${styleText(['cyan', 'bold'], name)} ${styleText('green', `Linked ${linkedCount} skill${linkedCount === 1 ? '' : 's'} into "${targetSkillsDir}".`)}`)
}

if (linkedClaudeSkillsDir) {
  console.info(`${styleText(['cyan', 'bold'], name)} ${styleText('green', `Linked "${targetClaudeSkillsDir}" to "${targetSkillsDir}".`)}`)
}
