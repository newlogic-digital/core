import fs from "fs";
import fse from "fs-extra";
import {Config, Functions, root} from "./Core.js";

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
                                        'process.env.NODE_ENV': JSON.stringify('production'),
                                        [Config.paths.input.assets]: `${Config.paths.output.assets.replace(Config.paths.output.root + "/", "")}`
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