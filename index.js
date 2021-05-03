import gulp from "gulp";
import path from "path";
import fs from "fs";
import fse from "fs-extra";
import nodeCmd from "child_process";
import through from "through2";
import plumber from "gulp-plumber";
import gulpif from "gulp-if";
import lazypipe from "lazypipe";
import minifier from "html-minifier";
import lodash from "lodash";
import https from "https";
import glob from "glob";

import twig from "gulp-twig2html";
import autoprefixer from "autoprefixer";
import postcss from "gulp-postcss";
import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssCustomSelectors from "postcss-custom-selectors";
import postcssCustomMedia from "postcss-custom-media";

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
    serve: {
        index: "/index.html",
        mode: ""
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
        purge: {
            enabled: true,
            content: [],
            docs: false,
            options: {},
            nodeResolve: true,
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
        }
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

export class Utils {
    cleanup() {
        return new Promise(resolve => {
            if (fs.existsSync(root + Config.paths.temp)) {
                fse.emptyDirSync(root + Config.paths.temp);
            }

            if (fs.existsSync(root + Config.paths.output.assets) && Config.paths.output.assets !== Config.paths.output.root) {
                fse.removeSync(root + Config.paths.output.assets);
            }

            if (fs.existsSync(root + Config.paths.output.styles)) {
                fse.removeSync(root + Config.paths.output.styles);
            }

            if (fs.existsSync(root + Config.paths.output.scripts)) {
                fse.removeSync(root + Config.paths.output.scripts);
            }

            (function(){
                if (fs.existsSync(`${root + Config.paths.input.templates}/`)) {
                    let pages = fs.readdirSync(`${root + Config.paths.input.templates}/`),
                        items = pages.length;

                    for (let i = 0; i < items; i++) {
                        if (fs.existsSync(`${root + Config.paths.output.root}/${pages[i]}`)) {
                            fs.unlinkSync(`${root + Config.paths.output.root}/${pages[i]}`);
                        } else if (fs.existsSync(`${root + Config.paths.output.root}/${pages[i].replace('.json', '.html')}`)) {
                            fs.unlinkSync(`${root + Config.paths.output.root}/${pages[i].replace('.json', '.html')}`);
                        }
                    }
                }
            })();

            resolve()
        });
    }
    importMap() {
        return new Promise((resolve) => {
            fs.readFile(`package.json`, 'utf8', (err, data) => {
                let dependencies = JSON.parse(data)["dependencies"];
                let cdn = Config.scripts.importMap.cdn;
                let version = "";
                let url;
                let urlSub;
                let imports = JSON.parse(data)["imports"];
                let importMap = {
                    "imports": {}
                };

                if (typeof dependencies === "undefined") {
                    resolve();
                    return false;
                }

                if (cdn === "esm.sh") {
                    if (Config.scripts.importMap.version !== "") {
                        version = `${Config.scripts.importMap.version}/`
                    }
                    if (!Config.scripts.importMap.shortUrl) {
                        url = `https://cdn.esm.sh/${version}{DEPENDENCY}@{VERSION}/${Config.scripts.importMap.target}/{DEPENDENCY}.js`;
                        urlSub = `https://cdn.esm.sh/${version}{DEPENDENCY}@{VERSION}/${Config.scripts.importMap.target}/`;
                    } else {
                        url = `https://esm.sh/{DEPENDENCY}@{VERSION}`;
                        urlSub = "https://esm.sh/{DEPENDENCY}@{VERSION}/";
                    }
                } else if (cdn === "esm.run") {
                    if (!Config.scripts.importMap.shortUrl) {
                        url = "https://cdn.jsdelivr.net/npm/{DEPENDENCY}@{VERSION}/+esm";
                        urlSub = "https://cdn.jsdelivr.net/npm/{DEPENDENCY}@{VERSION}/";
                    } else {
                        url = `https://esm.run/{DEPENDENCY}@{VERSION}`;
                        urlSub = "https://esm.run/{DEPENDENCY}@{VERSION}/";
                    }
                } else if (cdn === "jspm.dev") {
                    url = `https://jspm.dev/{DEPENDENCY}@{VERSION}`;
                    urlSub = "https://jspm.dev/{DEPENDENCY}@{VERSION}/";
                }

                Object.keys(dependencies).forEach((dependency) => {
                    if (dependency.includes("/") && cdn === "esm.sh") {
                        importMap.imports[dependency] = url.replace("{DEPENDENCY}", dependency).replace("{VERSION}", dependencies[dependency].replace("^","")).replace("{DEPENDENCY}", dependency.split("/")[1])
                    } else {
                        importMap.imports[dependency] = url.replace(new RegExp("{DEPENDENCY}", 'g'), dependency).replace("{VERSION}", dependencies[dependency].replace("^",""))
                    }

                    if (dependency.match(Config.scripts.importMap.trailingSlashes)) {
                        importMap.imports[`${dependency}/`] = urlSub.replace("{DEPENDENCY}", dependency).replace("{VERSION}", dependencies[dependency].replace("^",""))
                    }
                });

                if (typeof imports !== "undefined") {
                    importMap = {
                        "imports": Object.assign(importMap.imports, imports)
                    };
                }

                if (!fs.existsSync(root + Config.paths.output.root)){
                    fs.mkdirSync(root + Config.paths.output.root);
                }

                fs.writeFileSync(root + Config.paths.output.root + "/importmap.json", JSON.stringify(importMap),'utf8');
                resolve();
            })
        })
    }
    async cdn(type, inject) {
        const replace = (await import('gulp-replace')).default;
        const dir = root + Config.paths.cdn;

        let cdnPaths = [];
        let sri = {};

        if (!fs.existsSync(root + Config.paths.cdn)){
            fs.mkdirSync(root + Config.paths.cdn);
        }

        function spawnCmd(cmd) {
            try {
                return nodeCmd.execSync(cmd).toString();
            }
            catch (error) {
                return error.output[1].toString()
            }
        }

        const downloadFiles = async (url) => {
            let urlName = url.lastIndexOf("/");
            let fileName = url.substring(urlName + 1, url.length);

            if (!fs.existsSync(root + Config.paths.cdn + "/" + fileName)) {
                await Functions.download(url, dir + "/" + fileName);
            }

            sri[url] = `sha256-${spawnCmd(`cat ${root + Config.paths.cdn}/${fileName} | openssl dgst -sha256 -binary | openssl base64 -A`)}`;

            cdnPaths.push(url.substring(0, urlName));
        }

        if (type === "templates") {
            if (fs.existsSync(`${root + Config.paths.input.main}`)) {
                const main = fs.readFileSync(root + Config.paths.input.main).toString();

                let urls = JSON.parse(main)["assets"]["js"];
                let files = []

                Object.keys(urls).forEach((name) => {
                    if (Array.isArray(urls[name])) {
                        urls[name].forEach(async (url) => {
                            if (url.includes("http")) {
                                files.push(downloadFiles(url))
                            }
                        })
                    } else {
                        if (urls[name].includes("http") && !urls[name].includes("?")) {
                            files.push(downloadFiles(urls[name]))
                        }
                    }
                })

                await Promise.all(files);
            }

            if (!fs.existsSync(root + Config.paths.output.root)) {
                fs.mkdirSync(root + Config.paths.output.root);
            }

            fs.writeFileSync(`${root + Config.paths.output.root}/sri.json`, JSON.stringify(sri));

            // TODO
            if (inject === true) {
                let task = gulp.src(root + Config.paths.output.root + '/*.html');

                cdnPaths.forEach(function(rep) {
                    task = task.pipe(replace(rep, `/${Config.paths.cdn}`));
                });

                task.pipe(gulp.dest(root + Config.paths.output.root));
            }
        }

        if (type === "scripts") {
            if (fs.existsSync(`${root + Config.paths.input.scripts}/Utils/cdn.js`)) {
                const urls = fs.readFileSync(`${root + Config.paths.input.scripts}/Utils/cdn.js`).toString().split(/\r?\n/g);

                let files = []

                Object.keys(urls).forEach(name => {
                    if (urls[name].includes("http") && !urls[name].includes("?")) {
                        let url = urls[name].substring(urls[name].indexOf("http"), urls[name].lastIndexOf('"'));

                        cdnPaths.push(url);
                        files.push(downloadFiles(url));
                    }
                });

                await Promise.all(files);
            }

            if (fs.existsSync(`${root + Config.paths.output.root}/importmap.json`) && Config.scripts.importMap.localDownload) {
                let importmap = JSON.parse(fs.readFileSync(`${root + Config.paths.output.root}/importmap.json`).toString());
                let files = []

                Object.keys(importmap["imports"]).map((name) => {
                    let filename = "esm." + name.replace(new RegExp("/", 'g'),"-") + ".js";

                    if (!fs.existsSync(root + Config.paths.cdn + "/" + filename) && name.slice(-1) !== "/") {
                        files.push(Functions.download(importmap["imports"][name], dir + "/" + filename));
                        importmap["imports"][name] = "/" + dir + "/" + filename;
                    }
                });

                await Promise.all(files);

                if (fs.existsSync(dir + "/" + "importmap.json")) {
                    importmap = Object.assign(data, JSON.parse(fs.readFileSync(dir + "/" + "importmap.json").toString()));
                }

                fs.writeFileSync(dir + "/" + "importmap.json", JSON.stringify(importmap));
            }

            // TODO
            if (inject === true) {
                let task_js = gulp.src(root + Config.paths.output.scripts + "/" + JSON.parse(fs.readFileSync(root + Config.paths.output.scripts + "/rev-manifest.json", 'utf8').toString())["core.js"]);

                cdnPaths.forEach(function (rep) {
                    task_js = task_js.pipe(replace(rep, "/" + root + Config.paths.cdn));
                });

                task_js.pipe(gulp.dest(root + Config.paths.output.scripts));
            }
        }

        if (type === "styles") {
            if (fs.existsSync(`${root + Config.paths.input.styles}/${Config.styles.vendor.path}`) && Config.styles.vendor.path.length !== 0) {
                const urls = fs.readFileSync(`${root + Config.paths.input.styles}/${Config.styles.vendor.path}`).toString().split(/\r?\n/g);

                let files = [];

                Object.keys(urls).forEach(name => {
                    if (urls[name].includes("http")) {
                        files.push(downloadFiles(urls[name].substring(urls[name].indexOf("http"), urls[name].length - 2)))
                    }
                })

                await Promise.all(files)
            }
        }
    }
    postcssPlugins(config, after) {
        let plugins = [postcssImport, postcssNesting, postcssCustomMedia, postcssCustomSelectors];

        if (Exists.postcssConfig) {
            return {config: root}
        } else if (typeof config.extend !== "undefined") {
            plugins = plugins.concat(config.extend)
        } else if (Array.isArray(config) && config.length !== 0) {
            return config;
        }

        return plugins.concat(after);
    }
}

export class Scripts {
    importResolution() {
        return new Promise(resolve => {
            Config.scripts.importResolution.directories.map(directory => {
                if (!fs.existsSync(`${root + Config.paths.input.scripts}/${directory}`)) {
                    console.log("\x1b[31m", `importResolution - ${Config.paths.input.scripts}/${directory} doesn't exists`, "\x1b[0m");
                    return false;
                }

                let items = fs.readdirSync(`${root + Config.paths.input.scripts}/${directory}`);

                function findPaths(items, directory) {
                    let imports = "";

                    items.map(item => {
                        let path = `${directory}/${item}`;

                        if (fs.statSync(path).isFile()) {
                            if (path.includes(".js") && !path.includes(Config.scripts.importResolution.filename)) {
                                if (fs.readFileSync(path).toString().includes("export default")) {
                                    imports = imports + `export { default as ${item.replace(".js","")} } from './${item}';\r\n`
                                } else {
                                    imports = imports + `import './${item}';\r\n`
                                }
                            }
                        } else {
                            if (Config.scripts.importResolution.subDir) {
                                imports = imports + `import "${item}/${Config.scripts.importResolution.filename}";\r\n`
                            }
                            findPaths(fs.readdirSync(path), path);
                        }
                    });

                    let path = `${directory}/${Config.scripts.importResolution.filename}`;

                    if (fs.existsSync(path) && fs.readFileSync(path).toString() !== imports || !fs.existsSync(path)) {
                        fs.writeFileSync(path, imports);
                    }
                }

                findPaths(items, `${root + Config.paths.input.scripts}/${directory}`);
            });

            resolve();
        });
    }
    async build(type) {
        const {rollup} = await import('rollup');
        const {nodeResolve} = await import('@rollup/plugin-node-resolve');
        const commonjs = (await import('@rollup/plugin-commonjs')).default;
        const {terser} = await import('rollup-plugin-terser');
        const {rollupImportMapPlugin} = (await import('rollup-plugin-import-map'));
        const replace = (await import('@rollup/plugin-replace')).default;

        return new Promise(resolve => {
            fse.removeSync(root + Config.paths.output.scripts);

            const hashManifest = function(opts = {}) {
                const defaults = {
                    path: root + Config.paths.output.scripts
                };

                opts = Object.assign({}, defaults, opts);
                let inputs;

                return {
                    options({ input }) {
                        inputs = input;
                        if (typeof inputs === "string") {
                            inputs = [inputs];
                        }
                        if (typeof inputs === "object") {
                            inputs = Object.values(inputs);
                        }
                    },
                    generateBundle(_outputOptions, bundle) {
                        let map = {};
                        return Promise.all(inputs.map(id => this.resolve(id))).then(
                            resolvedInputs => {
                                for (const key of Object.keys(bundle)) {
                                    const idx = resolvedInputs.findIndex(
                                        input => input.id in (bundle[key].modules || {})
                                    );
                                    if (idx !== -1) {
                                        const name = inputs[idx].split("/")[inputs[idx].split("/").length - 1];
                                        map[name] = bundle[key].fileName;
                                    }
                                }

                                if (fs.existsSync(opts.path + "/rev-manifest.json")) {
                                    map = Object.assign(JSON.parse(fs.readFileSync(opts.path + "/rev-manifest.json").toString()), map);
                                }

                                fs.writeFileSync(opts.path + "/rev-manifest.json", JSON.stringify(map, null, "  "));
                            }
                        );
                    }
                };
            }

            let assetsManifest = fs.existsSync(`${root + Config.paths.output.assets}/rev-manifest.json`) ? JSON.parse(fs.readFileSync(`${root + Config.paths.output.assets}/rev-manifest.json`).toString()) : {};
            let importMapFile = fs.existsSync(`${root + Config.paths.output.root}/importmap.json`) ? JSON.parse(fs.readFileSync(`${root + Config.paths.output.root}/importmap.json`).toString()) : {};
            let files = fs.readdirSync(root + Config.paths.input.scripts);

            if (!fs.existsSync(root + Config.paths.output.scripts)){
                fs.mkdirSync(root + Config.paths.output.scripts);
            }

            Promise.all(files.map(async file => {
                if (!fs.statSync(`${root + Config.paths.input.scripts}/${file}`).isDirectory()) {
                    await (async() => {

                        const inputOptions = {
                            context: 'window',
                            preserveEntrySignatures: true,
                            plugins: [
                                (Config.scripts.importMap.build && typeof importMapFile["imports"] !== "undefined") && rollupImportMapPlugin(importMapFile),
                                !Config.scripts.importMap.build && nodeResolve(),
                                !Config.scripts.importMap.build && commonjs(),
                                replace({
                                    preventAssignment: true,
                                    values: Object.assign({
                                        'process.env.NODE_ENV': JSON.stringify('production')
                                    }, assetsManifest)
                                }),
                                Config.scripts.optimizations && terser(),
                                Config.scripts.revision && hashManifest()
                            ]
                        };

                        const outputOptions = {
                            dir: root + Config.paths.output.scripts,
                            format: 'es',
                            sourcemap: false,
                            compact: true,
                            entryFileNames: `[name]${Config.scripts.revision ? ".[hash]" : ""}.js`,
                            chunkFileNames: '[name].[hash].js'
                        };

                        const bundle = await rollup(Object.assign({input: root + Config.paths.input.scripts + '/' + file}, inputOptions));

                        await bundle.write(outputOptions);

                        await bundle.close();
                    })();

                    type === "production" && Config.scripts.legacy && await (async() => {

                        const {getBabelOutputPlugin} = await import('@rollup/plugin-babel');

                        const inputOptions = {
                            context: 'window',
                            preserveEntrySignatures: false,
                            plugins: [
                                nodeResolve(),
                                commonjs(),
                                replace({
                                    preventAssignment: true,
                                    values: Object.assign({
                                        'process.env.NODE_ENV': JSON.stringify('production')
                                    }, assetsManifest)
                                }),
                                Config.scripts.revision && hashManifest({path: root + Config.paths.output.scripts + "/es5/"})
                            ]
                        };

                        const outputOptions = {
                            dir: root + Config.paths.output.scripts + "/es5/",
                            format: 'es',
                            sourcemap: false,
                            compact: true,
                            entryFileNames: `[name]${Config.scripts.revision ? ".[hash]" : ""}.js`,
                            chunkFileNames: '[name].[hash].js',
                            plugins: [
                                getBabelOutputPlugin({
                                    presets: [['@babel/env', { modules: 'amd',
                                        targets: {
                                            "ie": "11"
                                        },
                                        useBuiltIns: 'entry',
                                        corejs: "3.8"
                                    }]]
                                }),
                            ]
                        };

                        if (!fs.existsSync(root + Config.paths.output.scripts + "/es5")){
                            fs.mkdirSync(root + Config.paths.output.scripts + "/es5");
                        }

                        const bundle = await rollup(Object.assign({input: root + Config.paths.input.scripts + `/${file}`}, inputOptions));

                        await bundle.write(outputOptions);

                        await bundle.close();
                    })();
                }
            })).then(async () => {
                type === "production" && Config.scripts.legacy && await (async() => {
                    let polyfills = "";

                    if (typeof Config.scripts.polyfillUrls !== "undefined") {
                        Config.scripts.polyfillUrls.map((script) => {
                            polyfills = polyfills.concat(`document.write('<script src="${script}"><\\/script>');`)
                        });
                    }

                    fs.writeFileSync(root + Config.paths.temp + `/polyfills.js`, Functions.stripIndent(`
                        document.write('<script src="https://polyfill.io/v3/polyfill.min.js?features=${Config.scripts.polyfillFeatures}"><\\/script>');
                        document.write('<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.5.0/dist/fetch.umd.min.js"><\\/script>');
                        document.write('<script src="https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.7/runtime.min.js"><\\/script>');
                        document.write('<script src="https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.min.js"><\\/script>');
                        ${polyfills}
                    `).replace(/^\s*\n/g, ""));

                    const inputOptions = {
                        context: 'window',
                        preserveEntrySignatures: false,
                        plugins: [
                            Config.scripts.revision && hashManifest({path: root + Config.paths.output.scripts + "/es5/"})
                        ]
                    };

                    const outputOptions = {
                        dir: root + Config.paths.output.scripts + "/es5/",
                        format: 'es',
                        sourcemap: false,
                        compact: true,
                        entryFileNames: `[name]${Config.scripts.revision ? ".[hash]" : ""}.js`
                    };
                    const bundle = await rollup(Object.assign({input: root + Config.paths.temp + `/polyfills.js`}, inputOptions));

                    await bundle.write(outputOptions);

                    await bundle.close();
                })();

                resolve();
            });
        });
    }
}

export class Styles {
    get purge() {
        return {
            files: () => {
                let purgeFiles = Config.styles.purge.content;
                let dependencies = JSON.parse(fs.readFileSync(`package.json`).toString()).dependencies;

                if (typeof dependencies !== "undefined" && Config.styles.purge.nodeResolve) {
                    Object.keys(dependencies).map(lib => {
                        purgeFiles.push(`node_modules/${lib}/**/*.js`)
                    });
                }

                if (Config.styles.purge.docs) {
                    purgeFiles = purgeFiles.toString().replace("/*." + Config.templates.format, "/!(Ui)." + Config.templates.format).split(",");
                }

                return purgeFiles;
            },
            config: () => {
                return Object.assign({
                    content: this.purge.files(),
                    extractors: [
                        {
                            extractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
                            extensions: ['html', 'js', 'hbs', 'tpl', 'latte', 'twig']
                        }
                    ]
                }, Config.styles.purge.options)
            }
        }
    }
    importResolution() {
        return new Promise(resolve => {
            Config.styles.importResolution.directories.map(directory => {
                if (!fs.existsSync(`${root + Config.paths.input.styles}/${directory}`)) {
                    console.log("\x1b[31m", `importResolution - ${root + Config.paths.input.styles}/${directory} doesn't exists`, "\x1b[0m");
                    return false;
                }

                let items = fs.readdirSync(`${root + Config.paths.input.styles}/${directory}`);

                function findPaths(items, directory) {
                    let imports = "";

                    items.map(item => {
                        let path = `${directory}/${item}`;

                        if (fs.statSync(path).isFile()) {
                            if (path.includes(`.${Config.styles.format}`) && !path.includes(Config.styles.importResolution.filename)) {
                                imports = imports + `@import "${item}";\r\n`
                            }
                        } else {
                            if (Config.styles.importResolution.subDir) {
                                imports = imports + `@import "${item}/${Config.styles.importResolution.filename}";\r\n`
                            }
                            findPaths(fs.readdirSync(path), path);
                        }
                    });

                    let path = `${directory}/${Config.styles.importResolution.filename}`;

                    if (imports.length !== 0) {
                        if (fs.existsSync(path) && fs.readFileSync(path).toString() !== imports || !fs.existsSync(path)) {
                            fs.writeFileSync(path, imports);
                        }
                    } else if (fs.readFileSync(path).toString() !== "/* empty */") {
                        fs.writeFileSync(path, "/* empty */");
                    }
                }

                findPaths(items, `${root + Config.paths.input.styles}/${directory}`);
            });

            resolve();
        })
    }
    async tailwind() {
        const cleanCSS = (await import("./packages/gulp-clean-css/index.js")).default;
        const tailwindcss = (await import("tailwindcss")).default;
        const purgeCSS = (await import("gulp-purgecss")).default;

        if (!fs.existsSync(`${root + Config.paths.input.styles}/${Config.styles.tailwind.basename}`)) {
            Config.styles.format === "less" && await new Promise(resolve => {
                if (fs.readdirSync(root + Config.paths.temp).toString().includes("-modifiers") && Config.styles.tailwind.cache) {
                    resolve();
                    return false;
                }

                const purge = lazypipe().pipe(purgeCSS, new Styles().purge.config());

                gulp.src([`${root + Config.paths.input.styles}/*-modifiers.less`])
                    .pipe(plumber(Functions.plumber))
                    .pipe(Modules.less.module())
                    .pipe(gulpif(Config.styles.purge.enabled, purge()))
                    .pipe(Modules.autoprefixer.pipe())
                    .pipe(gulp.dest(root + Config.paths.temp))
                    .on("end", resolve)
            })

            return new Promise(resolve => resolve())
        }

        return new Promise(resolve => {
            if (fs.existsSync(`${root + Config.paths.temp}/${Config.styles.tailwind.basename}`) && Config.styles.tailwind.cache) {
                resolve();
                return false;
            }

            const clean = lazypipe().pipe(cleanCSS, {
                inline: Config.styles.import,
                level: {1: {specialComments: 0}, 2: {all: false}}
            });

            const purge = lazypipe().pipe(purgeCSS, Object.assign({
                content: Config.styles.purge.content,
                extractors: [
                    {
                        extractor: content => content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [],
                        extensions: ['html', 'js', 'hbs', 'tpl', 'latte', 'twig']
                    }
                ]
            }, Config.styles.purge.tailwind));

            let tailwindcssConfig = {};

            if (!Exists.tailwindConfig) {
                tailwindcssConfig = { config: Config.tailwind }
            }

            gulp.src(`${root + Config.paths.input.styles}/${Config.styles.tailwind.basename}`)
                .pipe(postcss(new Utils().postcssPlugins(Config.styles.tailwind.postcss, [tailwindcss(tailwindcssConfig), autoprefixer])))
                .pipe(gulpif(Config.styles.purge.enabled, purge()))
                .pipe(gulpif(Config.styles.optimizations, clean()))
                .pipe(gulp.dest(root + Config.paths.temp))
                .on("end", resolve)
        })
    }
    async build() {
        const cleanCSS = (await import("./packages/gulp-clean-css/index.js")).default;
        const purgeCSS = (await import("gulp-purgecss")).default;
        const revision = (await import("gulp-rev")).default;
        const revRewrite = require('gulp-rev-rewrite');

        const clean = lazypipe().pipe(cleanCSS, {
            inline: Config.styles.import,
            level: {1: {specialComments: 0}, 2: {all: false}}
        });

        const purge = lazypipe().pipe(purgeCSS, new Styles().purge.config());

        const rev = lazypipe().pipe(revision).pipe(Functions.revUpdate, true)
                    .pipe(revRewrite, {manifest: fs.existsSync(`${root + Config.paths.output.assets}/rev-manifest.json`) ? fs.readFileSync(`${root + Config.paths.output.assets}/rev-manifest.json`) : ""});

        const ratio = (source) => {
            let sourceFiles = [],
                ratios = [];

            source.forEach((pathPattern) => {
                let files = glob.sync(pathPattern);
                sourceFiles = sourceFiles.concat(files);
            });

            sourceFiles.forEach((path) => {
                let data = fs.readFileSync(path);
                if (data.toString().indexOf('data-ratio') >= 0) {
                    ratios = ratios.concat(data.toString().match(/data-ratio="([0-9-/ _]*)"/g));
                }
            });

            return through.obj((file, enc, cb) => {
                if (!Config.styles.ratio.files.includes(file.basename)) {
                    cb(null, file);
                    return false;
                }

                if (file.isNull()) {
                    cb(null, file);
                }

                if (file.isBuffer()) {
                    let ratiosFinal = Array.from(new Set(ratios)),
                        ratiosStyles = [];

                    const ratio = (val) => {
                        let value = `[${val}]{aspect-ratio: ${val.match(/\d+/g)[0]} / ${val.match(/\d+/g)[1]}}`;

                        if (file.extname === ".less") {
                            let calc = (val.match(/\d+/g)[1] / val.match(/\d+/g)[1]) * 100;
                            value = `[${val}]:before{padding-bottom: ${calc}%}`
                        }

                        return value;
                    }

                    ratiosFinal.forEach((val) => {
                        ratiosStyles.push(ratio(val));
                    });

                    file.contents = Buffer.from(file.contents.toString() + "\n" + ratiosStyles.join("\n"));
                    cb(null, file);
                }
            });
        };

        const vendor = () => {
            return through.obj((file, enc, cb) => {
                if (file.isNull()) {
                    cb(null, file);
                }
                if (file.isBuffer()) {
                    if (Config.styles.vendor.path.length !== 0 && (fs.existsSync(`${root + Config.paths.input.styles}/${Config.styles.vendor.path}`) && Config.local === true || fs.existsSync(`${root + Config.paths.input.styles}/${Config.styles.vendor.path}`) && Config.styles.vendor.cache === true)) {
                        let vendorUrl = fs.readFileSync(`${root + Config.paths.input.styles}/${Config.styles.vendor.path}`).toString().replace(/url\((.*)\//g,`url(../../${Config.paths.cdn}/`);

                        file.contents = Buffer.from(file.contents.toString().replace(`@import "${Config.styles.vendor.path}";`, vendorUrl));
                    }
                    cb(null, file);
                }
            });
        }

        const join = () => {
            return through.obj((file, enc, cb) => {
                if (file.isNull()) {
                    cb(null, file);
                }
                if (file.isBuffer()) {
                    Object.keys(Config.styles.join).forEach(joinFile => {
                        if (joinFile === file.basename) {
                            let contents = file.contents.toString();

                            Config.styles.join[joinFile].forEach(targetFile => {
                                if (fs.existsSync(root + targetFile)) {
                                    contents += fs.readFileSync(root + targetFile).toString();
                                }
                            })

                            file.contents = Buffer.from(contents);
                        }
                    });
                    cb(null, file);
                }
            });
        }

        const aspectRatio = () => {
            return {
                postcssPlugin: 'aspect-ratio',
                Declaration: {
                    'aspect-ratio': (decl, {Rule, Declaration}) => {
                        const rule = decl.parent
                        const selector = rule.selector
                        const beforeRule = new Rule({selector: `${selector}:before`, raws: {after: rule.raws.after, semicolon: rule.raws.semicolon}})
                        const ratio = decl.value.replace(/['"]?((?:\d*\.?\d*)?)(?:\s*[:|\/]\s*)(\d*\.?\d*)['"]?/g, (match, width, height) => {
                            return (height / width) * 100 + '%'
                        })

                        beforeRule.append([
                            new Declaration({prop: 'padding-bottom', value: ratio}),
                        ])

                        rule.after(beforeRule)

                        rule.nodes.length === 1 ? rule.remove() : decl.remove()
                    },
                }
            }
        }

        aspectRatio.postcss = true;

        const build = lazypipe().pipe(() => gulpif("*.css", postcss(new Utils().postcssPlugins(Config.styles.postcss, [autoprefixer, aspectRatio])))
        ).pipe(() => gulpif("*.less", Modules.less.module()));

        return new Promise(resolve => {
            gulp.src([`${root + Config.paths.input.styles}/*.{css,less}`, `!${root + Config.paths.input.styles}/${Config.styles.tailwind.basename}`, `!${root + Config.paths.input.styles}/*-modifiers.less`])
                .pipe(plumber(Functions.plumber))
                .pipe(ratio(Config.styles.ratio.content))
                .pipe(vendor())
                .pipe(build())
                .pipe(gulpif(Config.styles.purge.enabled, purge()))
                .pipe(Modules.autoprefixer.pipe())
                .pipe(gulpif(Config.styles.optimizations, clean()))
                .pipe(join())
                .pipe(gulpif(Config.styles.revision, rev()))
                .pipe(gulp.dest(root + Config.paths.output.styles))
                .pipe(revision.manifest(root + Config.paths.output.styles + "/rev-manifest.json",{
                    merge: true,
                    base: root + Config.paths.output.styles
                }))
                .pipe(gulp.dest(root + Config.paths.output.styles))
                .on("end", resolve)
        })
    }
}

export class Templates {
    get functions() {
        return {
            "color": (color, theme) => {
                if (typeof theme === "undefined") {
                    theme = "main"
                }

                if (!Exists.styles) {
                    return "inherit"
                }

                if ((theme || color) && Config.styles.themePath.length !== 0) {
                    let pathColors = Config.styles.themePath.replace("{THEME}", theme).replace("{FORMAT}", Config.styles.format);

                    if (fs.existsSync(`${root + Config.paths.input.styles}/${pathColors}`)) {
                        let colors = fs.readFileSync(`${root + Config.paths.input.styles}/${pathColors}`, 'utf8').toString();
                        let parse = colors.substring(colors.indexOf(color)+color.length+1,colors.length);

                        return parse.substring(0,parse.indexOf(";")).replace(" ", "");
                    }
                }
            },
            "fetch": (data) => {
                if (typeof data !== "undefined") {
                    if (!fs.existsSync(root + Config.paths.cdn)){
                        fs.mkdirSync(root + Config.paths.cdn);
                    }
                    if (data.indexOf("http") > -1) {
                        if (data.indexOf("googleapis.com") > -1) {
                            let google_name = data.substring(data.indexOf("=") + 1, data.length).toLowerCase(),
                                google_name_path = root + Config.paths.cdn + "/inline." + google_name.substring(0,google_name.indexOf(":")) + ".css";

                            if (fs.existsSync(google_name_path)) {
                                return fs.readFileSync(google_name_path, 'utf8').toString();
                            } else {
                                (async() => await Functions.download(data, google_name_path))()

                                return fs.readFileSync(google_name_path, 'utf8').toString();
                            }
                        } else {
                            let font_name = data.substring(data.lastIndexOf("/") + 1, data.length).toLowerCase(),
                                font_name_path = root + Config.paths.cdn + "/inline." + font_name;

                            if (fs.existsSync(font_name_path)) {
                                return fs.readFileSync(font_name_path, 'utf8').toString();
                            } else {
                                (async() => await Functions.download(data, font_name_path))()

                                return fs.readFileSync(font_name_path, 'utf8').toString();
                            }
                        }
                    } else {
                        let slash = data.indexOf("/")+1;
                        if (slash > 1) {
                            slash = 0;
                        }

                        return fs.readFileSync(root + data.substring(slash,data.length),'utf8').toString();
                    }
                }
            },
            "randomColor": () => {
                return "#" + Math.random().toString(16).slice(2, 8);
            },
            "placeholder": (width, height, picsum, colors) => {
                if (typeof colors === "undefined") {
                    colors = ["333", "444", "666", "222", "777", "888", "111"];
                } else {
                    colors = [colors]
                }
                if (Config.local === false) {
                    let webp = "";
                    if (Config.templates.placeholder.webp === true) {
                        webp = ".webp"
                    }
                    if (!Config.templates.placeholder.picsum) {
                        if(Config.templates.placeholder.lorempixel === ""){

                            return "https://via.placeholder.com/"+width+"x"+height+"/"+colors[Math.floor(Math.random()*colors.length)]+`${webp}`;
                        }
                        else {
                            return "https://lorempixel.com/"+width+"/"+height+"/"+Config.templates.placeholder.lorempixel+"/"+Math.floor(Math.random()*10);
                        }
                    } else {
                        if (!isNaN(picsum)) {
                            return "https://picsum.photos/"+width+"/"+height+webp+"?image="+ picsum;
                        } else {
                            return "https://picsum.photos/"+width+"/"+height+webp+"?image="+ Math.floor(Math.random() * 100);
                        }
                    }
                } else {
                    let text = width+"x"+height,
                        svg = encodeURIComponent(Functions.stripIndent('<svg width="'+width+'" height="'+height+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" preserveAspectRatio="none"><defs><style type="text/css">#holder text {fill: #969696;font-family: sans-serif;font-size: 18px;font-weight: normal}</style></defs><g id="holder"><rect width="100%" height="100%" fill="#'+colors[Math.floor(Math.random()*colors.length)]+'"></rect><g><text text-anchor="middle" x="50%" y="50%" dy=".3em">'+text+'</text></g></g></svg>'));

                    return "data:image/svg+xml;charset=UTF-8,"+svg;
                }
            },
            "lazy": (width, height) => {
                let svg = encodeURIComponent(Functions.stripIndent('<svg width="'+width+'" height="'+height+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'"></svg>'));

                return "data:image/svg+xml;charset=UTF-8,"+svg;
            },
            "ratio": (width, height) => {
                return (height/width) * 100;
            },
            "webfont": (data) => {
                let urls = [];

                if (typeof data["google"] !== "undefined") {
                    data["google"]["families"].forEach(function(i){
                        urls.push("https://fonts.googleapis.com/css2?family="+i);
                    });
                }

                if (typeof data["typekit"] !== "undefined") {
                    urls.push(`https://use.typekit.net/${data["typekit"]["id"]}.css`);
                }

                if (typeof data["custom"] !== "undefined") {
                    data["custom"]["urls"].forEach(function(i){
                        urls.push(i);
                    });
                }

                return urls;
            }
        }
    }
    get filters() {
        return {
            "asset": (data) => {
                let output = "";
                let path = data.substr(0, data.lastIndexOf("/"));

                if (Config.serve.mode === "dev" && path.indexOf("/" + Config.paths.input.root) === 0) {
                    return data;
                }

                if (path.indexOf("/") === 0) {
                    path = path.slice(1);
                }

                if (fs.existsSync(`${path}/rev-manifest.json`)) {
                    let rev = JSON.parse(fs.readFileSync(root + path + '/rev-manifest.json', 'utf8').toString());

                    Object.keys(rev).forEach(function eachKey(key) {
                        if (data.indexOf(key) > -1) {
                            output = data.replace(key,rev[key]);
                        }
                    })
                } else if (path.indexOf(Config.paths.output.assets) !== -1 && fs.existsSync(`${root + Config.paths.output.assets}/rev-manifest.json`)) {
                    let rev = JSON.parse(fs.readFileSync(root + Config.paths.output.assets + '/rev-manifest.json', 'utf8').toString());

                    Object.keys(rev).forEach(function eachKey(key) {
                        if (data.indexOf(key) > -1) {
                            output = data.replace(key,rev[key]);
                        }
                    })
                } else {
                    output = data;
                }

                if (output === "") {
                    output = data
                }

                if (Config.serve.mode !== "dev") {
                    output = output
                        .replace(`/${Config.paths.input.styles}`, `/${Config.paths.output.styles}`)
                        .replace(`/${Config.paths.input.scripts}`, `/${Config.paths.output.scripts}`)
                        .replace(`/${Config.paths.input.assets}`, `/${Config.paths.output.assets}`)
                }

                if (Config.paths.output.rewrite && output.indexOf(`/${Config.paths.output.root}`) === 0) {
                    output = output.replace(`/${Config.paths.output.root}`, "")
                }

                return output;
            },
            "rem": (value) => {
                return `${value/16}rem`;
            },
            "encode64": (path) => {
                let svg = encodeURIComponent(Functions.stripIndent(path));

                return "data:image/svg+xml;charset=UTF-8,"+svg;
            },
            "exists": (path) => {
                if (path.indexOf("/") === 0) {
                    path = path.slice(1);
                }

                return fs.existsSync(root + path)
            },
            "tel": (value) => {
                return value.replace(/\s+/g, '').replace("(","").replace(")","");
            }
        }
    }
    get tags() {
        return [
            (Twig) => {
                Twig.exports.extendTag({
                    type: "code",
                    regex: /^code\s+(.+)$/,
                    next: ["endcode"], // match the type of the end tag
                    open: true,
                    compile: function (token) {
                        const expression = token.match[1];

                        token.stack = Reflect.apply(Twig.expression.compile, this, [{
                            type: Twig.expression.type.expression,
                            value: expression
                        }]).stack;

                        delete token.match;
                        return token;
                    },
                    parse: function (token, context, chain) {
                        let type = Reflect.apply(Twig.expression.parse, this, [token.stack, context]);
                        let output = this.parse(token.output, context);
                        let mirror = false;

                        if (type.includes(":mirror")) {
                            mirror = true;
                            type = type.replace(":mirror", "")
                        }

                        return {
                            chain: chain,
                            output: `${mirror ? output : ""}
                            <pre style="width: 100%">
                                <code class="language-${type}">
                                    <xmp>
                                        ${output}
                                    </xmp>
                                </code>
                            </pre>`
                        };
                    }
                });
                Twig.exports.extendTag({
                    type: "endcode",
                    regex: /^endcode$/,
                    next: [ ],
                    open: false
                });
            },
            (Twig) => {
                Twig.exports.extendTag({
                    type: "json",
                    regex: /^json\s+(.+)$/,
                    next: ["endjson"],
                    open: true,
                    compile: function (token) {
                        const expression = token.match[1];

                        token.stack = Reflect.apply(Twig.expression.compile, this, [{
                            type: Twig.expression.type.expression,
                            value: expression
                        }]).stack;

                        delete token.match;
                        return token;
                    },
                    parse: function (token, context, chain) {
                        let name = Reflect.apply(Twig.expression.parse, this, [token.stack, context]);
                        let output = this.parse(token.output, context);

                        return {
                            chain: chain,
                            output: JSON.stringify({
                                [name]: minifier.minify(output, {
                                    collapseWhitespace: true,
                                    collapseInlineTagWhitespace: false,
                                    minifyCSS: true,
                                    minifyJS: true
                                })
                            })
                        };
                    }
                });
                Twig.exports.extendTag({
                    type: "endjson",
                    regex: /^endjson$/,
                    next: [ ],
                    open: false
                });
            }
        ]
    }
    async build(type) {
        const data = (await import('gulp-data')).default;
        const htmlmin = (await import('gulp-htmlmin')).default;
        const rename = (await import('gulp-rename')).default;

        const opts = {
            collapseWhitespace: type === "production",
            collapseInlineTagWhitespace: false,
            minifyCSS: true,
            minifyJS: true
        }

        const fileJSON = (file) => {
            if (path.basename(file.path).indexOf("json") > -1 || path.basename(file.path).indexOf("dialog") > -1) {
                return true;
            }
        }

        const renameJson = lazypipe().pipe(rename, { extname: '.json' });
        const renameHtml = lazypipe().pipe(rename, { extname: '.html' }).pipe(htmlmin,opts);

        let outputDir = "/" + root + Config.paths.output.root;

        if (Config.paths.output.root === Config.paths.output.assets) {
            outputDir = ""
        }

        const context = {
            config: Config,
            lang: Config.lang,
            outputPath: "/" + Config.paths.output.root,
            inputPath: "/" + Config.paths.input.root,
            resolvePath: Config.serve.mode === "dev" ? "" : outputDir,
        }

        const build = lazypipe().pipe(() => gulpif("*.twig", twig({
            functions: this.functions,
            filters: this.filters,
            extensions: this.tags,
            context: lodash.merge(context, {
                layout: {template: Config.templates.layout.replace(".twig","") + ".twig"}
            }),
            globals: root + Config.paths.input.main
        })))
        .pipe(data, (file) => {

            if (file.extname !== ".hbs") {
                return false;
            }

            let fileName = path.basename(file.path);
            let filePath = `${root + Config.paths.input.templates}/${fileName.replace(`.${Config.templates.format}`,'.json')}`;
            let main = lodash.merge({layout: {template: Config.templates.layout}}, JSON.parse(fs.readFileSync(root + Config.paths.input.main).toString()));

            if (fs.existsSync(filePath)) {
                return lodash.merge(main, JSON.parse(fs.readFileSync(filePath).toString()));
            } else {
                return main;
            }
        })
        .pipe(() => gulpif("*.hbs", Modules.hbs.module(`${root + Config.paths.input.templates}/**/*.hbs`, Modules.hbs.helpers(Object.assign(this.filters, this.functions)), context)))

        return new Promise(resolve => {
            gulp.series(
                function init(resolve) {
                    let pagesPath = `${root + Config.paths.input.templates}/`;
                    let templatesPath = `${root + Config.paths.input.templates}/`;
                    let pages = fs.readdirSync(pagesPath);
                    let items = pages.length;
                    let content = "";

                    if (Config.templates.format === "twig") {
                        content = `{% include layout.template %}`
                    }

                    if (Config.templates.format === "hbs") {
                        content = `{{> (lookup layout 'template')}}`
                    }

                    for (let i = 0; i < items; i++) {
                        if (!fs.existsSync(templatesPath + pages[i].replace('.json',`.${Config.templates.format}`))) {
                            fs.writeFileSync(templatesPath + pages[i].replace('.json',`.${Config.templates.format}`), content);
                        }
                    }

                    resolve();
                },
                function core() {
                    return gulp.src([`${root + Config.paths.input.templates}/*.{hbs,html,twig}`])
                        .pipe(plumber(Functions.plumber))
                        .pipe(build())
                        .pipe(gulpif(fileJSON, renameJson(), renameHtml()))
                        .pipe(gulp.dest(root + Config.paths.output.root));
                },
                function cleanup(resolve) {
                    let pages = fs.readdirSync(root + Config.paths.input.templates),
                        items = pages.length;

                    for (let i = 0; i < items; i++) {
                        if (!fs.statSync(`${root + Config.paths.input.templates}/${pages[i]}`).isDirectory()) {
                            if (pages[i].indexOf("json") === -1 && pages[i].indexOf("dialog") === -1) {
                                let file = fs.readFileSync(`${root + Config.paths.input.templates}/${pages[i]}`).toString();

                                if (file === `{% include layout.template %}` || file === `{{> (lookup layout 'template')}}`) {
                                    fs.unlinkSync(`${root + Config.paths.input.templates}/${pages[i]}`);
                                }
                            }
                        }
                    }

                    resolve();
                }
            )(resolve);
        })
    }
}

export class Icons {
    async fetch() {
        const http = (await import("https")).default;

        return new Promise((resolve, reject) => {
            if (Config.icons.local === true || Config.local === true) {
                resolve();
            }

            if (typeof Config.icons.name === "undefined" || Config.icons.name === "") {
                Config.icons.name = path.basename(path.resolve(root));
            }

            let files = [
                `https://i.icomoon.io/public/${Config.icons.id}/${Config.icons.name}/variables.less`,
                `https://i.icomoon.io/public/${Config.icons.id}/${Config.icons.name}/style.less`,
                `https://i.icomoon.io/public/${Config.icons.id}/${Config.icons.name}/selection.json`
            ]

            if (!fs.existsSync(root + Config.paths.input.icons)) {
                fs.mkdirSync(root + Config.paths.input.icons);
            }

            let variables = {};

            Promise.allSettled(files.map(async (url) => {
                let name = url.substring(url.indexOf(Config.icons.name) + Config.icons.name.length, url.length).replace("/","");

                return new Promise((resolveFile, rejectFile) => {
                    http.get(url, response => {
                        if (response.statusCode === 200) {
                            if ((name === "variables.less" || name === "style.less") && Config.icons.format !== "less") {
                                response.setEncoding('utf8');
                                let body = "";
                                response.on('data', chunk => body += chunk);
                                response.on('end', () => {

                                    if (name === "variables.less") {
                                        body.match(/@(.+);/gm).filter(variable => {
                                            let match = variable.match(/@(.+): "(.+)";/);

                                            variables[match[1]] = match[2]
                                        })

                                        body = `:root {${Object.keys(variables).map(variable => `--${variable}: "${variables[variable]}";\n`).join("")}}`;

                                        fs.writeFile(`${root + Config.paths.input.icons}/variables.css`, body, resolveFile);
                                    }

                                    if (name === "style.less") {
                                        body = body.replace(`@import "variables";`, `@import "variables.css";`)

                                        fs.writeFile(`${root + Config.paths.input.icons}/style.css`, body, resolveFile)
                                    }
                                });

                            } else {
                                response.pipe(fs.createWriteStream(`${root + Config.paths.input.icons}/${name}`));
                                resolveFile();
                            }
                        } else {
                            console.error("\x1b[31m", `Error: ${url} returns ${response.statusCode}`, "\x1b[0m");
                            rejectFile()
                        }
                    });
                })
            })).then(result => {
                if (result[0].status !== "rejected") {
                    if (fs.existsSync(`${root + Config.paths.input.icons}/style.css`)) {
                        let file = fs.readFileSync(`${root + Config.paths.input.icons}/style.css`).toString();

                        Object.keys(variables).map(variable => {
                            file = file.replace(new RegExp(`@{${variable}}`, 'g'), `${variables[variable]}`)
                            file = file.replace(`@${variable}`, `var(--${variable})`)
                        })

                        fs.writeFileSync(`${root + Config.paths.input.icons}/style.css`, file);
                    }

                    console.log("\x1b[34m", `Icomoon demo - https://i.icomoon.io/public/reference.html#/${Config.icons.id}/${Config.icons.name}/`, "\x1b[0m");
                    resolve();
                } else {
                    console.error("\x1b[31m", `Is project added in icomoon.app, has the correct name or is quick usage enabled?`, "\x1b[0m");
                    reject();
                }
            })
        })
    }
    async build() {
        const replace = (await import('gulp-replace')).default;
        const cleanCSS = (await import("./packages/gulp-clean-css/index.js")).default;
        const rename = (await import('gulp-rename')).default;
        const revision = (await import("gulp-rev")).default;

        const rev = lazypipe().pipe(revision).pipe(Functions.revUpdate, true);

        const clean = lazypipe().pipe(cleanCSS);

        const build = lazypipe().pipe(() => gulpif("*.css", postcss(new Utils().postcssPlugins(Config.icons.postcss, [autoprefixer])))
        ).pipe(() => gulpif("*.less", Modules.less.module()))

        return gulp.src(`${root + Config.paths.input.icons}/style.{css,less}`)
            .pipe(plumber(Functions.plumber))
            .pipe(rename(function(path){
                path.basename = Config.icons.filename;
            }))
            .pipe(replace('-"]', '-"]:before'))
            .pipe(replace('!important;', ';'))
            .pipe(replace('@font-face {', '@font-face { font-display: block;'))
            .pipe(build())
            .pipe(gulpif(Config.icons.revision, rev()))
            .pipe(gulpif(Config.icons.optimizations, clean()))
            .pipe(gulp.dest(root + Config.paths.output.icons))
            .pipe(revision.manifest(root + Config.paths.output.icons + "/rev-manifest.json",{
                merge: true,
                base: root + Config.paths.output.icons
            }))
            .pipe(gulp.dest(root + Config.paths.output.icons));
    }
}

export class Emails {
    async build() {
        const inlineCss = (await import('gulp-inline-css')).default;
        const replace = (await import('gulp-replace')).default;
        const rename = (await import('gulp-rename')).default;

        const inlineCssOpt = {
            applyStyleTags: true,
            applyLinkTags: true,
            removeStyleTags: Config.emails.inlineOnly
        }

        const buildCss = lazypipe().pipe(() => gulpif("*.css", postcss(new Utils().postcssPlugins(Config.emails.postcss, [autoprefixer])))
        ).pipe(() => gulpif("*.less", Modules.less.module()))

        return new Promise(resolve => {
            let twigFiles = "*.twig";
            let hbsFiles = "*.hbs";

            if (Config.emails.format === "twig") {
                twigFiles = twigFiles.replace("twig", "{twig,latte,tpl}")
            } else if (Config.emails.format === "hbs") {
                hbsFiles = hbsFiles.replace("hbs", "{hbs,latte,tpl}")
            }

            const build = lazypipe().pipe(() => gulpif(twigFiles, twig({
                functions: new Templates().functions,
                filters: new Templates().filters,
                extensions: new Templates().tags
            })))
            .pipe(() => gulpif(hbsFiles, Modules.hbs.module(`${root + Config.paths.input.emails}/**/*.hbs`, Modules.hbs.helpers(Object.assign(new Templates().filters, new Templates().functions)))))
            .pipe(() => gulpif("*.{hbs,twig}", rename({ extname: ".html" })))

            gulp.series(
                function styles() {
                    return gulp.src(root + Config.paths.input.emails + '/*.{css,less}')
                        .pipe(buildCss())
                        .pipe(gulp.dest(root + Config.paths.temp + "/emails"));
                },
                function templates() {
                    return gulp.src(root + Config.paths.input.emails + '/*.{hbs,twig,tpl,latte}')
                        .pipe(build())
                        .pipe(replace('<table', '<table border="0" cellpadding="0" cellspacing="0"'))
                        .pipe(inlineCss(inlineCssOpt))
                        .pipe(gulpif(Config.emails.removeClasses,replace(/class="([A-Za-z0-9 _]*)"/g, '')))
                        .pipe(gulpif(("*.html"), gulp.dest(root + Config.paths.output.emails)))
                        .pipe(gulpif("*.{latte,tpl}", gulp.dest(root + Config.paths.output.emailsWww)))
                }
            )(resolve)
        })
    }
    zip() {
        return new Promise(async (resolve) => {
            const AdmZip = (await import('adm-zip')).default;

            let files = fs.readdirSync(root + Config.paths.output.emails);
            let prefixes = Config.emails.zipPrefix;

            function zipFile(file, imageSubfolder) {
                let zip = new AdmZip();

                if (typeof imageSubfolder !== "undefined" && fs.existsSync(`${root + Config.paths.output.emailsImg}/${imageSubfolder}`)) {
                    if (imageSubfolder.endsWith("-")) {
                        imageSubfolder.slice(0, imageSubfolder.length - 1)
                    }
                    imageSubfolder = "/" + imageSubfolder
                } else {
                    imageSubfolder = ""
                }

                zip.addFile("index.html", fs.readFileSync(`${root + Config.paths.output.emails}/${file}`));
                zip.toBuffer();

                if (fs.existsSync(`${root + Config.paths.output.emailsImg}${imageSubfolder}`)) {
                    zip.addLocalFolder(`${root + Config.paths.output.emailsImg}${imageSubfolder}`, `images${imageSubfolder}`);
                }

                zip.writeZip(`${root + Config.paths.output.emails}/${file.replace(".html", ".zip")}`);
            }

            files.forEach((file) => {
                if (file.endsWith(".html")) {
                    if (Config.emails.zipPrefix) {
                        prefixes.filter((prefix) => {
                            if (file.startsWith(prefix)) {
                                zipFile(file, prefix);
                            }
                        });
                    } else {
                        zipFile(file);
                    }
                }
            });

            resolve();
        })
    }
}

export class Serve {
    init() {
        return new Promise(async (resolve) => {
            const { createServer } = (await import('vite'));
            const tailwindcss = (await import("tailwindcss")).default;

            let config = {
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

export class Watch {
    get paths() {
        return {
            scripts: [`${Config.paths.input.scripts}/**`, `!${Config.paths.input.scripts}/**/\\${Config.scripts.importResolution.filename}`],
            styles: [`${Config.paths.input.styles}/**`, `!${Config.paths.input.styles}/**/\\${Config.styles.importResolution.filename}`],
            templates: [`${Config.paths.input.templates}/**`, Config.paths.input.main, `!${Config.paths.input.templates}/*.${Config.templates.format}`]
        }
    }
    dev() {
        if (!Config.vite) {
            gulp.watch("package.json", Exists.templates ? gulp.series("importmap", "templates") : gulp.series("importmap"))
        }

        if (Exists.scripts) {
            gulp.watch(this.paths.scripts, gulp.series("scripts"))
        }

        if (Exists.styles) {
            gulp.watch(this.paths.styles, gulp.series("styles"))
        }

        if (Exists.templates) {
            gulp.watch(this.paths.templates, gulp.series("templates"))
        }

        if (Exists.emails) {
            gulp.watch(`${Config.paths.input.emails}/**`, gulp.series("emails:build"))
        }
    }
    build(type) {
        let templates = type !== "production" ? "templates" : "templates:production";

        gulp.watch("package.json", Exists.templates ? gulp.series("importmap", templates) : gulp.series("importmap"))

        if (Exists.scripts) {
            let tasks = [`scripts:${type}`]

            if (Exists.templates && Config.scripts.revision === true) {
                tasks.push(templates)
            }

            gulp.watch(this.paths.scripts, gulp.series(tasks))
        }

        if (Exists.styles) {
            let tasks = [`styles:${type}`]

            if (Exists.templates && Config.styles.revision === true) {
                tasks.push(templates)
            }

            gulp.watch(this.paths.styles, gulp.series(tasks))
        }

        if (Exists.templates) {
            gulp.watch(this.paths.templates, gulp.series(templates))
        }

        if (Exists.icons && Exists.templates && Config.icons.revision === true) {
            gulp.watch(`${Config.paths.output.icons}/${Config.icons.filename}*`, gulp.series(templates));
        }

        if (Exists.assets && type === "production") {
            gulp.watch(`${Config.paths.input.assets}/**`, gulp.series("assets"))
        }

        if (Exists.emails) {
            gulp.watch(`${Config.paths.input.emails}/**`, gulp.series("emails:build"))
        }
    }
}

export class Core {
    init(ExtendConfig = {}) {
        Config = lodash.merge(Config, ExtendConfig);

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
            revUpdate: (cleanup) => {
                return through.obj((file, enc, cb) => {
                    if (typeof file.revOrigPath === "undefined") {
                        cb(null, file);
                        return false;
                    }

                    let directory = path.parse(path.relative(process.cwd(), file.path)).dir.replace(root + Config.paths.input.root, root + Config.paths.output.root)

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
            devBuild() {
                if (Config.serve.mode === "dev" || Config.serve.mode === "build") {
                    Config.errors = false;
                    Config.styles.revision = false;
                    Config.styles.purge.enabled = false;
                    Config.styles.optimizations = false;
                    Config.scripts.revision = false;
                    Config.scripts.optimizations = false;
                    Config.scripts.legacy = false;
                    Config.icons.optimizations = false;
                    Config.icons.revision = false;
                    Config.styles.vendor.cache = true;
                    Config.styles.import = ['local'];
                    Config.assets.revision = false;
                }
            }
        }

        if (Config.styles.ratio.content === 0 && Exists.templates) {
            Config.styles.ratio.content.push(`${root + Config.paths.input.templates}/**/*.{hbs,html,twig}`);
        }

        if (Config.styles.purge.content === 0 && Exists.styles) {
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
                Exists.assets && tasks.push("assets")
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

                Exists.assets && tasks.push("assets")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")
                Exists.icons && tasks.push("icons:production")

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

                !Config.local && tasks.push("cleanup")
                Exists.icons && tasks.push("icons")
                Exists.styles && tasks.push("styles")
                Exists.scripts && tasks.push("scripts")
                Exists.templates && tasks.push("templates")

                Functions.devBuild();

                tasks.push(new Serve().init, "watch")

                gulp.series(tasks)(resolve)
            });

            gulp.task("serve:build", (resolve) => {
                let tasks = [];

                if (Config.serve.mode === "") {
                    Config.serve.mode = "build";
                }

                !Config.local && tasks.push("cleanup", "cdn")
                Exists.assets && tasks.push("assets")
                Exists.icons && tasks.push("icons:build")
                Exists.styles && tasks.push("styles:build")
                Exists.scripts && tasks.push("scripts:build")
                Exists.templates && tasks.push("templates")

                Functions.devBuild()

                tasks.push(new Serve().init, "watch:build")

                gulp.series(tasks)(resolve)
            })

            gulp.task("serve:production", (resolve) => {
                let tasks = [];

                if (Config.serve.mode === "") {
                    Config.serve.mode = "production";
                }

                !Config.local && tasks.push("cleanup", "cdn")
                Exists.assets && tasks.push("assets")
                Exists.icons && tasks.push("icons:production")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")
                Exists.templates && tasks.push("templates:production")

                tasks.push(new Serve().init, "watch:production")

                gulp.series(tasks)(resolve)
            })
        }

        if (Exists.icons) {
            gulp.task("icons", (resolve) => {
                if (Config.icons.id !== "") {
                    gulp.series(new Icons().fetch)(resolve)
                } else {
                    return new Icons().build()
                }
            })

            gulp.task("icons:build", (resolve) => {
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
                    gulp.series(new Utils().importMap, new Scripts().importResolution, new Scripts().build)(resolve)
                })

                gulp.task("scripts:production", (resolve) => {
                    const build = () => new Scripts().build("production");

                    gulp.series(new Utils().importMap, new Scripts().importResolution, build)(resolve)
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
                    gulp.series(new Styles().importResolution, new Styles().tailwind, new Styles().build)(resolve)
                })

                gulp.task("styles:production", (resolve) => {
                    gulp.series(new Styles().importResolution, new Styles().tailwind, new Styles().build)(resolve)
                })
            }
        }

        if (Exists.templates) {
            gulp.task("templates", () => {
                return new Templates().build("development");
            })

            gulp.task("templates:production", () => {
                return new Templates().build("production");
            })
        }

        if (Exists.assets) {
            gulp.task("assets", async () => {
                const revision = (await import("gulp-rev")).default;

                return gulp.src(`${root + Config.paths.input.assets}/**`)
                    .pipe(gulpif(Config.assets.revision, revision()))
                    .pipe(Functions.revUpdate(true))
                    .pipe(gulp.dest(root + Config.paths.output.assets))
                    .pipe(revision.manifest())
                    .pipe(gulp.dest(root + Config.paths.output.assets))
            })
        }

        if (Exists.emails) {
            gulp.task("emails:build", () => {
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

        if (!Config.vite && typeof Config.modules.Cms !== "undefined") {
            gulp.task("cms:install", () => {
                return new Config.modules.Cms().install()
            })

            gulp.task("cms:prepare", (done) => {
                return new Config.modules.Cms().prepare(done)
            })
        }
    }
}

export {Config, Exists, Modules, Functions, Package};