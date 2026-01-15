import minifyHtml from '@minify-html/node'
import { Buffer } from 'node:buffer'

const parseMinifyHtml = async (input, name) => {
  const minify = await minifyHtml.minify(Buffer.from(input), {
    minify_css: true,
    minify_js: true,
  })

  const minifyWithQuotes = minify.toString().replaceAll(/=(\s*)"(.*?)"/g, '=\'$2\'')

  if (name) {
    return JSON.stringify({
      [name]: minifyWithQuotes,
    })
  }
  else {
    return JSON.stringify(minifyWithQuotes)
  }
}

export default parseMinifyHtml
