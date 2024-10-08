interface Emails {
    outputDir?: string
    appDir?: string
}

export interface PluginUserConfig {
    mode?: 'development' | 'production' | 'emails' | string
    format?: string[]
    cert?: string
    manualChunks?: import('rollup').ManualChunksOption
    emails?: Emails
    vituum?: import('vituum').UserConfig,
    posthtml?: import('@vituum/vite-plugin-posthtml/types').PluginUserConfig
    juice?: import('@vituum/vite-plugin-juice/types').PluginUserConfig
    send?: import('@vituum/vite-plugin-send/types').PluginUserConfig
    tailwindcss?: import('@vituum/vite-plugin-tailwindcss/types').PluginUserConfig
    latte?: import('@vituum/vite-plugin-latte/types').PluginUserConfig
    twig?: import('@vituum/vite-plugin-twig/types').PluginUserConfig
}
