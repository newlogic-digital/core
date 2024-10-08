import fs from 'node:fs'
import os from 'node:os'
import { resolve, join } from 'node:path'
import vituum from 'vituum'
import latte from '@vituum/vite-plugin-latte'
import twig from '@vituum/vite-plugin-twig'
import juice from '@vituum/vite-plugin-juice'
import send from '@vituum/vite-plugin-send'
import tailwindcss from '@vituum/vite-plugin-tailwindcss'
import { getPackageInfo, merge } from 'vituum/utils/common.js'
import twigOptions from './src/twig.js'
import browserslistToEsbuild from 'browserslist-to-esbuild'

const { name } = getPackageInfo(import.meta.url)

const postcssImportSupports = {
    name: 'postcss-import-supports',
    transform(code, path) {
        if (path.endsWith('.css')) {
            return {
                code: code.replace('@media supports', '@supports')
            }
        }
    }
}

/**
 * @type {import('@newlogic-digital/core/types').PluginUserConfig}
 */
const defaultOptions = {
    mode: null,
    cert: 'localhost',
    format: ['latte'],
    manualChunks: {},
    vituum: {
        pages: {
            dir: './src/pages'
        }
    },
    juice: {
        paths: ['src/pages/email'],
        postcss: {
            globalData: {
                files: ['./src/styles/emails/theme/config.css']
            }
        }
    },
    tailwindcss: {},
    send: {},
    latte: {
        globals: {
            srcPath: resolve(process.cwd(), 'src'),
            templatesPath: resolve(process.cwd(), 'src/templates'),
            template: './src/templates/layouts/default.latte'
        },
        functions: {
            pages: () => {
                return fs.readdirSync(resolve(process.cwd(), 'src/pages')).filter(file => fs.statSync(resolve(process.cwd(), 'src/pages/' + file)).isFile())
            }
        },
        filters: {
            json: resolve(process.cwd(), 'node_modules/@newlogic-digital/core/latte/JsonFilter.js'),
            code: 'node_modules/@newlogic-digital/core/latte/CodeFilter.php'
        }
    },
    twig: twigOptions
}

/**
 * @param {import('@newlogic-digital/core/types').PluginUserConfig} options
 * @returns [import('vite').Plugin]
 */
const plugin = (options = {}) => {
    options = merge(defaultOptions, options)

    const templatesPlugins = []

    if (options.format.includes('twig')) {
        templatesPlugins.push(twig(options.twig))
    }

    if (options.format.includes('latte')) {
        templatesPlugins.push(latte(options.latte))
    }

    const plugins = [
        vituum(options.vituum),
        tailwindcss(options.tailwindcss),
        ...templatesPlugins,
        juice(options.juice),
        send(options.send),
        postcssImportSupports
    ]

    return [{
        name,
        enforce: 'pre',
        config(userConfig, userEnv) {
            const isHttps = userConfig?.server?.https !== false
                && fs.existsSync(join(os.homedir(), `.ssh/${options.cert}.pem`))
                && fs.existsSync(join(os.homedir(), `.ssh/${options.cert}-key.pem`))

            let defaultInput = [
                './src/styles/*.{css,pcss,scss,sass,less,styl,stylus}',
                './src/scripts/*.{js,ts,mjs}'
            ]

            if (!options.mode) {
                options.mode = userEnv.mode
            }

            if (options.mode === 'development') {
                defaultInput = [
                    './src/pages/**/*.{json,latte,twig,liquid,njk,hbs,pug,html}',
                    '!./src/pages/**/*.{latte,twig,liquid,njk,hbs,pug,html}.json',
                    './src/styles/*.{css,pcss,scss,sass,less,styl,stylus}',
                    './src/scripts/*.{js,ts,mjs}'
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
                entries: []
            }, userConfig.optimizeDeps ?? {})

            userConfig.build = Object.assign({
                target: browserslistToEsbuild(),
                manifest: (options.mode === 'emails') ? false : 'manifest.json',
                emptyOutDir: false,
                modulePreload: false,
                assetsInlineLimit: 0,
                outDir
            }, userConfig.build ?? {})

            if (options.mode === 'emails') {
                userEnv.mode = 'production'

                defaultInput = [
                    './src/pages/email/**/*.{json,latte,twig,liquid,njk,hbs,pug,html}',
                    './src/styles/emails/*.{css,pcss,scss,sass,less,styl,stylus}',
                    '!./src/pages/email/**/*.{latte,twig,liquid,njk,hbs,pug,html}.json'
                ]

                userConfig.build.rollupOptions = Object.assign({
                    input: defaultInput,
                    output: {
                        assetFileNames: 'assets/email/[name].[ext]'
                    }
                }, userConfig.build.rollupOptions ?? {})
            } else {
                userConfig.build.rollupOptions = Object.assign({
                    input: defaultInput,
                    output: {
                        manualChunks: {
                            swup: ['swup'],
                            stimulus: ['@hotwired/stimulus'],
                            naja: ['naja'],
                            ...options.manualChunks
                        }
                    }
                }, userConfig.build.rollupOptions ?? {})
            }

            userConfig.server = Object.assign({
                host: true,
                fsServe: {
                    strict: false
                },
                https: isHttps
                    ? {
                            key: fs.readFileSync(join(os.homedir(), `.ssh/${options.cert}-key.pem`)),
                            cert: fs.readFileSync(join(os.homedir(), `.ssh/${options.cert}.pem`))
                        }
                    : false
            }, userConfig.server ?? {})
        }
    }, ...plugins]
}

export default plugin
