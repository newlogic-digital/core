import autoprefixer from "autoprefixer";
import lodash from "lodash";
import {Config, Exists, Styles, Utils} from "./Core.js";
import fs from "fs";
import path from "path";
import os from "os";
import {createRequire} from "module";
import chalk from "chalk";
const require = createRequire(import.meta.url);

export const Serve = new class {
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
                    if ((!file.includes('.json') && !file.includes('.html') && file.includes(`/${Config.paths.output.root}/`)) || Config.serve.reload(file)) {
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
                    hmr: {
                        host: 'localhost'
                    },
                    watch: {
                        ignored: ['**/node_modules/**', '**/.git/**', '**/src/templates/**', '**/src/main.json', `**/${Config.paths.output.root}/*.html`]
                    }
                },
                root: process.cwd(),
            };

            if (fs.existsSync(path.join(os.homedir(),'.ssh/localhost.pem')) && Config.serve.https) {
                lodash.merge(config, {
                    server: {
                        https: {
                            key: fs.readFileSync(path.join(os.homedir(),'.ssh/localhost-key.pem')),
                            cert: fs.readFileSync(path.join(os.homedir(),'.ssh/localhost.pem')),
                        }
                    }
                })
            }

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

            lodash.merge(config, Config.serve.vite);

            this.server = await createServer(config)

            await this.server.listen()

            console.log(chalk.cyan(`\n  vite v${require('vite/package.json').version}`) + chalk.green(` dev server running at:\n`))
            console.log(typeof this.server.printUrls() !== "undefined" ? this.server.printUrls() : "");

            resolve();
        })
    }
}
