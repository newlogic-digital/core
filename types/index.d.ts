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
    juice?: import('@vituum/vite-plugin-juice').PluginUserConfig
    send?: import('@vituum/vite-plugin-send').PluginUserConfig
    tailwindcss?: import('@vituum/vite-plugin-tailwindcss').PluginUserConfig
    latte?: import('@vituum/vite-plugin-latte').PluginUserConfig
    twig?: import('@vituum/vite-plugin-twig').PluginUserConfig
}
