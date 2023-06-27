import parseMinifyHtml from '../src/minify.js'

const json = async (input, name) => {
    return await parseMinifyHtml(input, name)
}

export default json
