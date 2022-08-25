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

Starter for creating web applications. Powered by Vite and Vituum.

- ⚡️ Powered by Vite
- 💡 Modern principles
- 🚀️ Fast development
- 🛠️ Integrated tools
- 📦 Modular structure
- ✉️ Email templates

Newlogic Core is an integration for [Vituum](https://vituum.dev), and contains set of tools that can be used to create modern web applications.

We use it at [Newlogic Digital](https://www.newlogic.cz/) to create astonishing websites and applications.

## 🛠️ Integrated tools
* **[Vite](https://vitejs.dev)** next-generation frontend tooling
* **[Vituum](https://vituum.dev)** fast prototyping with template engines
* **[PostCSS](https://postcss.org/)** with basic plugins and [Tailwind CSS](https://tailwindcss.com/) for utility classes.
* **[TwigJS](https://github.com/vituum/vite-plugin-twig)** as template engine twig
* **[Latte](https://github.com/vituum/vite-plugin-latte)** as template engine latte

### 💡 Basic principle

Most of today build tools are hard to configure and not focused primary on PHP server side applications. 

PHP programmers often **don't want to configure anything**, basic idea is to add as many files you want to `src` and get output in `public/assets` - without worrying about anything.

It doesn't matter if you use Nette, Symfony or Laravel - the structure can be freely adjusted as needed - `resources` and` public`, `src` and` dist` or `app/assets` and` www` 

It's up to you - all paths are freely configurable via `vite.config.js` config

### 📦 Modularity

Newlogic Core uses [Vituum](https://vituum.dev) and [Vite](https://vitejs.dev) for frontend tooling.

Source files are divided by modules inside `src` directory - styles, scripts, templates, data, emails, assets. It is optional which modules you want to use for the project, simple delete the directory. You really only use what you want to use.

## 🪄 Get started

```sh
npm i @newlogic-digital/core --save-dev
```

### Requirements

- [Node.js LTS (16.x)](https://nodejs.org/en/download/)
- [Vituum](https://vituum.dev/)

### Config

Each **Newlogic Core** project needs to have config via `vite.config.js`

```js
import { defineConfig } from 'vituum'
import core from  "@newlogic-digital/core"

export default defineConfig({
  integrations: [core()]
})
```

You can also try minimal example project [core-starter](https://github.com/newlogic-digital/core-starter)

## Licence
MIT
