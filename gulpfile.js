import {Core} from "./index.js";

export default new Core().init({
    styles: {
        purge: {
            content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'www/templates/**/*.tpl', 'temp/cdn/*.js']
        }
    }
})