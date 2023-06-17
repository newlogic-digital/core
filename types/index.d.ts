interface Emails {
    outputDir?: string
    appDir?: string
}

export interface PluginUserConfig {
    emails?: Emails
    vituum?: import('vituum/types').UserConfig,
    posthtml?: import('@vituum/vite-plugin-posthtml/types').PluginUserConfig
    juice?: import('@vituum/vite-plugin-juice/types').PluginUserConfig
    send?: import('@vituum/vite-plugin-send/types').PluginUserConfig
    tailwindcss?: import('@vituum/vite-plugin-tailwindcss/types').PluginUserConfig
    latte?: import('@vituum/vite-plugin-latte/types').PluginUserConfig
}
