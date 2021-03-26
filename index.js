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
import {fileURLToPath} from "url";

import twig from "gulp-twig2html";
import postcss from "gulp-postcss";
import importCSS from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";
import {createRequire} from "module";

const require = createRequire(import.meta.url);
const root = process.cwd() + "/"

let Exists;
let Modules;
let Functions;
let Package = require(root + "package.json");

let conf = {
    lang: "cs",
    local: false,
    errors: true,
    vite: false,
    serve: {
        index: "",
        mode: "",
        rewriteOutput: true,
        server: "wds"
    },
    modules: {},
    cms: {
        branch: "dev",
        full: false,
        sectionsDir: "Sections",
        format: {
            templates: "tpl"
        }
    },
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
            root: "public",
            scripts: "public/assets/js",
            styles: "public/assets/css",
            icons: "public/assets/css",
            emails: "public",
            emailsImg: "public/img",
            assets: "public/assets"
        },
        cms: {
            temp: "temp/cms",
            templates: "www/templates",
            components: "www/components"
        }
    },
    icons: {
        format: "css",
        filename: "iconfont",
        id: "",
        local: false,
        revision: true,
        optimizations: true
    },
    scripts: {
        optimizations: true,
        revision: true,
        legacy: true,
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
        themePath: ""
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
        zipPrefix: ["email"]
    },
    assets: {
        revision: true
    },
    tailwind: {}
}

export class Utils {
    cleanup() {
        return new Promise(resolve => {
            if (fs.existsSync(root + conf.paths.temp)) {
                fse.emptyDirSync(root + conf.paths.temp);
            }

            if (fs.existsSync(root + conf.paths.output.assets) && conf.paths.output.assets !== conf.paths.output.root) {
                fse.removeSync(root + conf.paths.output.assets);
            }

            if (fs.existsSync(root + conf.paths.output.styles)) {
                fse.removeSync(root + conf.paths.output.styles);
            }

            if (fs.existsSync(root + conf.paths.output.scripts)) {
                fse.removeSync(root + conf.paths.output.scripts);
            }

            (function(){
                if (fs.existsSync(`${root + conf.paths.input.templates}/`)) {
                    let pages = fs.readdirSync(`${root + conf.paths.input.templates}/`),
                        items = pages.length;

                    for (let i = 0; i < items; i++) {
                        if (fs.existsSync(`${root + conf.paths.output.root}/${pages[i]}`)) {
                            fs.unlinkSync(`${root + conf.paths.output.root}/${pages[i]}`);
                        } else if (fs.existsSync(`${root + conf.paths.output.root}/${pages[i].replace('.json', '.html')}`)) {
                            fs.unlinkSync(`${root + conf.paths.output.root}/${pages[i].replace('.json', '.html')}`);
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
                let cdn = conf.scripts.importMap.cdn;
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
                    if (!conf.scripts.importMap.shortUrl) {
                        url = "https://cdn.esm.sh/{DEPENDENCY}@{VERSION}/esnext/{DEPENDENCY}.js";
                        urlSub = "https://cdn.esm.sh/{DEPENDENCY}@{VERSION}/esnext/";
                    } else {
                        url = `https://esm.sh/{DEPENDENCY}@{VERSION}`;
                        urlSub = "https://esm.sh/{DEPENDENCY}@{VERSION}/";
                    }
                } else if (cdn === "esm.run") {
                    if (!conf.scripts.importMap.shortUrl) {
                        url = "https://cdn.jsdelivr.net/npm/{DEPENDENCY}@{VERSION}/+esm";
                        urlSub = "https://cdn.jsdelivr.net/npm/{DEPENDENCY}@{VERSION}/";
                    } else {
                        url = `https://esm.run/{DEPENDENCY}@{VERSION}`;
                        urlSub = "https://esm.run/{DEPENDENCY}@{VERSION}/";
                    }
                }

                Object.keys(dependencies).forEach((dependency) => {
                    if (dependency.includes("/") && cdn === "esm.sh") {
                        importMap.imports[dependency] = url.replace("{DEPENDENCY}", dependency).replace("{VERSION}", dependencies[dependency].replace("^","")).replace("{DEPENDENCY}", dependency.split("/")[1])
                    } else {
                        importMap.imports[dependency] = url.replace(new RegExp("{DEPENDENCY}", 'g'), dependency).replace("{VERSION}", dependencies[dependency].replace("^",""))
                    }

                    if (dependency.match(conf.scripts.importMap.trailingSlashes)) {
                        importMap.imports[`${dependency}/`] = urlSub.replace("{DEPENDENCY}", dependency).replace("{VERSION}", dependencies[dependency].replace("^",""))
                    }
                });

                if (typeof imports !== "undefined") {
                    importMap = {
                        "imports": Object.assign(importMap.imports, imports)
                    };
                }

                if (!fs.existsSync(root + conf.paths.output.root)){
                    fs.mkdirSync(root + conf.paths.output.root);
                }

                fs.writeFileSync(root + conf.paths.output.root + "/importmap.json", JSON.stringify(importMap),'utf8');
                resolve();
            })
        })
    }
    async cdn(type, inject) {
        const replace = (await import('gulp-replace')).default;
        const dir = root + conf.paths.cdn;

        let cdnPaths = [];
        let sri = {};

        if (!fs.existsSync(root + conf.paths.cdn)){
            fs.mkdirSync(root + conf.paths.cdn);
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

            if (!fs.existsSync(root + conf.paths.cdn + "/" + fileName)) {
                await Functions.download(url, dir + "/" + fileName);
            }

            sri[url] = `sha256-${spawnCmd(`cat ${root + conf.paths.cdn}/${fileName} | openssl dgst -sha256 -binary | openssl base64 -A`)}`;

            cdnPaths.push(url.substring(0, urlName));
        }

        if (type === "templates") {
            if (fs.existsSync(`${root + conf.paths.input.main}`)) {
                const main = fs.readFileSync(root + conf.paths.input.main).toString();

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

            if (!fs.existsSync(root + conf.paths.output.root)) {
                fs.mkdirSync(root + conf.paths.output.root);
            }

            fs.writeFileSync(`${root + conf.paths.output.root}/sri.json`, JSON.stringify(sri));

            // TODO
            if (inject === true) {
                let task = gulp.src(root + conf.paths.output.root + '/*.html');

                cdnPaths.forEach(function(rep) {
                    task = task.pipe(replace(rep, `/${conf.paths.cdn}`));
                });

                task.pipe(gulp.dest(root + conf.paths.output.root));
            }
        }

        if (type === "scripts") {
            if (fs.existsSync(`${root + conf.paths.input.scripts}/Utils/cdn.js`)) {
                const urls = fs.readFileSync(`${root + conf.paths.input.scripts}/Utils/cdn.js`).toString().split(/\r?\n/g);

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

            if (fs.existsSync(`${root + conf.paths.output.root}/importmap.json`) && conf.scripts.importMap.localDownload) {
                let importmap = JSON.parse(fs.readFileSync(`${root + conf.paths.output.root}/importmap.json`).toString());
                let files = []

                Object.keys(importmap["imports"]).map((name) => {
                    let filename = "esm." + name.replace(new RegExp("/", 'g'),"-") + ".js";

                    if (!fs.existsSync(root + conf.paths.cdn + "/" + filename) && name.slice(-1) !== "/") {
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
                let task_js = gulp.src(root + conf.paths.output.scripts + "/" + JSON.parse(fs.readFileSync(root + conf.paths.output.scripts + "/rev-manifest.json", 'utf8').toString())["core.js"]);

                cdnPaths.forEach(function (rep) {
                    task_js = task_js.pipe(replace(rep, "/" + root + conf.paths.cdn));
                });

                task_js.pipe(gulp.dest(root + conf.paths.output.scripts));
            }
        }

        if (type === "styles") {
            if (fs.existsSync(`${root + conf.paths.input.styles}/${conf.styles.vendor.path}`) && conf.styles.vendor.path.length !== 0) {
                const urls = fs.readFileSync(`${root + conf.paths.input.styles}/${conf.styles.vendor.path}`).toString().split(/\r?\n/g);

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
}

export class Scripts {
    importResolution() {
        return new Promise(resolve => {
            conf.scripts.importResolution.directories.map(directory => {
                if (!fs.existsSync(`${root + conf.paths.input.scripts}/${directory}`)) {
                    console.log("\x1b[31m", `importResolution - ${conf.paths.input.scripts}/${directory} doesn't exists`, "\x1b[0m");
                    return false;
                }

                let items = fs.readdirSync(`${root + conf.paths.input.scripts}/${directory}`);

                function findPaths(items, directory) {
                    let imports = "";

                    items.map(item => {
                        let path = `${directory}/${item}`;

                        if (fs.statSync(path).isFile()) {
                            if (path.includes(".js") && !path.includes(conf.scripts.importResolution.filename)) {
                                if (fs.readFileSync(path).toString().includes("export default")) {
                                    imports = imports + `export { default as ${item.replace(".js","")} } from './${item}';\r\n`
                                } else {
                                    imports = imports + `import './${item}';\r\n`
                                }
                            }
                        } else {
                            if (conf.scripts.importResolution.subDir) {
                                imports = imports + `import "${item}/${conf.scripts.importResolution.filename}";\r\n`
                            }
                            findPaths(fs.readdirSync(path), path);
                        }
                    });

                    if (fs.existsSync(`${directory}/${conf.scripts.importResolution.filename}`)) {
                        if (fs.readFileSync(`${directory}/${conf.scripts.importResolution.filename}`).toString() !== imports) {
                            fs.writeFileSync(`${directory}/${conf.scripts.importResolution.filename}`, imports);
                        }
                    } else {
                        fs.writeFileSync(`${directory}/${conf.scripts.importResolution.filename}`, imports);
                    }
                }

                findPaths(items, `${root + conf.paths.input.scripts}/${directory}`);
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
            fse.removeSync(root + conf.paths.output.scripts);

            const hashManifest = function(opts = {}) {
                const defaults = {
                    path: root + conf.paths.output.scripts
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

            let assetsManifest = fs.existsSync(`${root + conf.paths.output.assets}/rev-manifest.json`) ? JSON.parse(fs.readFileSync(`${root + conf.paths.output.assets}/rev-manifest.json`).toString()) : {};
            let importMapFile = fs.existsSync(`${root + conf.paths.output.root}/importmap.json`) ? JSON.parse(fs.readFileSync(`${root + conf.paths.output.root}/importmap.json`).toString()) : {};
            let files = fs.readdirSync(root + conf.paths.input.scripts);

            if (!fs.existsSync(root + conf.paths.output.scripts)){
                fs.mkdirSync(root + conf.paths.output.scripts);
            }

            Promise.all(files.map(async file => {
                if (!fs.statSync(`${root + conf.paths.input.scripts}/${file}`).isDirectory()) {
                    await (async() => {

                        const inputOptions = {
                            context: 'window',
                            preserveEntrySignatures: true,
                            plugins: [
                                (conf.scripts.importMap.build && typeof importMapFile["imports"] !== "undefined") && rollupImportMapPlugin(importMapFile),
                                !conf.scripts.importMap.build && nodeResolve(),
                                !conf.scripts.importMap.build && commonjs(),
                                replace({
                                    preventAssignment: true,
                                    values: Object.assign({
                                        'process.env.NODE_ENV': JSON.stringify('production')
                                    }, assetsManifest)
                                }),
                                conf.scripts.optimizations && terser(),
                                conf.scripts.revision && hashManifest()
                            ]
                        };

                        const outputOptions = {
                            dir: root + conf.paths.output.scripts,
                            format: 'es',
                            sourcemap: false,
                            compact: true,
                            entryFileNames: `[name]${conf.scripts.revision ? ".[hash]" : ""}.js`,
                            chunkFileNames: '[name].[hash].js'
                        };

                        const bundle = await rollup(Object.assign({input: root + conf.paths.input.scripts + '/' + file}, inputOptions));

                        await bundle.write(outputOptions);

                        await bundle.close();
                    })();

                    type === "production" && conf.scripts.legacy && await (async() => {

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
                                conf.scripts.revision && hashManifest({path: root + conf.paths.output.scripts + "/es5/"})
                            ]
                        };

                        const outputOptions = {
                            dir: root + conf.paths.output.scripts + "/es5/",
                            format: 'es',
                            sourcemap: false,
                            compact: true,
                            entryFileNames: `[name]${conf.scripts.revision ? ".[hash]" : ""}.js`,
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

                        if (!fs.existsSync(root + conf.paths.output.scripts + "/es5")){
                            fs.mkdirSync(root + conf.paths.output.scripts + "/es5");
                        }

                        const bundle = await rollup(Object.assign({input: root + conf.paths.input.scripts + `/${file}`}, inputOptions));

                        await bundle.write(outputOptions);

                        await bundle.close();
                    })();
                }
            })).then(async () => {
                type === "production" && conf.scripts.legacy && await (async() => {
                    let polyfills = "";

                    if (typeof conf.scripts.polyfillUrls !== "undefined") {
                        conf.scripts.polyfillUrls.map((script) => {
                            polyfills = polyfills.concat(`document.write('<script src="${script}"><\\/script>');`)
                        });
                    }

                    fs.writeFileSync(root + conf.paths.temp + `/polyfills.js`, Functions.stripIndent(`
                        document.write('<script src="https://polyfill.io/v3/polyfill.min.js?features=${conf.scripts.polyfillFeatures}"><\\/script>');
                        document.write('<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.5.0/dist/fetch.umd.min.js"><\\/script>');
                        document.write('<script src="https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.7/runtime.min.js"><\\/script>');
                        document.write('<script src="https://cdn.jsdelivr.net/npm/requirejs@2.3.6/require.min.js"><\\/script>');
                        ${polyfills}
                    `).replace(/^\s*\n/g, ""));

                    const inputOptions = {
                        context: 'window',
                        preserveEntrySignatures: false,
                        plugins: [
                            conf.scripts.revision && hashManifest({path: root + conf.paths.output.scripts + "/es5/"})
                        ]
                    };

                    const outputOptions = {
                        dir: root + conf.paths.output.scripts + "/es5/",
                        format: 'es',
                        sourcemap: false,
                        compact: true,
                        entryFileNames: `[name]${conf.scripts.revision ? ".[hash]" : ""}.js`
                    };
                    const bundle = await rollup(Object.assign({input: root + conf.paths.temp + `/polyfills.js`}, inputOptions));

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
                let purgeFiles = conf.styles.purge.content;
                let dependencies = JSON.parse(fs.readFileSync(`package.json`).toString()).dependencies;

                if (typeof dependencies !== "undefined") {
                    Object.keys(dependencies).map(lib => {
                        purgeFiles.push(`node_modules/${lib}/**/*.js`)
                    });
                }

                if (conf.styles.purge.docs) {
                    purgeFiles = purgeFiles.toString().replace("/*." + conf.templates.format, "/!(Ui)." + conf.templates.format).split(",");
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
                }, conf.styles.purge.options)
            }
        }
    }
    importResolution() {
        return new Promise(resolve => {
            conf.styles.importResolution.directories.map(directory => {
                if (!fs.existsSync(`${root + conf.paths.input.styles}/${directory}`)) {
                    console.log("\x1b[31m", `importResolution - ${root + conf.paths.input.styles}/${directory} doesn't exists`, "\x1b[0m");
                    return false;
                }

                let items = fs.readdirSync(`${root + conf.paths.input.styles}/${directory}`);

                function findPaths(items, directory) {
                    let imports = "";

                    items.map(item => {
                        let path = `${directory}/${item}`;

                        if (fs.statSync(path).isFile()) {
                            if (path.includes(`.${conf.styles.format}`) && !path.includes(conf.styles.importResolution.filename)) {
                                imports = imports + `@import "${item}";\r\n`
                            }
                        } else {
                            if (conf.styles.importResolution.subDir) {
                                imports = imports + `@import "${item}/${conf.styles.importResolution.filename}";\r\n`
                            }
                            findPaths(fs.readdirSync(path), path);
                        }
                    });

                    if (fs.existsSync(`${directory}/${conf.styles.importResolution.filename}`)) {
                        if (fs.readFileSync(`${directory}/${conf.styles.importResolution.filename}`).toString() !== imports) {
                            fs.writeFileSync(`${directory}/${conf.styles.importResolution.filename}`, imports);
                        }
                    } else {
                        fs.writeFileSync(`${directory}/${conf.styles.importResolution.filename}`, imports);
                    }
                }

                findPaths(items, `${root + conf.paths.input.styles}/${directory}`);
            });

            resolve();
        })
    }
    async tailwind() {
        const autoprefixer = (await import("autoprefixer")).default;
        const tailwindcss = (await import("tailwindcss")).default;
        const purgeCSS = (await import("gulp-purgecss")).default;

        if (!fs.existsSync(`${root + conf.paths.input.styles}/tailwind.css`)) {
            conf.styles.format === "less" && await new Promise(resolve => {
                if (fs.readdirSync(root + conf.paths.temp).toString().includes("-modifiers")) {
                    resolve()
                }

                const purge = lazypipe().pipe(purgeCSS, new Styles().purge.config());

                gulp.src([`${root + conf.paths.input.styles}/*-modifiers.less`])
                    .pipe(plumber(Functions.plumber))
                    .pipe(Modules.less.module())
                    .pipe(gulpif(conf.styles.purge.enabled, purge()))
                    .pipe(Modules.autoprefixer.pipe())
                    .pipe(gulp.dest(root + conf.paths.temp))
                    .on("end", resolve)
            })

            return new Promise(resolve => resolve())
        }

        return new Promise(resolve => {
            if (fs.readdirSync(root + conf.paths.temp).toString().includes("tailwind")) {
                resolve()
            }

            const purge = lazypipe().pipe(purgeCSS, Object.assign({
                content: conf.styles.purge.content,
                extractors: [
                    {
                        extractor: content => content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [],
                        extensions: ['html', 'js', 'hbs', 'tpl', 'latte']
                    }
                ]
            }, conf.styles.purge.tailwind));

            gulp.src(`${root + conf.paths.input.styles}/tailwind.css`)
                .pipe(postcss([tailwindcss({ config: conf.tailwind }), autoprefixer]))
                .pipe(gulpif(conf.styles.purge.enabled, purge()))
                .pipe(gulp.dest(root + conf.paths.temp))
                .on("end", resolve)
        })
    }
    async build() {
        const autoprefixer = (await import("autoprefixer")).default;
        const cleanCSS = (await import("gulp-clean-css")).default;
        const purgeCSS = (await import("gulp-purgecss")).default;
        const revision = (await import("gulp-rev")).default;
        const revRewrite = require('gulp-rev-rewrite');

        const clean = lazypipe().pipe(cleanCSS, {
            inline: conf.styles.import,
            level: {1: {specialComments: 0}, 2: {all: true}}
        });

        const purge = lazypipe().pipe(purgeCSS, new Styles().purge.config());

        const rev = lazypipe().pipe(revision).pipe(Functions.revUpdate, true)
                    .pipe(revRewrite, {manifest: fs.existsSync(`${root + conf.paths.output.assets}/rev-manifest.json`) ? fs.readFileSync(`${root + conf.paths.output.assets}/rev-manifest.json`) : ""});

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
                    if (conf.styles.vendor.path.length !== 0 && (fs.existsSync(`${root + conf.paths.input.styles}/${conf.styles.vendor.path}`) && conf.local === true || fs.existsSync(`${root + conf.paths.input.styles}/${conf.styles.vendor.path}`) && conf.styles.vendor.cache === true)) {
                        let vendorUrl = fs.readFileSync(`${root + conf.paths.input.styles}/${conf.styles.vendor.path}`).toString().replace(/url\((.*)\//g,`url(../../${conf.paths.cdn}/`);

                        file.contents = Buffer.from(file.contents.toString().replace(`@import "${conf.styles.vendor.path}";`, vendorUrl));
                    }
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

        const build = lazypipe().pipe(() => gulpif("*.css", postcss([importCSS, autoprefixer, postcssPresetEnv({
                stage: 0,
                features: {
                    'custom-properties': false
                }
            }), aspectRatio]))
        ).pipe(() => gulpif("*.less", Modules.less.module()));

        return new Promise(resolve => {
            gulp.src([`${root + conf.paths.input.styles}/*.{css,less}`, `!${root + conf.paths.input.styles}/tailwind.{css,less}`, `!${root + conf.paths.input.styles}/*-modifiers.less`])
                .pipe(plumber(Functions.plumber))
                .pipe(ratio([`${root + conf.paths.input.templates}/**/*.{hbs,html,twig}`, `${root + conf.paths.cms.templates}/**/*.{tpl,twig}`]))
                .pipe(vendor())
                .pipe(build())
                .pipe(gulpif(conf.styles.purge.enabled, purge()))
                .pipe(Modules.autoprefixer.pipe())
                .pipe(gulpif(conf.styles.revision, rev()))
                .pipe(gulpif(conf.styles.optimizations, clean()))
                .pipe(gulp.dest(root + conf.paths.output.styles))
                .pipe(revision.manifest(root + conf.paths.output.styles + "/rev-manifest.json",{
                    merge: true,
                    base: root + conf.paths.output.styles
                }))
                .pipe(gulp.dest(root + conf.paths.output.styles))
                .on("end", resolve)
        })
    }
}

export class Templates {
    get functions() {
        return {
            "color": (color, theme) => {
                if (typeof theme === "undefined") {
                    theme = "core"
                }

                if (!Exists.styles) {
                    return "inherit"
                }

                if ((theme || color) && conf.styles.themePath.length !== 0) {
                    let pathColors = conf.styles.themePath.replace("{THEME}", theme).replace("{FORMAT}", conf.styles.format);

                    if (fs.existsSync(pathColors)) {
                        let colors = fs.readFileSync(pathColors, 'utf8').toString();
                        let parse = colors.substring(colors.indexOf(color)+color.length+1,colors.length);

                        return parse.substring(0,parse.indexOf(";")).replace(" ", "");
                    }
                }
            },
            "fetch": (data) => {
                if (typeof data !== "undefined") {
                    if (!fs.existsSync(root + conf.paths.cdn)){
                        fs.mkdirSync(root + conf.paths.cdn);
                    }
                    if (data.indexOf("http") > -1) {
                        if (data.indexOf("googleapis.com") > -1) {
                            let google_name = data.substring(data.indexOf("=") + 1, data.length).toLowerCase(),
                                google_name_path = root + conf.paths.cdn + "/inline." + google_name.substring(0,google_name.indexOf(":")) + ".css";

                            if (fs.existsSync(google_name_path)) {
                                return fs.readFileSync(google_name_path, 'utf8').toString();
                            } else {
                                (async() => await Functions.download(data, google_name_path))()

                                return fs.readFileSync(google_name_path, 'utf8').toString();
                            }
                        } else {
                            let font_name = data.substring(data.lastIndexOf("/") + 1, data.length).toLowerCase(),
                                font_name_path = root + conf.paths.cdn + "/inline." + font_name;

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
                if (conf.local === false) {
                    let webp = "";
                    if (conf.templates.placeholder.webp === true) {
                        webp = ".webp"
                    }
                    if (!conf.templates.placeholder.picsum) {
                        if(conf.templates.placeholder.lorempixel === ""){

                            return "https://via.placeholder.com/"+width+"x"+height+"/"+colors[Math.floor(Math.random()*colors.length)]+`${webp}`;
                        }
                        else {
                            return "https://lorempixel.com/"+width+"/"+height+"/"+conf.templates.placeholder.lorempixel+"/"+Math.floor(Math.random()*10);
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

                if (conf.serve.mode === "dev" && path.indexOf("/" + conf.paths.input.root) === 0) {
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
                } else if (path.indexOf(conf.paths.output.assets) !== -1 && fs.existsSync(`${root + conf.paths.output.assets}/rev-manifest.json`)) {
                    let rev = JSON.parse(fs.readFileSync(root + conf.paths.output.assets + '/rev-manifest.json', 'utf8').toString());

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

                if (conf.serve.mode !== "dev" && output.indexOf(`/${conf.paths.input.root}`) === 0) {
                    if (conf.serve.rewriteOutput) {
                        output = output.replace(`/${conf.paths.input.root}`, `/${conf.paths.output.root}`)
                    } else {
                        output = output.replace(`/${conf.paths.input.root}`, "")
                    }
                }

                if (conf.serve.rewriteOutput && output.indexOf(`/${conf.paths.output.root}`) === 0) {
                    output = output.replace(`/${conf.paths.output.root}`, "")
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
                fs.existsSync(path)
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

                        return {
                            chain: chain,
                            output: `${output}
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

        let outputDir = "/" + root + conf.paths.output.root;

        if (conf.paths.output.root === conf.paths.output.assets) {
            outputDir = ""
        }

        const context = {
            conf: conf,
            lang: conf.lang,
            outputPath: "/" + conf.paths.output.root,
            inputPath: "/" + conf.paths.input.root,
            resolvePath: conf.serve.mode === "dev" ? "/" + root + conf.paths.input.root : outputDir,
        }

        const build = lazypipe().pipe(() => gulpif("*.twig", twig({
            functions: this.functions,
            filters: this.filters,
            extensions: this.tags,
            context: lodash.merge(context, {
                layout: {template: conf.templates.layout.replace(".twig","") + ".twig"}
            }),
            globals: root + conf.paths.input.main
        })))
        .pipe(data, (file) => {

            if (file.extname !== ".hbs") {
                return false;
            }

            let fileName = path.basename(file.path);
            let filePath = `${root + conf.paths.input.templates}/${fileName.replace(`.${conf.templates.format}`,'.json')}`;
            let main = lodash.merge({layout: {template: conf.templates.layout}}, JSON.parse(fs.readFileSync(root + conf.paths.input.main).toString()));

            if (fs.existsSync(filePath)) {
                return lodash.merge(main, JSON.parse(fs.readFileSync(filePath).toString()));
            } else {
                return main;
            }
        })
        .pipe(() => gulpif("*.hbs", Modules.hbs.module(`${root + conf.paths.input.templates}/**/*.hbs`, Modules.hbs.helpers(Object.assign(this.filters, this.functions)), context)))

        return new Promise(resolve => {
            gulp.series(
                function init(resolve) {
                    let pagesPath = `${root + conf.paths.input.templates}/`;
                    let templatesPath = `${root + conf.paths.input.templates}/`;
                    let pages = fs.readdirSync(pagesPath);
                    let items = pages.length;
                    let content = "";

                    if (conf.templates.format === "twig") {
                        content = `{% include layout.template %}`
                    }

                    if (conf.templates.format === "hbs") {
                        content = `{{> (lookup layout 'template')}}`
                    }

                    for (let i = 0; i < items; i++) {
                        if (!fs.existsSync(templatesPath + pages[i].replace('.json',`.${conf.templates.format}`))) {
                            fs.writeFileSync(templatesPath + pages[i].replace('.json',`.${conf.templates.format}`), content);
                        }
                    }

                    resolve();
                },
                function core() {
                    return gulp.src([`${root + conf.paths.input.templates}/*.{hbs,html,twig}`])
                        .pipe(plumber(Functions.plumber))
                        .pipe(build())
                        .pipe(gulpif(fileJSON, renameJson(), renameHtml()))
                        .pipe(gulp.dest(root + conf.paths.output.root));
                },
                function cleanup(resolve) {
                    let pages = fs.readdirSync(root + conf.paths.input.templates),
                        items = pages.length;

                    for (let i = 0; i < items; i++) {
                        if (!fs.statSync(`${root + conf.paths.input.templates}/${pages[i]}`).isDirectory()) {
                            if (pages[i].indexOf("json") === -1 && pages[i].indexOf("dialog") === -1) {
                                let file = fs.readFileSync(`${root + conf.paths.input.templates}/${pages[i]}`).toString();

                                if (file === `{% include layout.template %}` || file === `{{> (lookup layout 'template')}}`) {
                                    fs.unlinkSync(`${root + conf.paths.input.templates}/${pages[i]}`);
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
            if (conf.icons.local === true || conf.local === true) {
                resolve();
            }

            if (typeof conf.icons.name === "undefined" || conf.icons.name === "") {
                conf.icons.name = path.basename(path.resolve(root));
            }

            let files = [
                `https://i.icomoon.io/public/${conf.icons.id}/${conf.icons.name}/variables.less`,
                `https://i.icomoon.io/public/${conf.icons.id}/${conf.icons.name}/style.less`,
                `https://i.icomoon.io/public/${conf.icons.id}/${conf.icons.name}/selection.json`
            ]

            if (!fs.existsSync(root + conf.paths.input.icons)) {
                fs.mkdirSync(root + conf.paths.input.icons);
            }

            let variables = {};

            Promise.allSettled(files.map(async (url) => {
                let name = url.substring(url.indexOf(conf.icons.name) + conf.icons.name.length, url.length).replace("/","");

                return new Promise((resolveFile, rejectFile) => {
                    http.get(url, response => {
                        if (response.statusCode === 200) {
                            if ((name === "variables.less" || name === "style.less") && conf.icons.format !== "less") {
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

                                        fs.writeFile(`${root + conf.paths.input.icons}/variables.css`, body, resolveFile);
                                    }

                                    if (name === "style.less") {
                                        body = body.replace(`@import "variables";`, `@import "variables.css";`)

                                        fs.writeFile(`${root + conf.paths.input.icons}/style.css`, body, resolveFile)
                                    }
                                });

                            } else {
                                response.pipe(fs.createWriteStream(`${root + conf.paths.input.icons}/${name}`));
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
                    if (fs.existsSync(`${root + conf.paths.input.icons}/style.css`)) {
                        let file = fs.readFileSync(`${root + conf.paths.input.icons}/style.css`).toString();

                        Object.keys(variables).map(variable => {
                            file = file.replace(new RegExp(`@{${variable}}`, 'g'), `${variables[variable]}`)
                            file = file.replace(`@${variable}`, `var(--${variable})`)
                        })

                        fs.writeFileSync(`${root + conf.paths.input.icons}/style.css`, file);
                    }

                    console.log("\x1b[34m", `Icomoon demo - https://i.icomoon.io/public/reference.html#/${conf.icons.id}/${conf.icons.name}/`, "\x1b[0m");
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
        const cleanCSS = (await import('gulp-clean-css')).default;
        const rename = (await import('gulp-rename')).default;
        const revision = (await import("gulp-rev")).default;

        const rev = lazypipe().pipe(revision).pipe(Functions.revUpdate, true);

        const clean = lazypipe().pipe(cleanCSS);

        const build = lazypipe().pipe(() => gulpif("*.css", postcss([importCSS, postcssPresetEnv({
            stage: 0,
            features: {
                'custom-properties': false
            }
        })]))
        ).pipe(() => gulpif("*.less", Modules.less.module()))

        return gulp.src(`${root + conf.paths.input.icons}/style.{css,less}`)
            .pipe(plumber(Functions.plumber))
            .pipe(rename(function(path){
                path.basename = conf.icons.filename;
            }))
            .pipe(replace('--"]', '--"]:before'))
            .pipe(replace('!important;', ';'))
            .pipe(replace('@font-face {', '@font-face { font-display: block;'))
            .pipe(build())
            .pipe(gulpif(conf.icons.revision, rev()))
            .pipe(gulpif(conf.icons.optimizations, clean()))
            .pipe(gulp.dest(root + conf.paths.output.icons))
            .pipe(revision.manifest(root + conf.paths.output.icons + "/rev-manifest.json",{
                merge: true,
                base: root + conf.paths.output.icons
            }))
            .pipe(gulp.dest(root + conf.paths.output.icons));
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
            removeStyleTags: conf.emails.inlineOnly
        }

        const buildCss = lazypipe().pipe(() => gulpif("*.css", postcss([importCSS, postcssPresetEnv({
            stage: 0,
            features: {
                'custom-properties': {
                    preserve: false
                }
            }
        })]))
        ).pipe(() => gulpif("*.less", Modules.less.module()))

        return new Promise(resolve => {
            let twigFiles = "*.twig";
            let hbsFiles = "*.hbs";

            if (conf.emails.format === "twig") {
                twigFiles = twigFiles.replace("twig", "{twig,latte,tpl}")
            } else if (conf.emails.format === "hbs") {
                hbsFiles = hbsFiles.replace("hbs", "{hbs,latte,tpl}")
            }

            const build = lazypipe().pipe(() => gulpif(twigFiles, twig({
                functions: new Templates().functions,
                filters: new Templates().filters,
                extensions: new Templates().tags
            })))
            .pipe(() => gulpif(hbsFiles, Modules.hbs.module(`${root + conf.paths.input.emails}/**/*.hbs`, Modules.hbs.helpers())))
            .pipe(() => gulpif("*.{hbs,twig}", rename({ extname: ".html" })))

            gulp.series(
                function styles() {
                    return gulp.src(root + conf.paths.input.emails + '/*.{css,less}')
                        .pipe(buildCss())
                        .pipe(gulp.dest(root + conf.paths.temp + "/emails"));
                },
                function templates() {
                    return gulp.src(root + conf.paths.input.emails + '/*.{hbs,twig,tpl,latte}')
                        .pipe(build())
                        .pipe(replace('<table', '<table border="0" cellpadding="0" cellspacing="0"'))
                        .pipe(inlineCss(inlineCssOpt))
                        .pipe(gulpif(conf.emails.removeClasses,replace(/class="([A-Za-z0-9 _]*)"/g, '')))
                        .pipe(gulpif(("*.html"), gulp.dest(root + conf.paths.output.emails)))
                        .pipe(gulpif("*.{latte,tpl}", gulp.dest(root + conf.paths.cms.emails)))
                }
            )(resolve)
        })
    }
    zip() {
        return new Promise(async (resolve) => {
            const AdmZip = (await import('adm-zip')).default;

            let files = fs.readdirSync(root + conf.paths.output.emails);
            let prefixes = conf.emails.zipPrefix;

            function zipFile(file, imageSubfolder) {
                let zip = new AdmZip();

                if (typeof imageSubfolder !== "undefined" && fs.existsSync(`${root + conf.paths.output.emailsImg}/${imageSubfolder}`)) {
                    if (imageSubfolder.endsWith("-")) {
                        imageSubfolder.slice(0, imageSubfolder.length - 1)
                    }
                    imageSubfolder = "/" + imageSubfolder
                } else {
                    imageSubfolder = ""
                }

                zip.addFile("index.html", fs.readFileSync(`${root + conf.paths.output.emails}/${file}`));
                zip.toBuffer();

                if (fs.existsSync(`${root + conf.paths.output.emailsImg}${imageSubfolder}`)) {
                    zip.addLocalFolder(`${root + conf.paths.output.emailsImg}${imageSubfolder}`, `images${imageSubfolder}`);
                }

                zip.writeZip(`${root + conf.paths.output.emails}/${file.replace(".html", ".zip")}`);
            }

            files.forEach((file) => {
                if (file.endsWith(".html")) {
                    if (conf.emails.zipPrefix) {
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

export class Cms {
    install() {
        return new Promise(resolve => {
            if (fs.existsSync(`www`)) {
                console.warn("CMS already installed");
                resolve();
            }

            Functions.execSync(`git clone -b ${conf.cms.branch} --single-branch --depth 1 git@git.newlogic.cz:newlogic-dev/cms-develop.git ${root + conf.paths.temp}/cms`);

            function errorMessage(err) {
                console.log("\x1b[31m", err, "\x1b[0m");
            }

            (async() => {
                await fse.remove(`${root + conf.paths.cms.temp}/www/examples`);
                await fse.move(`${root + conf.paths.cms.temp}/index.php`, 'index.php').catch(err => errorMessage(err));
                await fse.move(`${root + conf.paths.cms.temp}/.htaccess`, '.htaccess').catch(err => errorMessage(err));
                await fse.move(`${root + conf.paths.cms.temp}/robots.php`, 'robots.php').catch(err => errorMessage(err));
                await fse.move(`${root + conf.paths.cms.temp}/admin_ex/js/main.js`, 'admin_ex/js/main.js').catch(err => errorMessage(err));
                await fse.move(`${root + conf.paths.cms.temp}/api`, 'api').catch(err => errorMessage(err));
                await fse.move(`${root + conf.paths.cms.temp}/www`, 'www').catch(err => errorMessage(err));

                if (conf.cms.full) {
                    await fse.move(`${root + conf.paths.cms.temp}/admin`, 'admin').catch(err => errorMessage(err));
                    await fse.move(`${root + conf.paths.cms.temp}/userfiles`, 'userfiles').catch(err => errorMessage(err));
                    await fse.move(`${root + conf.paths.cms.temp}/xml`, 'xml').catch(err => errorMessage(err));
                }

                await fse.remove(`${root + conf.paths.cms.temp}`);
            })().then(resolve);
        })
    }
    prepare(done) {
        gulp.series(
            typeof conf.modules.hbs !== "undefined" ? new conf.modules.hbs().templates : done => done,
            function components() {
                let pathComp = root + conf.paths.cms.components;

                String.prototype.toCamel = function(){
                    return this.replace(/[-_]([a-z])/g, function (g) { return g[1].toUpperCase(); })
                };

                String.prototype.capitalize = function() {
                    return this.charAt(0).toUpperCase() + this.slice(1);
                };

                if (!fs.existsSync(pathComp)){
                    fs.mkdirSync(pathComp);
                }

                return new Promise(resolve => {
                    let items = fs.readdirSync(`${root + conf.paths.input.templates}/${conf.cms.sectionsDir}`);
                    let pages = fs.readdirSync(`${root + conf.paths.input.templates}/`);
                    let pageComponents = [];

                    getComponents((name, path) => {
                        path = path.replace("." + conf.cms.format.templates,"");

                        pages.forEach((page) => {
                            if (!page.includes(".json")) {
                                return
                            }

                            let json = JSON.parse(fs.readFileSync(`${root + conf.paths.input.templates}/${page}`).toString());
                            let main;

                            if (typeof json["page"] !== "undefined") {
                                if (typeof json["page"]["main"] !== "undefined") {
                                    main = json["page"]["main"]
                                }
                            }

                            if (typeof main !== "undefined") {
                                main.filter(function(item) {
                                    if (item.src === path) {
                                        if (typeof pageComponents[path] === "undefined") {
                                            pageComponents[path] = []
                                            pageComponents[path].push(item);
                                        } else {
                                            pageComponents[path].push(item);
                                        }
                                    }
                                });
                            }
                        });
                    });

                    function getAnnotations(path, variables) {
                        let annotations = [];
                        let vars = [];

                        if (typeof pageComponents[path] !== "undefined") {
                            let keys = lodash.merge(...pageComponents[path])["comp"];

                            if (typeof keys === "undefined") {
                                keys = lodash.merge(...pageComponents[path]);
                            }

                            Object.keys(keys).forEach(function(ls) {
                                if (ls === "src") {
                                    return false;
                                }
                                if (ls === "wsw") {
                                    annotations.push(`
                                            /** WSW **/
                                            public $${ls};
                                    `);
                                } else if (ls === "text") {
                                    annotations.push(`
                                            /** TEXTAREA **/
                                            public $${ls};
                                    `);
                                } else if (typeof keys[ls] === "string") {
                                    annotations.push(`
                                            /** TEXT **/
                                            public $${ls};
                                    `);
                                } else if (typeof keys[ls] === "boolean") {
                                    annotations.push(`
                                            /** RADIO **/
                                            public $${ls};
                                    `);
                                } else if (Array.isArray(keys[ls]) || typeof keys[ls] === "object") {
                                    annotations.push(`
                                            /** TEXTAREA TYPE:OBJECT **/
                                            public $${ls};
                                    `);

                                    if (typeof variables !== "undefined" && variables) {
                                        // '${JSON.stringify(keys[ls])}'
                                        vars.push(`
                                                $this->${ls} = json_decode($this->${ls}, true);
                                        `);
                                    }
                                } else {
                                    annotations.push(`
                                        public $${ls};
                                `);
                                }
                            });
                        }

                        if (typeof variables !== "undefined" && variables) {
                            if (vars.length > 0) {
                                vars = vars.map((item) => item).join("");
                            } else {
                                vars = "";
                            }

                            return vars;
                        } else {
                            if (annotations.length > 0) {
                                annotations = annotations.map((item) => item).join("");
                            } else {
                                annotations = "";
                            }

                            return annotations;
                        }
                    }

                    function writeComponent(name, path) {
                        if (!name.match(/(Ui)/)) {
                            if (!fs.existsSync(`${pathComp}/${name}.php`)) {
                                fs.writeFileSync(`${pathComp}/${name}.php`,
                                    Functions.stripIndent(`
                                    <?php
        
                                    namespace Components;
                                    
                                    class ${name} extends BaseComponent implements IComponent
                                    {
                                        ${getAnnotations(path.replace(".tpl",""))}
                                        public function render()
                                        {
                                            ${getAnnotations(path.replace(".tpl",""), true)}
                                            $this->addTemplate('${path}');
                                        }
                                    }`).replace(/^\s*\n/g, ""));
                            }
                        }
                    }

                    function getComponents(callback) {
                        items.forEach((i) => {
                            if (i === ".gitkeep") {
                                return
                            }
                            if (fs.statSync(`${root + conf.paths.input.templates}/${conf.cms.sectionsDir}/${i}`).isDirectory()) {
                                let items = fs.readdirSync(`${root + conf.paths.input.templates}/${conf.cms.sectionsDir}/${i}`);

                                items.forEach((e) => {
                                    let name = i.replace("." + conf.templates.format,"").toCamel().capitalize() + e.replace("." + conf.templates.format,"").toCamel().capitalize();
                                    let path = `${conf.cms.sectionsDir}/${i}/${e.replace("." + conf.templates.format, "")}.${conf.cms.format.templates}`;
                                    callback(name, path)
                                });
                            } else {
                                let name = i.replace("." + conf.templates.format,"").toCamel().capitalize();
                                let path = `${conf.cms.sectionsDir}/${i.replace("." + conf.templates.format, "")}.${conf.cms.format.templates}`;
                                callback(name, path)
                            }
                        });
                    }

                    getComponents((name, path) => writeComponent(name, path));

                    resolve()
                });
            }
        )(done)
    }
}

export class Serve {
    async init() {
        return new Promise(resolve => {

            if (conf.serve.server === "wds") {
                fs.writeFileSync(`${root + conf.paths.temp}/wds.config.mjs`,`
                    import rollupStyles from 'rollup-plugin-styles';
                    import { fromRollup, rollupAdapter } from '@web/dev-server-rollup';
                    import postcssPresetEnv from "postcss-preset-env"
                    import importCSS from "postcss-import"
                    
                    const styles = fromRollup(rollupStyles);
                    
                    export default {
                        middleware: [
                            function rewriteIndex(context, next) {
                                if (${conf.serve.rewriteOutput} && !context.url.startsWith("/${conf.paths.input.root}") && !context.url.startsWith("/node_modules") && !context.url.startsWith("/__")) {
                                    context.url = '/${conf.paths.output.root}/' + context.url;
                                }
                                
                                return next();
                            },
                        ],
                        mimeTypes: {
                            '${conf.paths.input.root}/**/*.css': 'js',
                            '${conf.paths.input.root}/**/*.less': 'js'
                        },
                        plugins: [styles({ plugins: [importCSS, postcssPresetEnv({ stage: 0 })], include: ['${conf.paths.input.root}/**/*.css', '${conf.paths.input.root}/**/*.less'] })],
                    }
                `)

                nodeCmd.exec(`npx wds --watch --open ${conf.serve.index} --config ${conf.paths.temp}/wds.config.mjs`, err => err && console.log(err));
            }

            if (conf.serve.server === "vite") {
                fs.writeFileSync(`${root + conf.paths.temp}/vite.config.js`,`
                    import postcssPresetEnv from "postcss-preset-env"
                    import importCSS from "postcss-import"
                    
                    export default {
                        server: {open: "${conf.serve.index}"},
                        css: {
                            postcss: {
                                plugins: [importCSS, postcssPresetEnv({
                                    stage: 0,
                                    features: {
                                        'custom-properties': false
                                    }
                                })]
                            }
                        }
                    }
                `)

                nodeCmd.exec(`npx vite --config ${conf.paths.temp}/vite.config.js`, err => err && console.log(err));
            }

            console.log("\x1b[34m", "[Web Dev Server] running at localhost","\x1b[0m");
            resolve();
        })

        // const postcss = fromRollup(rollupPostcss);
        //
        // return startDevServer({
        //     config: {
        //         appIndex: `${root + conf.paths.output.root}/${conf.serve.index}`,
        //         watch: true,
        //         open: true,
        //         mimeTypes: {
        //             'src/**/*.css': 'js',
        //         },
        //         plugins: [postcss({ plugins: [importCSS, postcssPresetEnv({ stage: 0 })], include: ['src/**/*.css'] })],
        //     },
        //     logStartMessage: false,
        //     readFileConfig: false,
        // });
    }
}

export class Watch {
    get paths() {
        return {
            scripts: [`${root + conf.paths.input.scripts}/**`, `!${root + conf.paths.input.scripts}/**/\\${conf.scripts.importResolution.filename}`],
            styles: [`${root + conf.paths.input.styles}/**`, `!${root + conf.paths.input.styles}/**/\\${conf.styles.importResolution.filename}`],
            templates: [`${root + conf.paths.input.templates}/**`, root + conf.paths.input.main, `!${root + conf.paths.input.templates}/*.${conf.templates.format}`]
        }
    }
    dev() {
        if (!conf.vite) {
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
            gulp.watch(`${root + conf.paths.input.emails}/**`, gulp.series("emails:build"))
        }
    }
    build(type) {
        let templates = type !== "production" ? "templates" : "templates:production";

        gulp.watch("package.json", Exists.templates ? gulp.series("importmap", templates) : gulp.series("importmap"))

        if (Exists.scripts) {
            let tasks = [`scripts:${type}`]

            if (Exists.templates && conf.scripts.revision === true) {
                tasks.push(templates)
            }

            gulp.watch(this.paths.scripts, gulp.series(tasks))
        }

        if (Exists.styles) {
            let tasks = [`styles:${type}`]

            if (Exists.templates && conf.styles.revision === true) {
                tasks.push(templates)
            }

            gulp.watch(this.paths.styles, gulp.series(tasks))
        }

        if (Exists.templates) {
            gulp.watch(this.paths.templates, gulp.series(templates))
        }

        if (Exists.icons && Exists.templates && conf.icons.revision === true) {
            gulp.watch(`${root + conf.paths.output.icons}/${conf.icons.filename}*`, gulp.series(templates));
        }

        if (Exists.assets && type === "production") {
            gulp.watch(`${root + conf.paths.input.assets}/**`, gulp.series("assets"))
        }

        if (Exists.emails) {
            gulp.watch(`${root + conf.paths.input.emails}/**`, gulp.series("emails:build"))
        }
    }
}

export class Core {
    get config() {
        return conf;
    }
    init(config = {}) {
        conf = lodash.merge(conf, config);

        if (!fs.existsSync(root + conf.paths.temp)){
            fs.mkdirSync(root + conf.paths.temp);
        }

        Exists = {
            scripts: fs.existsSync(root + conf.paths.input.scripts),
            styles: fs.existsSync(root + conf.paths.input.styles),
            icons: fs.existsSync(root + conf.paths.input.icons) && conf.icons.id !== "",
            emails: fs.existsSync(root + conf.paths.input.emails),
            assets: fs.existsSync(root + conf.paths.input.assets),
            templates: fs.existsSync(root + conf.paths.input.templates) && !conf.vite
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

                    if (typeof conf.modules.hbs !== "undefined") {
                        helpers = Object.assign(helpers, new conf.modules.hbs().helpers);
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
                    return file.extname === ".less" && conf.styles.optimizations
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
                    if (conf.errors) {
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

                    let directory = path.parse(path.relative(process.cwd(), file.path)).dir.replace(root + conf.paths.input.root, root + conf.paths.output.root)

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
                if (conf.serve.mode === "dev" || conf.serve.mode === "build") {
                    conf.errors = false;
                    conf.styles.revision = false;
                    conf.styles.purge.enabled = false;
                    conf.styles.optimizations = false;
                    conf.scripts.revision = false;
                    conf.scripts.optimizations = false;
                    conf.scripts.legacy = false;
                    conf.icons.optimizations = false;
                    conf.icons.revision = false;
                    conf.styles.vendor.cache = true;
                    conf.styles.import = ['local'];
                    conf.assets.revision = false;
                }
            }
        }

        this.tasks();
    }
    tasks() {
        if (!conf.vite) {
            (Exists.assets || Exists.icons || Exists.styles || Exists.scripts || Exists.templates)
            && gulp.task("default", resolve => {
                let tasks = [];

                !conf.local && tasks.push("cleanup", "cdn");
                Exists.assets && tasks.push("assets")
                Exists.icons && tasks.push("icons:production")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")
                Exists.templates && tasks.push("templates:production")

                conf.errors = true

                gulp.series(tasks)(resolve)
            });

            (Exists.assets || Exists.icons || Exists.styles || Exists.scripts)
            && gulp.task("production", resolve => {
                let tasks = [];

                Exists.assets && tasks.push("assets")
                Exists.styles && tasks.push("styles:production")
                Exists.scripts && tasks.push("scripts:production")
                Exists.icons && tasks.push("icons:production")

                conf.errors = true
                conf.styles.purge.docs = true

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

                conf.serve.mode = "dev";

                // TODO odebrat cdn až se opraví buildless styly
                !conf.local && tasks.push("cleanup", "cdn")
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

                if (conf.serve.mode === "") {
                    conf.serve.mode = "build";
                }

                !conf.local && tasks.push("cleanup", "cdn")
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

                if (conf.serve.mode === "") {
                    conf.serve.mode = "production";
                }

                !conf.local && tasks.push("cleanup", "cdn")
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
                // TODO tady jen fetch
                gulp.series(new Icons().fetch, new Icons().build)(resolve)
            })

            gulp.task("icons:build", (resolve) => {
                gulp.series(new Icons().fetch, new Icons().build)(resolve)
            })

            gulp.task("icons:production", () => {
                return new Icons().build()
            })
        }

        if (Exists.scripts) {
            if (!conf.vite) {
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
                // TODO odebrat build až se opraví buildless styly
                gulp.series(new Styles().importResolution, new Styles().tailwind, new Styles().build)(resolve)
            })

            if (!conf.vite) {
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

                return gulp.src(`${root + conf.paths.input.assets}/**`)
                    .pipe(gulpif(conf.assets.revision, revision()))
                    .pipe(Functions.revUpdate(true))
                    .pipe(gulp.dest(root + conf.paths.output.assets))
                    .pipe(revision.manifest())
                    .pipe(gulp.dest(root + conf.paths.output.assets))
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

        if (!conf.vite) {
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

        if (!conf.vite) {
            gulp.task("cms:install", () => {
                return new Cms().install()
            })

            gulp.task("cms:prepare", (done) => {
                return new Cms().prepare(done)
            })
        }
    }
}