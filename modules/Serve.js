import autoprefixer from "autoprefixer";
import lodash from "lodash";
import {Config, Exists, Styles, Utils} from "./Core.js";

export class Serve {
    init() {
        return new Promise(async (resolve) => {
            const { createServer } = (await import('vite'));
            const tailwindcss = (await import("tailwindcss")).default;

            const ratio = {
                name: 'ratio',
                transformIndexHtml(html) {
                    return html.replace("</head>", `<style>${new Styles().ratio(Config.styles.ratio.content)}</style></head>`)
                }
            }

            const middleware = {
                name: 'middleware',
                apply: 'serve',
                configureServer(viteDevServer) {
                    return () => {
                        viteDevServer.middlewares.use(async (context, res, next) => {
                            if (!context.originalUrl.endsWith(".html") && context.originalUrl !== "/") {
                                context.url = `/${Config.paths.output.root}` + context.originalUrl + ".html";
                            } else if (context.url === "/index.html") {
                                context.url = `/${Config.paths.output.root}` + context.url;
                            }

                            next();
                        });
                    };
                }
            }

            const reload = {
                name: 'reload',
                handleHotUpdate({ file, server }) {
                    if (file.includes('.html') || file.includes(`/${Config.paths.output.root}/`)) {
                        server.ws.send({
                            type: 'full-reload',
                            path: '*',
                        });
                    }
                }
            }

            let config = {
                plugins: Config.serve.mode === "dev" ? [middleware, ratio, reload] : [middleware, reload],
                publicDir: `${Config.paths.output.root}`,
                server: {
                    open: Config.serve.index,
                    host: true,
                    fsServe: {
                        strict: false
                    },
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