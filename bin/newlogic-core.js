#!/usr/bin/env node

import { styleText } from 'node:util'
import { getPackageInfo } from 'vituum/utils/common.js'

const { name } = getPackageInfo(new URL('../package.json', import.meta.url).href)
const [command] = process.argv.slice(2)

if (command === 'postinstall') {
  await import('../src/createEslintStylisticConfig.js')
  await import('../src/linkAgentSkills.js')
}
else {
  console.error(`${styleText(['cyan', 'bold'], name)} ${styleText('red', `Unknown command "${command ?? ''}".`)}`)
  process.exitCode = 1
}
