import lodash from "lodash";
import fs from "fs";
import lazypipe from "lazypipe";
import gulpif from "gulp-if";
import path from "path";
import nodeCmd from "child_process";
import https from "https";
import gulp from "gulp";
import through from "through2";
import {Utils} from "./Utils.js";
import {Templates} from "./Templates.js";
import {Styles} from "./Styles.js";
import {Scripts} from "./Scripts.js";
import {Serve} from "./Serve.js";
import {Icons} from "./Icons.js";
import {Emails} from "./Emails.js";
import {Watch} from "./Watch.js";
import chalk from "chalk";

import {createRequire} from "module";
const require = createRequire(import.meta.url);
const root = process.cwd() + "/";

let Exists;
let Modules;
let Functions;
let Package = require(root + "package.json");
let Config = {
    lang: "cs",
    local: false,
    errors: true,
    vite: false,
    config: false,
    sri: false,
    serve: {
        index: "/",
        mode: "",
        https: false,
        reload: (file) => (file.endsWith('.php') || file.endsWith('.tpl') || file.endsWith('.latte')) && !file.includes('temp/'),
        vite: {}
    },
    modules: {},
    paths: {
        temp: "temp",
        cdn: "temp/cdn",
        input: {
            root: "src",
            main: "src/main.json",
            templates: "src/templates",
            scripts: "src/scripts",
            styles: "src/styles",
            icons: "src/icons",
            emails: "src/emails",
            assets: "src/assets"
        },
        output: {
            rewrite: true,
            root: "public",
            scripts: "public/assets/js",
            styles: "public/assets/css",
            icons: "public/assets/css",
            emails: "public",
            emailsImg: "public/img",
            emailsWww: "www/emails",
            assets: "public/assets"
        }
    },
    icons: {
        format: "css",
        filename: "iconfont",
        id: "",
        local: false,
        revision: true,
        optimizations: true,
        postcss: {}
    },
    scripts: {
        optimizations: true,
        revision: true,
        legacy: false,
        concat: [],
        cdnPath: "Utils/cdn.js",
        polyfillUrls: [],
        polyfillFeatures: "default",
        importResolution: {
            subDir: false,
            directories: [],
            filename: "+.js"
        },
        importMap: {
            build: true,
            cdn: "esm.sh",
            version: "v41",
            target: "es2020",
            trailingSlashes: "",
            shortUrl: false,
            localDownload: false
        }
    },
    styles: {
        format: "css",
        revision: true,
        optimizations: true,
        clean: {},
        purge: {
            enabled: true,
            content: [],
            docs: false,
            clean: {},
            options: {},
            nodeResolve: true,
            nodeResolveIgnore: [],
            tailwind: {
                keyframes: true
            }
        },
        vendor: {
            cache: false,
            path: ""
        },
        importResolution: {
            subDir: true,
            directories: [],
            filename: "+.css",
        },
        import: ['all'],
        themePath: "",
        ratio: {
            content: [],
            files: ["main.css"]
        },
        join: {"main.css": ["temp/tailwind.css"]},
        tailwind: {
            cache: true,
            postcss: {},
            basename: "tailwind.css"
        },
        postcss: {}
    },
    templates: {
        format: "twig",
        layout: "",
        placeholder: {
            webp: true,
            picsum: false,
            lorempixel: ""
        },
        filters: {},
        functions: {},
        tags: []
    },
    emails: {
        removeClasses: false,
        inlineOnly: false,
        zipPrefix: ["email"],
        postcss: {}
    },
    assets: {
        revision: true
    },
    tailwind: {}
}

class Core {
    init(ExtendConfig = {}) {
        Config = lodash.merge(Config, ExtendConfig);

        if (Config.config) {
            fs.writeFileSync(`${root + Config.paths.output.root}/config.json`, JSON.stringify(Config));
        }

        if (!fs.existsSync(root + Config.paths.temp)){
            fs.mkdirSync(root + Config.paths.temp);
        }

        Exists = {
            scripts: fs.existsSync(root + Config.paths.input.scripts),
            styles: fs.existsSync(root + Config.paths.input.styles),
            icons: fs.existsSync(root + Config.paths.input.icons),
            emails: fs.existsSync(root + Config.paths.input.emails),
            assets: fs.existsSync(root + Config.paths.input.assets),
            templates: fs.existsSync(root + Config.paths.input.templates) && !Config.vite,
            postcssConfig: fs.existsSync(root + "postcss.config.cjs") || fs.existsSync(root + "postcss.config.js"),
            tailwindConfig: fs.existsSync(root + "tailwind.config.cjs") || fs.existsSync(root + "tailwind.config.js")
        }

        Modules = {
            hbs: {
                module: (partials, helpers, data = {}) => {
                    let hbs = through.obj((file, enc, cb) => {
                        file.extname === ".hbs" && console.error("\x1b[31m", `Module gulp-hb is missing, ${file.basename} won't be compiled.`, "\x1b[0m");
                        cb(null, file);
                    });

                    try { hbs = require("gulp-hb")().partials(partials).helpers(helpers).data(data) } catch {}

                    return hbs
                },
                helpers: (helpers) => {
                    if (typeof helpers === "undefined") {
                        helpers = {};
                    }

                    if (typeof Config.modules.hbs !== "undefined") {
                        helpers = Object.assign(helpers, new Config.modules.hbs().helpers);
                    }

                    return helpers;
                }
            },
            less: {
                module: () => {
                    let less = through.obj((file, enc, cb) => {
                        file.extname === ".less" && console.error("\x1b[31m", `Module gulp-less is missing, ${file.basename} won't be compiled.`, "\x1b[0m");
                        cb(null, file);
                    });

                    try {less = require("gulp-less")()} catch {}

                    return less
                }
            },
            autoprefixer: {
                module() {
                    let autoprefixer = through.obj((file, enc, cb) => {
                        file.extname === ".less" && console.error("\x1b[31m", `Module gulp-autoprefixer is missing, ${file.basename} won't be compiled.`, "\x1b[0m");
                        cb(null, file);
                    });

                    try {autoprefixer = require("gulp-autoprefixer")()} catch {}

                    return autoprefixer;
                },
                pipe: lazypipe().pipe(() => gulpif((file) => {
                    return file.extname === ".less" && Config.styles.optimizations
                }, Modules.autoprefixer.module({overrideBrowserslist: ['ie >= 11', 'last 2 versions']})))
            }
        }

        Functions = {
            stripIndent: (string) => {
                const indent = () => {
                    const match = string.match(/^[ \t]*(?=\S)/gm);

                    if (!match) {
                        return 0;
                    }

                    return match.reduce((r, a) => Math.min(r, a.length), Infinity);
                };

                if (indent() === 0) {
                    return string;
                }

                const regex = new RegExp(`^[ \\t]{${indent()}}`, 'gm');

                return string.replace(regex, '');
            },
            plumber: {
                errorHandler(err) {
                    console.log("\x1b[31m", err.toString(), "\x1b[0m");
                    if (Config.errors) {
                        process.exit(-1);
                    } else {
                        this.emit('end');
                    }
                }
            },
            revUpdate: (cleanup, cleanupDir) => {
                return through.obj((file, enc, cb) => {
                    if (typeof file.revOrigPath === "undefined") {
                        cb(null, file);
                        return false;
                    }

                    let directory = path.parse(path.relative(process.cwd(), file.path)).dir.replace(Config.paths.input[cleanupDir], Config.paths.output[cleanupDir])

                    if (cleanup) {
                        let fileName = path.basename(file.revOrigPath).replace(path.extname(file.revOrigPath),"");
                        if (fs.existsSync(directory)) {
                            let files = fs.readdirSync(directory);

                            for (const file of files) {
                                let fileRev = file.replace(".min.",".").replace(path.extname(file),"");

                                if (fileRev.substr(0, fileRev.lastIndexOf('.')).indexOf(fileName) > -1 && fileRev.substr(0, fileRev.lastIndexOf('.')).length === fileName.length) {
                                    fs.unlinkSync(path.join(directory, file));
                                }
                            }
                        }
                    }

                    function modify(pth, modifier) {
                        return path.join(path.dirname(pth), modifier(path.basename(pth, path.extname(pth)), path.extname(pth)));
                    }

                    file.path = modify(file.revOrigPath, function (name, ext) {
                        return name + '.' + file.revHash + ext;
                    });

                    cb(null, file);
                })
            },
            execSync: (cmd) => nodeCmd.execSync(cmd, {stdio:[0,1,2]}),
            download: (url, dest) => {
                return new Promise((resolve, reject) => {
                    https.get(url, response => {
                        if (response.statusCode === 200) {
                            response.pipe(fs.createWriteStream(dest));
                            response.on("end", resolve)
                        } else {
                            console.error("\x1b[31m", `Error: ${url} returns ${response.statusCode}`, "\x1b[0m");
                            reject()
                        }
                    });
                })
            },
            revRewriteOutput: () => {
                return through.obj((file, enc, cb) => {
                    if (file.isNull()) {
                        cb(null, file);
                    }
                    if (file.isBuffer()) {
                        let contents = file.contents.toString();

                        contents = contents.replace(new RegExp(`${Config.paths.input.assets}`, 'g'),
                            `${Config.paths.output.assets.replace(Config.paths.output.root + "/", "")}`)

                        file.contents = Buffer.from(contents);

                        cb(null, file);
                    }
                });
            },
            module: (name, options = {}) => {
                let module = through.obj((file, enc, cb) => {
                    console.error("\x1b[31m", `Module ${name} is missing, ${file.basename} won't be compiled.`, "\x1b[0m");
                    cb(null, file);
                });

                try {module = require(name)(options)} catch {}

                return module;
            },
            serverReload: () => {
                if (typeof Serve.server !== "undefined") {
                    Serve.server.ws.send({
                        type: 'full-reload',
                        path: '*',
                    });
                    Serve.server.config.logger.info(
                        chalk.green(`page reload `) + chalk.dim(`${Config.paths.output.root}/*.html`),
                        { clear: true, timestamp: true }
                    )
                }
            }
        }

        if (Config.styles.ratio.content.length === 0 && Exists.templates) {
            Config.styles.ratio.content.push(`${root + Config.paths.input.templates}/**/*.{hbs,html,twig}`);
        }

        if (Config.styles.purge.content.length === 0 && Exists.styles) {
            Exists.scripts && Config.styles.purge.content.push(`${Config.paths.input.scripts}/**/*.js`);
            Exists.templates && Config.styles.purge.content.push(`${Config.paths.input.templates}/**/*.twig`);

            Config.styles.purge.content.push(`${Config.paths.cdn}/*.js`)
        }

        this.tasks();

        return Config;
    }
    tasks() {
        if (!Config.vite) {
            (Exists.assets || Exists.icons || Exists.styles || Exists.scripts || Exists.templates)
            && gulp.task("default", resolve => {
                let tasks = [];

                !Config.local && tasks.push("cleanup", "cdn");
                Exists.assets && tasks.push("assets:production")
                Exists.icons && tasks.push("icons:production")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")
                Exists.templates && tasks.push("templates:production")

                Config.errors = true

                gulp.series(tasks)(resolve)
            });

            (Exists.assets || Exists.icons || Exists.styles || Exists.scripts)
            && gulp.task("production", resolve => {
                let tasks = [];

                !Config.local && tasks.push("cleanup", "cdn");
                Exists.assets && tasks.push("assets:production")
                Exists.icons && tasks.push("icons:production")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")

                Config.errors = true
                Config.styles.purge.docs = true

                gulp.series(tasks)(resolve)
            });

            gulp.task("cleanup", () => {
                return new Utils().cleanup()
            })

            gulp.task("importmap", () => {
                return new Utils().importMap()
            })

            gulp.task("cdn", () => {
                return Promise.all([new Utils().cdn("templates"), new Utils().cdn("scripts"), new Utils().cdn("styles")])
            })

            gulp.task("serve", (resolve) => {
                let tasks = [];

                Config.serve.mode = "dev";
                Config.errors = false;

                !Config.local && tasks.push("cleanup")
                Exists.icons && tasks.push("icons")
                Exists.styles && tasks.push("styles")
                Exists.scripts && tasks.push("scripts")
                Exists.templates && tasks.push("templates")

                tasks.push(() => Serve.init(), "watch")

                gulp.series(tasks)(resolve)
            });

            gulp.task("serve:build", (resolve) => {
                let tasks = [];

                if (Config.serve.mode === "") {
                    Config.errors = false;
                    Config.serve.mode = "build";
                }

                !Config.local && tasks.push("cleanup", "cdn")
                Exists.assets && tasks.push("assets")
                Exists.icons && tasks.push("icons:build")
                Exists.styles && tasks.push("styles:build")
                Exists.scripts && tasks.push("scripts:build")
                Exists.templates && tasks.push("templates")

                tasks.push(() => Serve.init(), "watch:build")

                gulp.series(tasks)(resolve)
            })

            gulp.task("serve:production", (resolve) => {
                let tasks = [];

                if (Config.serve.mode === "") {
                    Config.serve.mode = "production";
                }

                !Config.local && tasks.push("cleanup", "cdn")
                Exists.assets && tasks.push("assets:production")
                Exists.icons && tasks.push("icons:production")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")
                Exists.templates && tasks.push("templates:production")

                tasks.push(() => Serve.init(), "watch:production")

                gulp.series(tasks)(resolve)
            })
        }

        if (Exists.icons) {
            gulp.task("icons", (resolve) => {
                if (Config.icons.id !== "") {
                    gulp.series(new Icons().fetch)(resolve)
                } else {
                    resolve()
                }
            })

            gulp.task("icons:build", (resolve) => {
                Config.icons.optimizations = false;
                Config.icons.revision = false;

                if (Config.icons.id !== "") {
                    gulp.series(new Icons().fetch, new Icons().build)(resolve)
                } else {
                    return new Icons().build()
                }
            })

            gulp.task("icons:production", () => {
                return new Icons().build()
            })
        }

        if (Exists.scripts) {
            if (!Config.vite) {
                gulp.task("scripts", (resolve) => {
                    gulp.series(new Utils().importMap, new Scripts().importResolution)(resolve)
                })

                gulp.task("scripts:build", (resolve) => {
                    Config.scripts.revision = false;
                    Config.scripts.optimizations = false;
                    Config.scripts.legacy = false;

                    gulp.series(new Utils().importMap, new Scripts().importResolution, new Scripts().build)(resolve)
                })

                gulp.task("scripts:production", (resolve) => {
                    gulp.series(new Utils().importMap, new Scripts().importResolution, new Scripts().build)(resolve)
                })
            } else {
                gulp.task("scripts", (resolve) => {
                    gulp.series(new Scripts().importResolution)(resolve)
                })
            }
        }

        if (Exists.styles) {
            gulp.task("styles", (resolve) => {
                gulp.series(new Styles().importResolution)(resolve)
            })

            if (!Config.vite) {
                gulp.task("styles:build", (resolve) => {
                    Config.styles.revision = false;
                    Config.styles.purge.enabled = false;
                    Config.styles.optimizations = false;
                    Config.styles.vendor.cache = true;
                    Config.styles.import = ['local'];

                    gulp.series(new Styles().importResolution, new Styles().tailwind, new Styles().build)(resolve)
                })

                gulp.task("styles:production", (resolve) => {
                    gulp.series(new Styles().importResolution, new Styles().tailwind, new Styles().build)(resolve)
                })
            }
        }

        if (Exists.templates) {
            gulp.task("templates", () => {
                return new Templates().build("development").then(Functions.serverReload);
            })

            gulp.task("templates:production", () => {
                return new Templates().build("production").then(Functions.serverReload);
            })
        }

        if (Exists.assets) {
            gulp.task("assets", async () => {
                return gulp.src(`${root + Config.paths.input.assets}/**`)
                    .pipe(gulp.dest(root + Config.paths.output.assets))
            })

            gulp.task("assets:production", () => {
                return new Promise(async (resolve) => {
                    const revision = (await import("gulp-rev")).default;

                    gulp.src(`${root + Config.paths.input.assets}/**`)
                        .pipe(gulpif(Config.assets.revision, revision()))
                        .pipe(Functions.revUpdate(true, "assets"))
                        .pipe(gulp.dest(root + Config.paths.output.assets))
                        .pipe(revision.manifest())
                        .pipe(gulp.dest(root + Config.paths.output.assets))
                        .on("end", resolve)
                })
            })
        }

        if (Exists.emails) {
            gulp.task("emails", () => {
                return new Emails().build()
            })

            gulp.task("emails:zip", () => {
                return new Emails().zip()
            })
        }

        gulp.task("watch", () => {
            new Watch().dev();
        })

        if (!Config.vite) {
            gulp.task("watch:build", () => {
                new Watch().build("build");
            })

            gulp.task("watch:production", () => {
                new Watch().build("production");
            })
        }

        if (typeof Package.scripts !== "undefined") {
            Object.keys(Package.scripts).forEach((script) => {
                gulp.task(script, (resolve) => {
                    Functions.execSync(Package.scripts[script]);
                    resolve()
                })
            })
        }

        if (!Config.vite && typeof Config.modules.cms !== "undefined") {
            gulp.task("cms:install", () => {
                return new Config.modules.cms().install()
            })

            gulp.task("cms:prepare", (done) => {
                return new Config.modules.cms().prepare(done)
            })
        }
    }
}

export {Core, Utils, Templates, Styles, Scripts, Icons, Watch, Emails, Exists, Modules, Functions, Package, Config, root}
