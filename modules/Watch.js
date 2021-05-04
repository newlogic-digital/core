import gulp from "gulp";
import {Config, Exists} from "./Core.js";

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