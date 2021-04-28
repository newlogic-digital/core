// import Config from "./gulpfile.js";
import {Config, Functions} from "./index.js";
import fs from "fs";
import fse from "fs-extra";
import gulp from "gulp";
import lodash from "lodash";

const root = process.cwd() + "/";

export class Cms {
    install() {
        return new Promise(resolve => {
            if (fs.existsSync(`www`)) {
                console.warn("CMS already installed");
                resolve();
            }

            Functions.execSync(`git clone -b ${Config.cms.branch} --single-branch --depth 1 git@git.newlogic.cz:newlogic-dev/cms-develop.git ${root + Config.paths.temp}/cms`);

            function errorMessage(err) {
                console.log("\x1b[31m", err, "\x1b[0m");
            }

            (async() => {
                await fse.remove(`${root + Config.paths.cms.temp}/www/examples`);
                await fse.move(`${root + Config.paths.cms.temp}/index.php`, 'index.php').catch(err => errorMessage(err));
                await fse.move(`${root + Config.paths.cms.temp}/.htaccess`, '.htaccess').catch(err => errorMessage(err));
                await fse.move(`${root + Config.paths.cms.temp}/robots.php`, 'robots.php').catch(err => errorMessage(err));
                await fse.move(`${root + Config.paths.cms.temp}/admin_ex/js/main.js`, 'admin_ex/js/main.js').catch(err => errorMessage(err));
                await fse.move(`${root + Config.paths.cms.temp}/api`, 'api').catch(err => errorMessage(err));
                await fse.move(`${root + Config.paths.cms.temp}/www`, 'www').catch(err => errorMessage(err));

                if (Config.cms.full) {
                    await fse.move(`${root + Config.paths.cms.temp}/admin`, 'admin').catch(err => errorMessage(err));
                    await fse.move(`${root + Config.paths.cms.temp}/userfiles`, 'userfiles').catch(err => errorMessage(err));
                    await fse.move(`${root + Config.paths.cms.temp}/xml`, 'xml').catch(err => errorMessage(err));
                }

                await fse.remove(`${root + Config.paths.cms.temp}`);
            })().then(resolve);
        })
    }
    prepare(done) {
        gulp.series(
            typeof Config.modules.hbs !== "undefined" ? new Config.modules.hbs().templates : done => done,
            function components() {
                let pathComp = root + Config.paths.cms.components;

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
                    let items = fs.readdirSync(`${root + Config.paths.input.templates}/${Config.cms.sectionsDir}`);
                    let pages = fs.readdirSync(`${root + Config.paths.input.templates}/`);
                    let pageComponents = [];

                    getComponents((name, path) => {
                        path = path.replace("." + Config.cms.format.templates,"");

                        pages.forEach((page) => {
                            if (!page.includes(".json")) {
                                return
                            }

                            let json = JSON.parse(fs.readFileSync(`${root + Config.paths.input.templates}/${page}`).toString());
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
                            if (fs.statSync(`${root + Config.paths.input.templates}/${Config.cms.sectionsDir}/${i}`).isDirectory()) {
                                let items = fs.readdirSync(`${root + Config.paths.input.templates}/${Config.cms.sectionsDir}/${i}`);

                                items.forEach((e) => {
                                    let name = i.replace("." + Config.templates.format,"").toCamel().capitalize() + e.replace("." + Config.templates.format,"").toCamel().capitalize();
                                    let path = `${Config.cms.sectionsDir}/${i}/${e.replace("." + Config.templates.format, "")}.${Config.cms.format.templates}`;
                                    callback(name, path)
                                });
                            } else {
                                let name = i.replace("." + Config.templates.format,"").toCamel().capitalize();
                                let path = `${Config.cms.sectionsDir}/${i.replace("." + Config.templates.format, "")}.${Config.cms.format.templates}`;
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