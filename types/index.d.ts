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
    manualChunks?: import('rollup').ManualChunksOption
    vituum?: import('vituum').UserConfig,
    css?: import('vite').CSSOptions
    posthtml?: import('@vituum/vite-plugin-posthtml/types').PluginUserConfig
    juice?: import('@vituum/vite-plugin-juice/types').PluginUserConfig
    send?: import('@vituum/vite-plugin-send/types').PluginUserConfig
    tailwindcss?: import('@vituum/vite-plugin-tailwindcss/types').PluginUserConfig
    latte?: import('@vituum/vite-plugin-latte/types').PluginUserConfig
    twig?: import('@vituum/vite-plugin-twig/types').PluginUserConfig
}
