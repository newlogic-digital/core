<p align="center">
  <a href="https://core.newlogic.cz/" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://core.newlogic.cz/logo.png" alt="Logo">
  </a>
</p>
<p align="center">
  <a href="https://npmjs.com/package/@newlogic-digital/core"><img src="https://img.shields.io/npm/v/@newlogic-digital/core.svg" alt="npm package"></a>
  <a href="https://nodejs.org/en/about/releases/"><img src="https://img.shields.io/node/v/@newlogic-digital/core.svg" alt="node compatility"></a>
</p>

# ⚙️ Newlogic Core

> Still in very early development.

Modern principles for creating web applications

- 💡 Modern principles
- 🚀️ Fast development
- 🛠️ Integrated tools
- 📦 Modular structure
- ✉️ Email templates
- ⚡ Vite as webserver

Newlogic Core is a set of tools that can be used to create modern web applications. Use of modern Javascript, CSS, ES modules, dynamic imports, etc.

## 🛠️ Integrated tools
* **[PostCSS](https://postcss.org/)** with basic plugins and [Tailwind CSS](https://tailwindcss.com/) for utility classes.
* **[Rollup](https://rollupjs.org/)** for javascript build and minification
* **[Importmaps](https://github.com/WICG/import-maps)** generator for javascript buildless development
* **[CleanCSS](https://github.com/jakubpawlowicz/clean-css)** for css optimization and minification
* **[PurgeCSS](https://purgecss.com/)** for removing unused CSS
* **[TwigJS](https://purgecss.com/)** as template engine
* **[Vite](https://vitejs.dev)** for local webserver

### 💡 Basic principle

Most of today build tools are hard to configure and not focused primary on PHP server side applications. 

PHP programmers often **don't want to configure anything**, basic idea is to add as many files you want to `src` and get output in `public/assets` - without worrying about anything.

It doesn't matter if you use Nette, Symfony or Laravel - the structure can be freely adjusted as needed - `resources` and` public`, `src` and` dist` or `app/assets` and` www` 

It's up to you - all paths are freely configurable in `gulpfile.js` config

### 📦 Modularity

Newlogic Core uses currently [Gulp](https://gulpjs.com/) as smart task system, tasks are generated automatically depending on which modules you use.

Source files are divided by modules inside `src` directory - styles, scripts, templates, icons, emails, assets. It is optional which modules you want to use for the project, simple delete the directory. You really only use what you want to use.

If you use [PhpStorm](https://www.jetbrains.com/phpstorm/) tasks will load for you automatically and dynamically according to the availability of individual modules.

### ⚡ Without compilation - no building and bundling

Lets face the facts. PHP programmers **hate javascript compilation**.

Principle of Newlogic Core is to write javascript and css source code in next-gen standardized format that works in browsers or will work in the future.

Javascript sources are executable in browsers via modern solutions like **[Importmaps](https://github.com/WICG/import-maps)** - changes are instant, no waiting for build.

CSS sources still need to be compiled, because most of standardized features are not yet ready in browsers, but it's getting there.

### 🧬 Single Page Apps
For single page applications, [Vite](https://vitejs.dev/) is integrated, and you can use any SPA framework you want. From Newlogic Core, you can only use additional functionalities such as auto-generation of imports into files within folders, iconfont, etc. Or automate some processes by writing new tasks in `gulpfile.js`.

## 🪄 Instalation

```sh
npm i @newlogic-digital/core --save-dev
```

### Requirements

- [Node.js LTS (14.x)](https://nodejs.org/en/download/)
- [NPM (7.x)](https://www.npmjs.com/package/npm) or [Yarn (2.x)](https://yarnpkg.com/)

### Config

Each Newlogic Core project has to have config via `gulpfile.js`

```js
import {defineConfig} from  "@newlogic-digital/core";

// minimum configuration example
export default defineConfig({
  styles: {
    purge: {
      content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'app/Presenters/templates/**/*.latte', 'temp/cdn/*.js']
    }
  }
})
```

You can also try minimal example project [core-starter](https://github.com/newlogic-digital/core-starter)

## 📌 Future plans
- translating docs to english
- refactor or rewrite everything 😂
- concept is good, but realization could be way better
- future rewrite could drop gulp completely and use esbuild for css, js build and vite for dev server

## Licence
GNU GPLv3