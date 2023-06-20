import minifier from 'html-minifier-terser'

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

export default parseMinifyHtml
