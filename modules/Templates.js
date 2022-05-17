import fs from "fs";
import path from "path";
import lazypipe from "lazypipe";
import gulpif from "gulp-if";
import twig from "../packages/gulp-twig2html/index.js";
import lodash from "lodash";
import gulp from "gulp";
import plumber from "gulp-plumber";
import minifier from "html-minifier";
import through from "through2";
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/index.js'
import NormalizeWhitespace from 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace.js'
import {Config, Exists, Functions, Modules, root} from "./Core.js";

loadLanguages(['markup', 'css', 'javascript'])

export class Templates {
    get functions() {
        return Object.assign(Config.templates.functions, {
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
        })
    }
    get filters() {
        return Object.assign(Config.templates.filters, {
            "asset": (url) => {
                let directoryPath = "";

                if (Config.serve.mode === "dev" && url.indexOf("/" + Config.paths.input.root) === 0 || url.includes("https://") || url.includes("http://")) {
                    return url;
                }

                if (Config.serve.mode !== "dev" && url.indexOf("/" + Config.paths.input.root) === 0) {
                    url = url
                      .replace(`/${Config.paths.input.styles}`, `/${Config.paths.output.styles}`)
                      .replace(`/${Config.paths.input.scripts}`, `/${Config.paths.output.scripts}`)
                      .replace(`/${Config.paths.input.assets}`, `/${Config.paths.output.assets}`)
                      .replace(`/${Config.paths.input.icons}`, `/${Config.paths.output.icons}`)
                      .replace(".less", ".css")
                }

                directoryPath = url.substr(0, url.lastIndexOf("/"));

                if (directoryPath.indexOf("/") === 0) {
                    directoryPath = directoryPath.slice(1);
                }

                if (fs.existsSync(root + `${directoryPath}/rev-manifest.json`)) {
                    let rev = JSON.parse(fs.readFileSync(root + `${directoryPath}/rev-manifest.json`, 'utf8').toString());

                    Object.keys(rev).forEach(function eachKey(key) {
                        if (url.indexOf(key) > -1) {
                            url = url.replace(key,rev[key]);
                        }
                    })
                } else if (directoryPath.indexOf(Config.paths.output.assets) !== -1 && fs.existsSync(`${root + Config.paths.output.assets}/rev-manifest.json`)) {
                    let rev = JSON.parse(fs.readFileSync(root + Config.paths.output.assets + '/rev-manifest.json', 'utf8').toString());

                    Object.keys(rev).forEach(function eachKey(key) {
                        if (url.indexOf(key) > -1) {
                            url = url.replace(key,rev[key]);
                        }
                    })
                }

                if (Config.paths.output.rewrite && url.indexOf(`/${Config.paths.output.root}`) === 0) {
                    url = url.replace(`/${Config.paths.output.root}`, Config.paths.base.length > 0 ? `/${Config.paths.base}` : "")
                }

                return url;
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
        })
    }
    get tags() {
        return Config.templates.tags.concat([
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

                        const Normalize = new NormalizeWhitespace({
                            'remove-trailing': true,
                            'remove-indent': true,
                            'left-trim': true,
                            'right-trim': true,
                        });

                        const wrap = (code, lang) => {
                            return `<pre class="language-${lang}"><code>${code}</code></pre>`
                        }

                        const highlight = (str, lang) => {
                            if (!lang) {
                                return wrap(str, 'text')
                            }
                            lang = lang.toLowerCase()
                            const rawLang = lang
                            if (lang === 'vue' || lang === 'html') {
                                lang = 'markup'
                            }
                            if (lang === 'md') {
                                lang = 'markdown'
                            }
                            if (lang === 'ts') {
                                lang = 'typescript'
                            }
                            if (lang === 'py') {
                                lang = 'python'
                            }
                            if (!Prism.languages[lang]) {
                                try {
                                    loadLanguages([lang])
                                } catch (e) {
                                    console.warn(`Syntax highlight for language "${lang}" is not supported.`)
                                }
                            }
                            if (Prism.languages[lang]) {
                                const code = Prism.highlight(Normalize.normalize(str), Prism.languages[lang], lang)
                                return wrap(code, rawLang)
                            }
                            return wrap(str, 'text')
                        }

                        return {
                            chain: chain,
                            output: `${mirror ? output : ""}${highlight(output, type)}`
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
        ])
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

        let outputDir = "/" + Config.paths.output.root;

        if (Config.paths.output.root === Config.paths.output.assets) {
            outputDir = ""
        }

        const contextParams = {
            config: Config,
            lang: Config.lang,
            outputPath: "/" + Config.paths.output.root,
            inputPath: "/" + Config.paths.input.root,
            resolvePath: Config.serve.mode === "dev" ? "" : outputDir,
        }

        const twigParams = {
            functions: this.functions,
            filters: this.filters,
            extensions: this.tags,
            context: lodash.merge(contextParams, {
                layout: {template: Config.templates.layout}
            }),
            namespaces: {
                'src': Config.paths.input.root
            },
            globals: root + Config.paths.input.main
        }

        const clearFile = () => {
            return through.obj((file, enc, cb) => {
                if (file.isBuffer()) {
                    if (file.extname === ".json") {
                        file = null;
                    }

                    cb(null, file);
                }
            });
        };

        const fileJSON = (file) => {
            if (path.basename(file.path).indexOf("json") > -1 || path.basename(file.path).indexOf("dialog") > -1) {
                return true;
            }
        }

        const fileTemplate = (file) => {
            if (fs.existsSync(file.path.replace('.json',`.${Config.templates.format}`))) {
                return true;
            }
        }

        const hbsData = (file) => {
            let fileName = path.basename(file.path);
            let filePath = `${root + Config.paths.input.templates}/${fileName.replace(`.${Config.templates.format}`,'.json')}`;
            let main = {};

            if (fs.existsSync(root + Config.paths.input.main)) {
                main = lodash.merge({layout: {template: Config.templates.layout}}, JSON.parse(fs.readFileSync(root + Config.paths.input.main).toString()));
            }

            if (fs.existsSync(filePath)) {
                return lodash.merge(main, JSON.parse(fs.readFileSync(filePath).toString()));
            } else {
                return main;
            }
        }

        const hbsLayout = () => {
            return through.obj((file, enc, cb) => {
                if (file.isBuffer()) {

                    file.contents = Buffer.from("{{> (lookup layout 'template')}}");

                    cb(null, file);
                }
            });
        }

        const hbsPartials = `${root + Config.paths.input.templates}/**/*.hbs`;
        const hbsHelpers = Modules.hbs.helpers(Object.assign(this.filters, this.functions));

        const renameJson = lazypipe().pipe(rename, { extname: '.json' });
        const renameHtml = lazypipe().pipe(rename, { extname: '.html' }).pipe(htmlmin,opts);

        const buildLayoutClear = lazypipe().pipe(() => gulpif(fileTemplate, clearFile()));
        const buildLayoutTwig = lazypipe().pipe(() => gulpif(Config.templates.format === "twig", twig(lodash.merge(twigParams, {data: "{% include layout.template %}"}))));
        const buildLayoutHbs = lazypipe()
            .pipe(() => gulpif(Config.templates.format === "hbs", hbsLayout()))
            .pipe(() => gulpif(Config.templates.format === "hbs", data((file) => hbsData(file))))
            .pipe(() => gulpif(Config.templates.format === "hbs", Modules.hbs.module(hbsPartials, hbsHelpers, contextParams)));

        const buildClassic = lazypipe()
            .pipe(() => gulpif("*.twig", twig(twigParams)))
            .pipe(() => gulpif("*.hbs", data((file) => hbsData(file))))
            .pipe(() => gulpif("*.hbs", Modules.hbs.module(hbsPartials, hbsHelpers, contextParams)));

        return Promise.all([
            new Promise(resolve => gulp.src([`${root + Config.paths.input.templates}/*.{hbs,html,twig}`])
                .pipe(plumber(Functions.plumber))
                .pipe(buildClassic())
                .pipe(gulpif(fileJSON, renameJson(), renameHtml()))
                .pipe(gulp.dest(root + Config.paths.output.root))
                .on("end", resolve)),
            new Promise(resolve => gulp.src([`${root + Config.paths.input.templates}/*.json`])
                .pipe(plumber(Functions.plumber))
                .pipe(buildLayoutClear())
                .pipe(buildLayoutTwig())
                .pipe(buildLayoutHbs())
                .pipe(renameHtml())
                .pipe(gulp.dest(root + Config.paths.output.root))
                .on("end", resolve))
        ])
    }
}
