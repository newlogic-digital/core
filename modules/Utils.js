import fs from "fs";
import fse from "fs-extra";
import nodeCmd from "child_process";
import gulp from "gulp";
import postcssImport from "postcss-import";
import postcssNesting from "postcss-nesting";
import postcssCustomMedia from "postcss-custom-media";
import postcssCustomSelectors from "postcss-custom-selectors";
import {Config, Exists, Functions, root} from "./Core.js";

export class Utils {
    cleanup() {
        return new Promise(resolve => {
            if (fs.existsSync(root + Config.paths.temp)) {
                fse.emptyDirSync(root + Config.paths.temp);
                fs.writeFileSync(root + Config.paths.temp + "/.gitkeep", "");
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
                } else if (cdn === "skypack.dev") {
                    url = `https://cdn.skypack.dev/{DEPENDENCY}@{VERSION}`;
                    urlSub = "https://cdn.skypack.dev/{DEPENDENCY}@{VERSION}/";
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

            if (Config.sri) {
                sri[url] = `sha256-${spawnCmd(`cat ${root + Config.paths.cdn}/${fileName} | openssl dgst -sha256 -binary | openssl base64 -A`)}`;
            }

            cdnPaths.push(url.substring(0, urlName));
        }

        if (type === "templates") {
            if (fs.existsSync(`${root + Config.paths.input.main}`)) {
                const main = fs.readFileSync(root + Config.paths.input.main).toString();

                if (typeof JSON.parse(main)["assets"] !== "undefined" && typeof JSON.parse(main)["assets"]["js"] !== "undefined") {
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
            if (fs.existsSync(`${root + Config.paths.input.scripts}/${Config.scripts.cdnPath}`)) {
                const urls = fs.readFileSync(`${root + Config.paths.input.scripts}/${Config.scripts.cdnPath}`).toString().split(/\r?\n/g);

                let files = []

                Object.keys(urls).forEach(name => {
                    if (urls[name].includes("http") && !urls[name].includes("?")) {
                        let url = urls[name].match(/(?<=(["']\b))(?:(?=(\\?))\2.)*?(?=\1)/)[0];

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
                    importmap = Object.assign(importmap, JSON.parse(fs.readFileSync(dir + "/" + "importmap.json").toString()));
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
