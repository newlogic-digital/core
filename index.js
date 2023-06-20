import fs from 'fs'
import os from 'os'
import { dirname, resolve, join } from 'path'
import postHtml from 'posthtml'
import vituum from 'vituum'
import posthtml from '@vituum/vite-plugin-posthtml'
import latte from '@vituum/vite-plugin-latte'
import twig from '@vituum/vite-plugin-twig'
import juice from '@vituum/vite-plugin-juice'
import send from '@vituum/vite-plugin-send'
import tailwindcss from '@vituum/vite-plugin-tailwindcss'
import { getPackageInfo, merge } from 'vituum/utils/common.js'
import parseMinifyHtml from './src/minify.js'
import highlight from './src/prism.js'
import twigOptions from './src/twig.js'

const { name } = getPackageInfo(import.meta.url)

const posthtmlPrism = {
    name: '@newlogic-digital/vite-plugin-posthtml-prism',
    enforce: 'post',
    transformIndexHtml: {
        enforce: 'post',
        transform: async (html, { filename }) => {
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

/**
 * @type {import('@newlogic-digital/core/types').PluginUserConfig}
 */
const defaultOptions = {
    cert: 'localhost',
    emails: {
        outputDir: resolve(process.cwd(), 'public/email'),
        appDir: resolve(process.cwd(), 'app/Templates/Emails')
    },
    vituum: {
        pages: {
            dir: './src/views'
        }
    },
    posthtml: {
        root: resolve(process.cwd(), 'src')
    },
    juice: {
        paths: ['src/views/email']
    },
    tailwindcss: {},
    send: {
        host: 'smtp.newlogic.cz',
        from: 'noreply@newlogic.cz',
        user: 'noreply@newlogic.cz'
    },
    latte: {
        renderTransformedHtml: (filename) => dirname(filename).endsWith('email'),
        globals: {
            srcPath: resolve(process.cwd(), 'src'),
            templatesPath: resolve(process.cwd(), 'src/templates')
        },
        functions: {
            pages: () => {
                return fs.readdirSync(resolve(process.cwd(), 'src/views')).filter(file => fs.statSync(resolve(process.cwd(), 'src/views/' + file)).isFile())
            }
        },
        filters: {
            json: async (input, name) => {
                return await parseMinifyHtml(input, name)
            },
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

    const plugins = [
        vituum(options.vituum),
        tailwindcss(options.tailwindcss),
        posthtml(options.posthtml),
        latte(options.latte),
        twig(options.twig),
        juice(options.juice),
        send(options.send),
        posthtmlPrism
    ]

    return [{
        name,
        enforce: 'pre',
        config (userConfig) {
            const isHttps = userConfig?.server?.https !== false &&
                fs.existsSync(join(os.homedir(), `.ssh/${options.cert}.pem`)) &&
                fs.existsSync(join(os.homedir(), `.ssh/${options.cert}-key.pem`))

            userConfig.build = Object.assign({
                manifest: true,
                emptyOutDir: false,
                modulePreload: false,
                assetsInlineLimit: 0,
                outDir: resolve(userConfig.root ?? process.cwd(), 'public'),
                rollupOptions: {
                    input: [
                        './src/styles/*.{css,pcss,scss,sass,less,styl,stylus}',
                        './src/scripts/*.{js,ts,mjs}',
                        './src/views/**/*.{json,latte,twig,liquid,njk,hbs,pug,html}',
                        '!./src/views/**/*.{latte,twig,liquid,njk,hbs,pug,html}.json'
                    ]
                }
            }, userConfig.build ?? {})

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
