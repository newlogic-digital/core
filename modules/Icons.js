import path from "path";
import fs from "fs";
import lazypipe from "lazypipe";
import gulpif from "gulp-if";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import gulp from "gulp";
import plumber from "gulp-plumber";
import {Config, Functions, Modules, Utils, root} from "./Core.js";

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

                                        fs.writeFile(`${root + Config.paths.input.icons}/iconfont.css`, body, resolveFile)
                                    }
                                });

                            } else if (name === "style.less" && Config.icons.format === "less") {
                                response.pipe(fs.createWriteStream(`${root + Config.paths.input.icons}/iconfont.less`)).on("close", resolveFile);
                            } else {
                                response.pipe(fs.createWriteStream(`${root + Config.paths.input.icons}/${name}`)).on("close", resolveFile);
                            }
                        } else {
                            console.error("\x1b[31m", `Error: ${url} returns ${response.statusCode}`, "\x1b[0m");
                            rejectFile()
                        }
                    });
                })
            })).then(result => {
                if (result[0].status !== "rejected") {
                    if (fs.existsSync(`${root + Config.paths.input.icons}/iconfont.css`)) {
                        let file = fs.readFileSync(`${root + Config.paths.input.icons}/iconfont.css`).toString();

                        Object.keys(variables).map(variable => {
                            file = file.replace(new RegExp(`@{${variable}}`, 'g'), `${variables[variable]}`)
                            file = file.replace(`@${variable}`, `var(--${variable})`)
                        })

                        file = file.replace(new RegExp('-"]', 'g'), '-"]:before')
                        file = file.replace('!important;', ';')

                        fs.writeFileSync(`${root + Config.paths.input.icons}/iconfont.css`, file);
                    }

                    if (fs.existsSync(`${root + Config.paths.input.icons}/iconfont.less`)) {
                        let file = fs.readFileSync(`${root + Config.paths.input.icons}/iconfont.less`).toString();

                        file = file.replace(new RegExp('-"]', 'g'), '-"]:before')
                        file = file.replace('!important;', ';')

                        fs.writeFileSync(`${root + Config.paths.input.icons}/iconfont.less`, file);
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
        const cleanCSS = (await import("../packages/gulp-clean-css/index.js")).default;
        const rename = (await import('gulp-rename')).default;
        const revision = (await import("gulp-rev")).default;

        const rev = lazypipe().pipe(revision).pipe(Functions.revUpdate, true, "icons");

        const clean = lazypipe().pipe(cleanCSS);

        const build = lazypipe().pipe(() => gulpif("*.css", postcss(new Utils().postcssPlugins(Config.icons.postcss, [autoprefixer])))
        ).pipe(() => gulpif("*.less", Modules.less.module()))

        return gulp.src(`${root + Config.paths.input.icons}/iconfont.{css,less}`)
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