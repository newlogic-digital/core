import {Core} from "./index.js";

export default new Core().init({
    styles: {
        purge: {
            content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'app/Presenters/templates/**/*.latte', 'temp/cdn/*.js']
        },
        ratio: {
            content: [`src/templates/**/*.{hbs,html,twig}`, 'app/Presenters/templates/**/*.latte']
        }
    }
});