import fs from 'node:fs'
import os from 'node:os'
import { dirname, resolve, join, relative } from 'node:path'
import postHtml from 'posthtml'
import vituum from 'vituum'
import posthtml from '@vituum/vite-plugin-posthtml'
import latte from '@vituum/vite-plugin-latte'
import twig from '@vituum/vite-plugin-twig'
import juice from '@vituum/vite-plugin-juice'
import send from '@vituum/vite-plugin-send'
import tailwindcss from '@vituum/vite-plugin-tailwindcss'
import { getPackageInfo, merge } from 'vituum/utils/common.js'
import highlight from './src/prism.js'
import twigOptions from './src/twig.js'
import FastGlob from 'fast-glob'
import fse from 'fs-extra'
import pc from 'picocolors'

const { name } = getPackageInfo(import.meta.url)

const posthtmlPrism = {
    name: '@newlogic-digital/vite-plugin-posthtml-prism',
    enforce: 'post',
    transformIndexHtml: {
        order: 'post',
        handler: async (html, { filename }) => {
            filename = filename.replace('?raw', '')

            if (!filename.replace('.html', '').endsWith('ui.json')) {
                return
            }

            const plugins = [highlight({ inline: false })]

            const result = await postHtml(plugins).process(html)

            return result.html
        }
    }
}

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
    emails: {
        outputDir: resolve(process.cwd(), 'public/email'),
        appDir: resolve(process.cwd(), 'app/Templates/Emails')
    },
    vituum: {
        pages: {
            dir: './src/pages'
        }
    },
    posthtml: {
        root: resolve(process.cwd(), 'src')
    },
    juice: {
        paths: ['src/pages/email'],
        postcss: {
            globalData: {
                files: ['./src/emails/styles/main/base/config.css']
            }
        }
    },
    tailwindcss: {},
    send: {},
    latte: {
        renderTransformedHtml: filename => dirname(filename).endsWith('email'),
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
        },
        ignoredPaths: ['**/views/email/**/!(*.test).latte', '**/emails/!(*.test).latte']
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
        posthtml(options.posthtml),
        ...templatesPlugins,
        juice(options.juice),
        send(options.send),
        posthtmlPrism,
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

            if (options.mode === 'emails') {
                userEnv.mode = 'production'

                defaultInput = [
                    './src/pages/email/**/*.{json,latte,twig,liquid,njk,hbs,pug,html}',
                    '!./src/pages/email/**/*.{latte,twig,liquid,njk,hbs,pug,html}.json'
                ]
            }

            const outDir = resolve(userConfig.root ?? process.cwd(), 'public')

            if (userConfig.build && !userConfig.build.outDir) {
                userConfig.build.outDir = outDir
            }

            userConfig.optimizeDeps = Object.assign({
                entries: []
            }, userConfig.optimizeDeps ?? {})

            userConfig.build = Object.assign({
                target: ['edge111', 'firefox111', 'chrome111', 'safari16'],
                manifest: 'manifest.json',
                emptyOutDir: false,
                modulePreload: false,
                assetsInlineLimit: 0,
                outDir
            }, userConfig.build ?? {})

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
        },
        writeBundle: async () => {
            if (options.mode === 'emails') {
                const emails = FastGlob.sync(`${resolve(process.cwd(), options.emails.outputDir)}/**`).filter(entry => !entry.endsWith('test.html'))
                const emailsProd = emails.map((path) => {
                    return path.replace(resolve(process.cwd(), options.emails.outputDir), resolve(process.cwd(), options.emails.appDir)).replace('.html', '.latte')
                })

                await Promise.all(emails.map((file, i) =>
                    fse.move(file, emailsProd[i], { overwrite: true })
                ))

                console.info(`${pc.cyan('@newlogic-digital/core')} ${pc.green(`all email files were moved to ${relative(process.cwd(), options.emails.appDir)}`)}`)
            }
        }
    }, ...plugins]
}

export default plugin
