import fs from 'fs'
import { dirname, resolve } from 'path'
import postHtml from 'posthtml'
import vituum from 'vituum'
import posthtml from '@vituum/vite-plugin-posthtml'
import latte from '@vituum/vite-plugin-latte'
import juice from '@vituum/vite-plugin-juice'
import send from '@vituum/vite-plugin-send'
import tailwindcss from '@vituum/vite-plugin-tailwindcss'
import { getPackageInfo, merge } from 'vituum/utils/common.js'
import minifier from 'html-minifier-terser'
import highlight from './prism.js'

const { name } = getPackageInfo(import.meta.url)

const posthtmlPrism = {
    name: '@newlogic-digital/vite-plugin-posthtml-prism',
    enforce: 'post',
    transformIndexHtml: {
        enforce: 'post',
        transform: async (html, { filename }) => {
            filename = filename.replace('?raw', '')

            if (!filename.endsWith('ui.json') && !filename.endsWith('ui.vituum.json.html')) {
                return
            }

            const plugins = [highlight({ inline: false })]

            const result = await postHtml(plugins).process(html)

            return result.html
        }
    }
}

const parseMinifyHtml = async (input, name) => {
    const minify = await minifier.minify(input, {
        collapseWhitespace: true,
        collapseInlineTagWhitespace: false,
        minifyCSS: true,
        removeAttributeQuotes: true,
        quoteCharacter: '\'',
        minifyJS: true
    })

    if (name) {
        return JSON.stringify({
            [name]: minify
        })
    } else {
        return JSON.stringify(minify)
    }
}

/**
 * @type {import('@newlogic-digital/core/types').PluginUserConfig}
 */
const defaultOptions = {
    emails: {
        outputDir: resolve(process.cwd(), 'public/email'),
        appDir: resolve(process.cwd(), 'app/Templates/Emails')
    },
    vituum: {},
    posthtml: {},
    juice: {},
    tailwindcss: {},
    send: {},
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
        ignoredPaths: ['**/views/email/**/!(*.test).latte']
    }
}

/**
 * @param {import('@newlogic-digital/core/types').PluginUserConfig} options
 * @returns import('vite').Plugin
 */
const plugin = (options = {}) => {
    options = merge(defaultOptions, options)

    const plugins = [
        vituum(options.vituum),
        tailwindcss(options.tailwindcss),
        posthtml(options.posthtml),
        latte(options.latte),
        juice(options.juice),
        send(options.send),
        posthtmlPrism
    ]

    return {
        name,
        enforce: 'pre',
        config (userConfig) {
            if (!userConfig?.plugins) {
                userConfig.plugins = plugins
            } else if (userConfig.plugins) {
                userConfig.plugins = plugins.concat(...userConfig.plugins)
            }
        }
    }
}

export default plugin
