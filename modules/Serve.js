import autoprefixer from "autoprefixer";
import lodash from "lodash";
import {Config, Exists, Styles, Utils} from "./Core.js";

export class Serve {
    init() {
        return new Promise(async (resolve) => {
            const { createServer } = (await import('vite'));
            const tailwindcss = (await import("tailwindcss")).default;

            const ratio = () => {
                return {
                    name: 'ratio',
                    transformIndexHtml(html) {
                        return html.replace("</head>", `<style>${new Styles().ratio(Config.styles.ratio.content)}</style></head>`)
                    }
                }
            }

            let config = {
                plugins: Config.serve.mode === "dev" ? [ratio()] : [],
                publicDir: `${Config.paths.output.root}`,
                server: {
                    open: Config.serve.index,
                    watch: {
                        ignored: ['**/node_modules/**', '**/.git/**', '**/src/templates/**', '**/src/main.json']
                    }
                },
                root: process.cwd(),
            };

            let tailwindcssConfig = {}

            if (!Exists.tailwindConfig) {
                tailwindcssConfig = { config: Config.tailwind }
            }

            let css = {
                css: {
                    postcss: {
                        plugins: new Utils().postcssPlugins(Config.styles.postcss, [tailwindcss(tailwindcssConfig), autoprefixer])
                    }
                }
            }

            if (!Exists.postcssConfig && Config.serve.mode === "dev") {
                config = lodash.merge(config, css)
            }

            const server = await createServer(config)

            await server.listen()

            console.log(" ");

            resolve();
        })
    }
}