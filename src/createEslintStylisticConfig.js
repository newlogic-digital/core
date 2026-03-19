import stylistic from '@stylistic/eslint-plugin'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(scriptDir, '..', 'eslint-stylistic.json')

fs.writeFileSync(outputPath, JSON.stringify({
  rules: {
    ...stylistic.configs.recommended.rules,
  },
  jsPlugins: [
    '@stylistic/eslint-plugin',
  ],
}, null, 2))
