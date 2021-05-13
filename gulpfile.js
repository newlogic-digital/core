import {defineConfig} from "./index.js";

export default defineConfig({
    styles: {
        purge: {
            content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'app/Presenters/templates/**/*.latte', 'temp/cdn/*.js']
        },
        ratio: {
            content: [`src/templates/**/*.{hbs,html,twig}`, 'app/Presenters/templates/**/*.latte']
        }
    }
});