import {
    Core,
    Utils,
    Styles,
    Scripts,
    Templates,
    Icons,
    Watch,
    Emails,
    Functions,
    Exists,
    Modules,
    Package,
    Config,
    root
} from "./modules/Core.js";

const defineConfig = (config) => new Core().init(config);

const tailwindColors = (colors = []) => {
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

export {
    defineConfig,
    tailwindColors,
    Core,
    Utils,
    Styles,
    Scripts,
    Templates,
    Icons,
    Watch,
    Emails,
    Functions,
    Exists,
    Modules,
    Package,
    Config,
    root
}
