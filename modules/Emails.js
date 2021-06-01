import lazypipe from "lazypipe";
import gulpif from "gulp-if";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import twig from "../packages/gulp-twig2html/index.js";
import gulp from "gulp";
import fs from "fs";
import {Config, Modules, Templates, Utils, root} from "./Core.js";

export class Emails {
    async build() {
        const inlineCss = (await import('gulp-inline-css')).default;
        const replace = (await import('gulp-replace')).default;
        const rename = (await import('gulp-rename')).default;
        const postcssCustomProperties = (await import('postcss-custom-properties')).default;

        const inlineCssOpt = {
            applyStyleTags: true,
            applyLinkTags: true,
            removeStyleTags: Config.emails.inlineOnly
        }

        const buildCss = lazypipe().pipe(() => gulpif("*.css", postcss(new Utils().postcssPlugins(Config.emails.postcss, [postcssCustomProperties({
            preserve: false
        }), autoprefixer])))
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