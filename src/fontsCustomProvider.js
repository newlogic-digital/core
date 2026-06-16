import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineFontProvider } from 'unifont'

/**
 * File extension → CSS format() + MIME for the data URL
 *
 * @type {Record<string, { format: string, mime: string }>}
 */
const fontFormats = {
  woff2: { format: 'woff2', mime: 'font/woff2' },
  woff: { format: 'woff', mime: 'font/woff' },
  ttf: { format: 'truetype', mime: 'font/ttf' },
  otf: { format: 'opentype', mime: 'font/otf' },
}

/**
 * Reads a font file and returns it as a base64 data URL
 *
 * @param {string} src - font path relative to process.cwd()
 * @returns {{ url: string, format: string }}
 */
const fontSource = (src) => {
  const extension = src.split('.').pop()?.toLowerCase() ?? ''
  const type = fontFormats[extension]

  if (!type) {
    throw new Error(`[fontless] Unsupported font extension "${extension}" (${src}). Supported: ${Object.keys(fontFormats).join(', ')}`)
  }

  const data = readFileSync(resolve(process.cwd(), src)).toString('base64')

  return { url: `data:${type.mime};base64,${data}`, format: type.format }
}

/**
 * Builds the "custom" unifont provider that base64-inlines the local fonts
 * defined by the `customProvider` array in the fontless configuration
 *
 * @param {Array<{ name: string, fonts: Array<{ src: string, weight?: number | string, style?: string }> }>} entries
 * @returns {import('unifont').ProviderFactory<'custom'>}
 */
export const createCustomProvider = entries =>
  /** @type {import('unifont').ProviderFactory<'custom'>} */ (defineFontProvider('custom', () => ({
    resolveFont(family) {
      const entry = entries.find(item => item.name === family)

      if (!entry) return

      return {
        fonts: entry.fonts.map(font => ({
          src: [fontSource(font.src)],
          weight: font.weight,
          style: font.style,
        })),
      }
    },
  })))
