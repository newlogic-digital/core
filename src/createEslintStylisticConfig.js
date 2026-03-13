import stylistic from '@stylistic/eslint-plugin'
import fs from 'node:fs'

fs.writeFileSync('../eslint-stylistic.json', JSON.stringify({
  rules: {
    ...stylistic.configs.recommended.rules,
  },
  jsPlugins: [
    '@stylistic/eslint-plugin',
  ],
}, null, 2))
