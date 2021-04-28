import {Core} from "./index.js";
import {Cms} from "./module.cms.js";

export default new Core().init({
    modules: {Cms},
    styles: {
        purge: {
            content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'www/templates/**/*.tpl', 'temp/cdn/*.js']
        }
    }
});