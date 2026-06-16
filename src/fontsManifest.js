import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Parsuje unicode-range na číselné intervaly [start, end] - minifikátory zápis normalizují
 * (Lightning CSS ve Vite 8 stripuje nuly a používá wildcardy, např. U+0000-00FF → U+??)
 *
 * @param {string} rule
 * @returns {[number, number][]}
 */
const parseUnicodeRange = (rule) => {
  const range = (rule.match(/unicode-range:([^;}]+)/i)?.[1] ?? '').toUpperCase()

  return range.split(',').flatMap((token) => {
    const match = token.trim().match(/^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/)

    if (!match) return []
    if (match[1].includes('?')) {
      return [[parseInt(match[1].replace(/\?/g, '0'), 16), parseInt(match[1].replace(/\?/g, 'F'), 16)]]
    }

    return [[parseInt(match[1], 16), parseInt(match[2] ?? match[1], 16)]]
  })
}

/**
 * @param {string} rule
 * @returns {string | null}
 */
const unicodeRangeSubset = (rule) => {
  const ranges = parseUnicodeRange(rule)

  /**
   * @param {number} start
   * @param {number} [end]
   */
  const has = (start, end) => ranges.some(([rangeStart, rangeEnd]) => rangeStart === start && (end === undefined || rangeEnd === end))

  if (has(0x0000, 0x00FF)) return 'latin'
  if (has(0x0102)) return 'vietnamese'
  if (has(0x0100)) return 'latin-ext'
  if (has(0x0400, 0x045F)) return 'cyrillic'
  if (has(0x0460, 0x052F)) return 'cyrillic-ext'
  if (has(0x1F00, 0x1FFF)) return 'greek-ext'
  if (has(0x0370)) return 'greek'

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
      // family → subset → array of files; allows preloading only selected families and subsets.
      // Fonts without a detectable subset (e.g. non-subsetted local fonts) fall back to the 'default' key.
      entry.fonts = fonts.reduce((acc, font) => {
        if (font.family) ((acc[font.family] ??= {})[font.subset ?? 'default'] ??= []).push(font.file)
        return acc
      }, {})
      hasFonts = true
    }

    if (hasFonts) {
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    }
  },
})
