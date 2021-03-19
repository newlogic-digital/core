import {Core} from  "newlogic-core";

new Core().init({
    styles: {
        purge: {
            content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'www/templates/**/*.tpl', 'temp/cdn/*.js']
        }
    }
})