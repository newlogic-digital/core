import {HeroiconsOptions} from "@newlogic-digital/vite-plugin-heroicons";

interface Input {
    assets?: string[]
    pages?: string[]
    emails?: string[]
}

export interface PluginUserConfig {
    mode?: 'development' | 'production' | 'emails' | string
    format?: string[]
    input?: Input
    cert?: string
    codeSplitting?: import('rolldown').OutputOptions['codeSplitting']
    vituum?: import('vituum').UserConfig,
    css?: import('vite').CSSOptions
    cssInline?: import('@vituum/vite-plugin-css-inline').PluginUserConfig
    send?: import('@vituum/vite-plugin-send').PluginUserConfig
    tailwindcss?: import('@tailwindcss/vite').PluginOptions
    latte?: import('@vituum/vite-plugin-latte').PluginUserConfig
    twig?: import('@vituum/vite-plugin-twig').PluginUserConfig
    heroicons?: import('@newlogic-digital/vite-plugin-heroicons').HeroiconsOptions
}