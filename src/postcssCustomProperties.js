import postcss from 'postcss'
import postcssCustomProperties from 'postcss-custom-properties'

export const processPostcssCustomProperties = (code, options = {
  preserve: false,
}) => {
  const processedCss = postcss(
    [
      postcssCustomProperties(options),
    ],
  ).process(code)

  return processedCss.css.replace(/\s*--[\w-]+\s*:\s*[^;]*;/g, '')
}
