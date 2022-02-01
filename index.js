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

import { tailwindColors, tailwindColorsRgba, tailwindVariables, tailwindColorsAccent, tailwindColorsCurrent, tailwindAnimations } from './modules/tailwind/index.js'

const defineConfig = (config) => new Core().init(config);

export {
    defineConfig,
    tailwindColors,
    tailwindVariables,
    tailwindColorsRgba,
    tailwindColorsAccent,
    tailwindColorsCurrent,
    tailwindAnimations,
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
