import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * @param {string} rule
 * @returns {string | null}
 */
const unicodeRangeSubset = (rule) => {
  // toUpperCase kvůli minifikátorům, které zápis normalizují na lowercase (Lightning CSS ve Vite 8)
  const range = (rule.match(/unicode-range:([^;}]+)/i)?.[1] ?? '').toUpperCase()

  if (range.includes('U+0000-00FF')) return 'latin'
  if (range.includes('U+0102-')) return 'vietnamese'
  if (range.includes('U+0100-')) return 'latin-ext'
  if (range.includes('U+0400-045F')) return 'cyrillic'
  if (range.includes('U+0460-052F')) return 'cyrillic-ext'
  if (range.includes('U+1F00-1FFF')) return 'greek-ext'
  if (range.includes('U+0370-')) return 'greek'

  return null
}

/**
 * Doplní cesty fontů do manifest.json (entry.assets + entry.fonts se subsetem),
 * aby šly z PHP poslat jako Link hlavičky jen pro subsety daného jazyka
 *
 * @param {string[]} [families] - font families, které se mají includovat do manifestu (undefined = všechny)
 * @returns {import('vite').Plugin}
 */
export const fontsManifest = families => ({
  name: '@newlogic-digital/core:fonts-manifest',
  apply: 'build',
  async writeBundle(options, bundle) {
    const manifestPath = join(options.dir ?? '', 'manifest.json')
    const manifest = await readFile(manifestPath, 'utf8').then(JSON.parse).catch(() => null)

    if (!manifest) return

    let hasFonts = false

    for (const entry of Object.values(manifest)) {
      const asset = bundle[entry.file]

      if (!entry.file?.endsWith('.css') || asset?.type !== 'asset') continue

      const fonts = [...asset.source.toString().matchAll(/@font-face\s*\{[^}]*\}/g)]
        .filter(([rule]) => !/font-style:\s*(italic|oblique)/.test(rule))
        .map(([rule]) => ({
          family: rule.match(/font-family:\s*(['"]?)([^;'"}]+)\1/)?.[2],
          file: rule.match(/url\((['"]?)([^)'"]+)\1\)/)?.[2]?.replace(/^\//, ''),
          subset: unicodeRangeSubset(rule),
        }))
        .filter(font => font.file && (!families || (font.family && families.includes(font.family))))

      if (fonts.length === 0) continue

      entry.assets = [...new Set([...entry.assets ?? [], ...fonts.map(font => font.file)])]
      // rodina → subset → pole souborů; umožňuje preloadovat jen vybrané rodiny a subsety
      entry.fonts = fonts.reduce((acc, font) => {
        if (font.family && font.subset) ((acc[font.family] ??= {})[font.subset] ??= []).push(font.file)
        return acc
      }, {})
      hasFonts = true
    }

    if (hasFonts) {
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }
  },
})
