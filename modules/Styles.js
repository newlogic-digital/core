import lodash from "lodash";
import fs from "fs";
import lazypipe from "lazypipe";
import gulp from "gulp";
import plumber from "gulp-plumber";
import gulpif from "gulp-if";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import glob from "glob";
import through from "through2";
import {Config, Exists, Functions, Modules, Utils, root} from "./Core.js";

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

export class Styles {
    get purge() {
        return {
            files: () => {
                let purgeFiles = Config.styles.purge.content;
                let dependencies = JSON.parse(fs.readFileSync(`package.json`).toString()).dependencies;

                if (typeof dependencies !== "undefined" && Config.styles.purge.nodeResolve) {
                    Object.keys(dependencies).map(lib => {
                        if (!Config.styles.purge.nodeResolveIgnore.includes(lib)) {
                            purgeFiles.push(`node_modules/${lib}/**/*.js`)
                        }
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
    ratio(source, file) {
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

        let ratiosFinal = Array.from(new Set(ratios)),
            ratiosStyles = [];

        const ratio = (val) => {
            let value = `[${val}]{aspect-ratio: ${val.match(/\d+/g)[0]} / ${val.match(/\d+/g)[1]}}`;

            if (typeof file !== "undefined" && file.extname === ".less") {
                let calc = (val.match(/\d+/g)[1] / val.match(/\d+/g)[0]) * 100;
                value = `[${val}]:before{padding-bottom: ${calc}%}`
            }

            return value;
        }

        ratiosFinal.forEach((val) => {
            ratiosStyles.push(ratio(val));
        });

        return ratiosStyles.join("\n");
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

            if (Config.styles.ratio.enabled) {
                fs.writeFileSync(`${root + Config.paths.temp}/ratio.css`, new Styles().ratio(Config.styles.ratio.content))
            }

            resolve();
        })
    }
    async tailwind() {
        const cleanCSS = (await import("../packages/gulp-clean-css/index.js")).default;
        const tailwindcss = (await import("tailwindcss")).default;
        const purgeCSS = (await import("gulp-purgecss")).default;

        if (!fs.existsSync(`${root + Config.paths.input.styles}/${Config.styles.tailwind.basename}`)) {
            return new Promise(resolve => resolve())
        }

        return new Promise(resolve => {
            if (fs.existsSync(`${root + Config.paths.temp}/${Config.styles.tailwind.basename}`) && Config.styles.tailwind.cache) {
                resolve();
                return false;
            }

            const clean = lazypipe().pipe(cleanCSS, lodash.merge({
                inline: Config.styles.import,
                level: {1: {specialComments: 0}, 2: {all: false}}
            }, Config.styles.clean), (details) => {
                if (details.warnings.length > 0) {
                    details.warnings.map(warning => console.log("\x1b[32m", warning, "\x1b[0m"))
                }
            });

            let tailwindcssConfig = {};

            if (!Exists.tailwindConfig) {
                tailwindcssConfig = { config: Config.tailwind }
            }

            gulp.src(`${root + Config.paths.input.styles}/${Config.styles.tailwind.basename}`)
                .pipe(postcss(new Utils().postcssPlugins(Config.styles.tailwind.postcss, [tailwindcss(tailwindcssConfig), aspectRatio, autoprefixer])))
                .pipe(gulpif(Config.styles.optimizations, clean()))
                .pipe(gulp.dest(root + Config.paths.temp))
                .on("end", resolve)
        })
    }
    async build() {
        const cleanCSS = (await import("../packages/gulp-clean-css/index.js")).default;
        const purgeCSS = (await import("gulp-purgecss")).default;
        const revision = (await import("gulp-rev")).default;
        const revRewrite = (await import("gulp-rev-rewrite")).default;
        const inset = (await import("../packages/postcss-inset/index.es.mjs")).default;

        const clean = lazypipe().pipe(cleanCSS, lodash.merge({
            inline: Config.styles.import,
            level: {1: {specialComments: 0}, 2: {removeEmpty: true}}
        }, Config.styles.clean), (details) => {
            if (details.warnings.length > 0) {
                details.warnings.map(warning => console.log("\x1b[32m", warning, "\x1b[0m"))
            }
        });

        const purge = lazypipe().pipe(purgeCSS, new Styles().purge.config());

        const rev = lazypipe().pipe(revision).pipe(Functions.revUpdate, true, "styles")
            .pipe(revRewrite, {manifest: fs.existsSync(`${root + Config.paths.output.assets}/rev-manifest.json`) ? fs.readFileSync(`${root + Config.paths.output.assets}/rev-manifest.json`) : ""});

        const ratio = (source) => {
            return through.obj((file, enc, cb) => {
                if (!Config.styles.ratio.files.includes(file.basename)) {
                    cb(null, file);
                    return false;
                }

                if (file.isNull()) {
                    cb(null, file);
                }

                if (file.isBuffer()) {
                    file.contents = Buffer.from(file.contents.toString() + "\n" + new Styles().ratio(source, file));
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

        const build = lazypipe().pipe(() => gulpif("*.css", postcss(new Utils().postcssPlugins(Config.styles.postcss, [autoprefixer, aspectRatio, inset])))
        ).pipe(() => gulpif("*.less", Modules.less.module()));

        return new Promise(resolve => {
            gulp.src([`${root + Config.paths.input.styles}/*.{css,less}`, `!${root + Config.paths.input.styles}/${Config.styles.tailwind.basename}`, `!${root + Config.paths.input.styles}/*-modifiers.less`])
                .pipe(plumber(Functions.plumber))
                .pipe(gulpif(Config.styles.ratio.enabled, ratio(Config.styles.ratio.content)))
                .pipe(vendor())
                .pipe(build())
                .pipe(Functions.revRewriteOutput())
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
