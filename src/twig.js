import fs from 'fs'
import { resolve } from 'path'
import parseMinifyHtml from './minify.js'

const wrapPreCode = (code, lang) => {
    return `<pre class="language-${lang}"><code class="language-${lang}">${code}</code></pre>`
}

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

export default {
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
            return url
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
                compile: function (token) {
                    const expression = token.match[1] ?? '\'_null\''

                    token.stack = Reflect.apply(Twig.expression.compile, this, [{
                        type: Twig.expression.type.expression,
                        value: expression
                    }]).stack

                    delete token.match
                    return token
                },
                parse: async function (token, context, chain) {
                    const name = Reflect.apply(Twig.expression.parse, this, [token.stack, context])
                    const output = this.parse(token.output, context)

                    if (name === '_null') {
                        return {
                            chain,
                            output: await parseMinifyHtml(output)
                        }
                    } else {
                        return {
                            chain,
                            output: await parseMinifyHtml(output, name)
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
                type: 'code',
                regex: /^code\s+(.+)$/,
                next: ['endcode'], // match the type of the end tag
                open: true,
                compile: function (token) {
                    const expression = token.match[1]

                    token.stack = Reflect.apply(Twig.expression.compile, this, [{
                        type: Twig.expression.type.expression,
                        value: expression
                    }]).stack

                    delete token.match
                    return token
                },
                parse: function (token, context, chain) {
                    let type = Reflect.apply(Twig.expression.parse, this, [token.stack, context])
                    const output = this.parse(token.output, context)
                    let mirror = false

                    if (type.includes(':mirror')) {
                        mirror = true
                        type = type.replace(':mirror', '')
                    }

                    return {
                        chain,
                        output: `${mirror ? output : ''}${wrapPreCode(output, type)}`
                    }
                }
            })
            Twig.exports.extendTag({
                type: 'endcode',
                regex: /^endcode$/,
                next: [],
                open: false
            })
        }
    ]
}
