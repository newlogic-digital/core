import tailwind from '@vituum/tailwind'
import posthtml from '@vituum/posthtml'
import juice from '@vituum/juice'
import twig from '@vituum/twig'
import latte from '@vituum/latte'
import lodash from 'lodash'
import minifier from 'html-minifier-terser'
import fs from 'fs'
import { dirname, resolve } from 'path'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/index.js'
import NormalizeWhitespace from 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace.js'

loadLanguages(['markup', 'css', 'javascript'])

const stripIndent = (string) => {
    const indent = () => {
        const match = string.match(/^[ \t]*(?=\S)/gm)

        if (!match) {
            return 0
        }

        return match.reduce((r, a) => Math.min(r, a.length), Infinity)
    }

    if (indent() === 0) {
        return string
    }

    const regex = new RegExp(`^[ \\t]{${indent()}}`, 'gm')

    return string.replace(regex, '')
}

const defaultConfig = {
    posthtml: {},
    juice: {},
    tailwind: {},
    twig: {
        namespaces: {
            src: resolve(process.cwd(), 'src'),
            templates: resolve(process.cwd(), 'src/templates')
        },
        functions: {
            pages: () => {
                return fs.readdirSync('src/views').filter(file => fs.statSync('src/views/' + file).isFile())
            },
            fetch: (data) => {
                if (typeof data !== 'undefined') {
                    if (data.indexOf('http') > -1) {
                        return data
                    } else {
                        let slash = data.indexOf('/') + 1
                        if (slash > 1) {
                            slash = 0
                        }

                        return fs.readFileSync(process.cwd() + '/' + data.substring(slash, data.length), 'utf8').toString()
                    }
                }
            },
            randomColor: () => {
                return '#' + Math.random().toString(16).slice(2, 8)
            },
            placeholder: (width, height) => {
                const colors = ['333', '444', '666', '222', '777', '888', '111']
                return 'https://via.placeholder.com/' + width + 'x' + height + '/' + colors[Math.floor(Math.random() * colors.length)] + '.webp'
            },
            lazy: (width, height) => {
                const svg = encodeURIComponent(stripIndent('<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '"></svg>'))

                return 'data:image/svg+xml;charset=UTF-8,' + svg
            },
            ratio: (width, height) => {
                return (height / width) * 100
            }
        },
        filters: {
            asset: (url) => {
                return url.replace('/src/', '/')
            },
            rem: (value) => {
                return `${value / 16}rem`
            },
            encode64: (path) => {
                const svg = encodeURIComponent(stripIndent(path))

                return 'data:image/svg+xml;charset=UTF-8,' + svg
            },
            exists: (path) => {
                if (path.indexOf('/') === 0) {
                    path = path.slice(1)
                }

                return fs.existsSync(resolve(process.cwd(), path))
            },
            tel: (value) => {
                return value.replace(/\s+/g, '').replace('(', '').replace(')', '')
            }
        },
        extensions: [
            (Twig) => {
                Twig.exports.extendTag({
                    type: 'json',
                    regex: /^json\s+(.+)$|^json$/,
                    next: ['endjson'],
                    open: true,
                    compile: function(token) {
                        const expression = token.match[1] ?? '\'_null\''

                        token.stack = Reflect.apply(Twig.expression.compile, this, [{
                            type: Twig.expression.type.expression,
                            value: expression
                        }]).stack

                        delete token.match
                        return token
                    },
                    parse: async function(token, context, chain) {
                        const name = Reflect.apply(Twig.expression.parse, this, [token.stack, context])
                        const output = this.parse(token.output, context)

                        const minify = await minifier.minify(output, {
                            collapseWhitespace: true,
                            collapseInlineTagWhitespace: false,
                            minifyCSS: true,
                            removeAttributeQuotes: true,
                            quoteCharacter: '\'',
                            minifyJS: true
                        })

                        if (name === '_null') {
                            return {
                                chain,
                                output: JSON.stringify(minify)
                            }
                        } else {
                            return {
                                chain,
                                output: JSON.stringify({
                                    [name]: minify
                                })
                            }
                        }
                    }
                })
                Twig.exports.extendTag({
                    type: 'endjson',
                    regex: /^endjson$/,
                    next: [],
                    open: false
                })
            },
            (Twig) => {
                Twig.exports.extendTag({
                    type: "code",
                    regex: /^code\s+(.+)$/,
                    next: ["endcode"], // match the type of the end tag
                    open: true,
                    compile: function (token) {
                        const expression = token.match[1];

                        token.stack = Reflect.apply(Twig.expression.compile, this, [{
                            type: Twig.expression.type.expression,
                            value: expression
                        }]).stack;

                        delete token.match;
                        return token;
                    },
                    parse: function (token, context, chain) {
                        let type = Reflect.apply(Twig.expression.parse, this, [token.stack, context]);
                        let output = this.parse(token.output, context);
                        let mirror = false;

                        if (type.includes(":mirror")) {
                            mirror = true;
                            type = type.replace(":mirror", "")
                        }

                        const Normalize = new NormalizeWhitespace({
                            'remove-trailing': true,
                            'remove-indent': true,
                            'left-trim': true,
                            'right-trim': true,
                        });

                        const wrap = (code, lang) => {
                            return `<pre class="language-${lang}"><code>${code}</code></pre>`
                        }

                        const highlight = (str, lang) => {
                            if (!lang) {
                                return wrap(str, 'text')
                            }
                            lang = lang.toLowerCase()
                            const rawLang = lang
                            if (lang === 'vue' || lang === 'html') {
                                lang = 'markup'
                            }
                            if (lang === 'md') {
                                lang = 'markdown'
                            }
                            if (lang === 'ts') {
                                lang = 'typescript'
                            }
                            if (lang === 'py') {
                                lang = 'python'
                            }
                            if (!Prism.languages[lang]) {
                                try {
                                    loadLanguages([lang])
                                } catch (e) {
                                    console.warn(`Syntax highlight for language "${lang}" is not supported.`)
                                }
                            }
                            if (Prism.languages[lang]) {
                                const code = Prism.highlight(Normalize.normalize(str), Prism.languages[lang], lang)
                                return wrap(code, rawLang)
                            }
                            return wrap(str, 'text')
                        }

                        return {
                            chain: chain,
                            output: `${mirror ? output : ""}${highlight(output, type)}`
                        };
                    }
                });
                Twig.exports.extendTag({
                    type: "endcode",
                    regex: /^endcode$/,
                    next: [ ],
                    open: false
                });
            }
        ]
    },
    latte: {
        isStringFilter: (filename) => dirname(filename).endsWith('emails')
    }
}

const integration = (userConfig = {}) => {
    userConfig = lodash.merge(defaultConfig, userConfig)

    return {
        config: {
            integrations: [posthtml(userConfig.posthtml), juice(userConfig.juice), tailwind(userConfig.tailwind), twig(userConfig.twig), latte(userConfig.latte)],
            server: {
                open: true,
                https: true,
                reload: file => (file.endsWith('.tpl') || file.endsWith('.latte')) && !file.includes('temp/')
            },
            templates: {
                format: 'twig'
            }
        }
    }
}

export default integration
