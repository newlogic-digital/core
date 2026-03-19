import fs from 'node:fs'
import os from 'node:os'
import { resolve, join, dirname } from 'node:path'
import vituum from 'vituum'
import send from '@vituum/vite-plugin-send'
import { getPackageInfo, deepMergeWith } from 'vituum/utils/common.js'
import browserslistToEsbuild from 'browserslist-to-esbuild'
import browserslist from 'browserslist'
import { Features as LightningCssFeatures, browserslistToTargets } from 'lightningcss'
import process from 'node:process'
import heroicons from '@newlogic-digital/vite-plugin-heroicons'
import { fileURLToPath } from 'node:url'

const { name } = getPackageInfo(import.meta.url)

/**
 * @type {import('@newlogic-digital/core/types').PluginUserConfig}
 */
const defaultOptions = {
  mode: null,
  cert: 'localhost',
  format: ['latte'],
  codeSplitting: {},
  input: {
    assets: [
      './src/styles/*.{css,pcss,scss,sass,less,styl,stylus}',
      './src/scripts/*.{js,ts,mjs}',
      './src/assets/**/*',
    ],
    pages: [
      './src/pages/**/*.{json,latte,twig,liquid,njk,hbs,pug,html}',
      '!./src/pages/**/*.{latte,twig,liquid,njk,hbs,pug,html}.json',
      '!./src/pages/email/**/*',
    ],
    emails: [
      './src/pages/email/**/*.{json,latte,twig,liquid,njk,hbs,pug,html}',
      './src/styles/emails/*.{css,pcss,scss,sass,less,styl,stylus}',
      '!./src/pages/email/**/*.{latte,twig,liquid,njk,hbs,pug,html}.json',
    ],
  },
  vituum: {
    imports: {
      paths: ['./src/styles/*/**', '!./src/styles/emails/*', './src/scripts/*/**'],
    },
  },
  cssInline: {
    paths: ['src/pages/email'],
    postcss: {},
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {},
  },
  tailwindcss: {},
  send: {},
  latte: {
    globals: {
      srcPath: resolve(process.cwd(), 'src'),
      templatesPath: resolve(process.cwd(), 'src/templates'),
      template: './src/templates/layouts/default.latte',
    },
    functions: {
      pages: () => {
        return fs.readdirSync(resolve(process.cwd(), 'src/pages')).filter(file => fs.statSync(resolve(process.cwd(), 'src/pages/' + file)).isFile())
      },
    },
    filters: {
      json: resolve(process.cwd(), 'node_modules/@newlogic-digital/core/latte/JsonFilter.js'),
      code: 'node_modules/@newlogic-digital/core/latte/CodeFilter.php',
    },
  },
  heroicons: {},
}

/**
 * @param {import('@newlogic-digital/core/types').PluginUserConfig} options
 * @returns [import('vite').Plugin]
 */
const plugin = async (options = {}) => {
  options = deepMergeWith(defaultOptions, options)

  const optionalPlugins = []

  if (options.format.includes('twig')) {
    const twig = (await import('@vituum/vite-plugin-twig')).default

    optionalPlugins.push(twig(options.twig))
  }

  if (options.format.includes('latte')) {
    const latte = (await import('@vituum/vite-plugin-latte')).default

    optionalPlugins.push(latte(options.latte))
  }

  if (options.css.transformer === 'lightningcss') {
    const tailwindcss = (await import('@tailwindcss/vite')).default

    optionalPlugins.push(tailwindcss(options.tailwindcss))

    if (!fs.existsSync(resolve(process.cwd(), 'src/+.css'))) {
      fs.writeFileSync(resolve(process.cwd(), 'src/+.css'), '@import "./styles/main.css";')
    }
  }

  if (options.cssInline.paths.length > 0) {
    const cssInline = (await import('@vituum/vite-plugin-css-inline')).default

    optionalPlugins.push(cssInline(options.cssInline))
  }

  const simpleIcons = resolve(dirname((fileURLToPath(import.meta.url))), 'icons/simpleicons')
  const solidIcons = resolve(dirname((fileURLToPath(import.meta.url))), 'icons/solid')

  const plugins = [
    vituum(options.vituum),
    ...optionalPlugins,
    send(options.send),
    heroicons(
      {
        fileName: 'icons.svg',
        iconSets: {
          'simpleicons-solid': [simpleIcons, 'src/icons/simpleicons'],
          'icons-solid': [solidIcons, 'src/icons/solid'],
          'icons-outline': 'src/icons/outline',
        },
        ...options.heroicons,
      },
    ),
  ]

  return [{
    name,
    enforce: 'pre',
    /**
    * @param {import('vite').UserConfig} userConfig
    * @param {import('vite').ConfigEnv} userEnv
    */
    config(userConfig, userEnv) {
      // @ts-ignore
      const isHttps = userConfig?.server?.https !== false
        && fs.existsSync(join(os.homedir(), `.ssh/${options.cert}.pem`))
        && fs.existsSync(join(os.homedir(), `.ssh/${options.cert}-key.pem`))

      let defaultInput = [
        ...(options?.input?.assets ?? []),
      ]

      if (!options.mode) {
        options.mode = userEnv.mode
      }

      if (options.mode === 'development') {
        defaultInput = [
          ...(options?.input?.pages ?? []),
          ...(options?.input?.assets ?? []),
        ]
      }

      if (userEnv.command === 'build') {
        userConfig.publicDir = userConfig.publicDir ?? false
      }

      const outDir = resolve(userConfig.root ?? process.cwd(), 'public')

      if (userConfig.build && !userConfig.build.outDir) {
        userConfig.build.outDir = outDir
      }

      userConfig.optimizeDeps = Object.assign({
        entries: [],
      }, userConfig.optimizeDeps ?? {})

      userConfig.css = Object.assign({
        transformer: options.css.transformer,
      }, userConfig.css ?? {})

      userConfig.css.lightningcss = Object.assign({
        targets: browserslistToTargets(browserslist()),
        exclude: (options.mode !== 'emails') ? LightningCssFeatures.Nesting : 0,
        drafts: {
          customMedia: true,
        },
      }, userConfig.css.lightningcss ?? {})

      userConfig.build = Object.assign({
        target: browserslistToEsbuild(),
        manifest: (options.mode === 'emails') ? false : 'manifest.json',
        emptyOutDir: false,
        modulePreload: false,
        assetsInlineLimit: 0,
        outDir,
      }, userConfig.build ?? {})

      if (options.mode === 'emails') {
        userEnv.mode = 'production'

        defaultInput = [
          ...(options?.input?.emails ?? []),
        ]

        userConfig.build.rolldownOptions = Object.assign({
          input: defaultInput,
          output: {
            assetFileNames: 'assets/email/[name].[ext]',
          },
        }, userConfig.build.rolldownOptions ?? {})
      }
      else {
        userConfig.build.rolldownOptions = Object.assign({
          input: defaultInput,
          output: {
            codeSplitting: options.codeSplitting ?? {
              groups: [
                {
                  name: 'swup',
                  test: /swup/,
                },
                {
                  name: '@hotwired/stimulus',
                  test: /@hotwired\/stimulus/,
                },
                {
                  name: 'naja',
                  test: /naja/,
                },
              ],
            },
          },
        }, userConfig.build.rolldownOptions ?? {})
      }

      userConfig.server = Object.assign({
        host: true,
        cors: true,
        fsServe: {
          strict: false,
        },
        https: isHttps
          ? {
              key: fs.readFileSync(join(os.homedir(), `.ssh/${options.cert}-key.pem`)),
              cert: fs.readFileSync(join(os.homedir(), `.ssh/${options.cert}.pem`)),
            }
          : false,
      }, userConfig.server ?? {})
    },
  }, ...plugins]
}

export default plugin
