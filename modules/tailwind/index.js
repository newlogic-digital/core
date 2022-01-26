const tailwindColors = (colors = []) => {
  colors.forEach(name => {
    colors[name] = ({ opacityValue }) => {
      if (opacityValue === undefined) {
        return `rgb(var(--color-${name}))`
      }
      return `rgb(var(--color-${name}) / ${opacityValue})`
    }
  })

  return colors
}

const tailwindColorsRgba = (colors = []) => {
  colors.forEach(name => {
    colors[name] = ({opacityVariable, opacityValue}) => {
      if (opacityValue !== undefined) {
        return `rgba(var(--color-${name}), ${opacityValue})`
      }
      if (opacityVariable !== undefined) {
        return `rgba(var(--color-${name}), var(${opacityVariable}, 1))`
      }
      return `rgb(var(--color-${name}))`
    }
  })

  return colors
}

const tailwindVariables = (type, variables = [], values = {}) => {
  variables.forEach(name => {
    values[name] = `var(--${type}-${name})`
  })

  return values
}

export { tailwindColors, tailwindVariables, tailwindColorsRgba }
