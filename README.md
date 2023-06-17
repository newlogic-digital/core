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

Newlogic Core is a plugin for [Vite](https://vitejs.dev), and contains set of plugins that can be used to create modern web applications.

We use it as our main front-end set of tools at [Newlogic Digital](https://www.newlogic.cz/) to create wonders.

## 🛠️ Integrated tools
* **[Vite](https://vitejs.dev)** next-generation frontend tooling
* **[Vituum](https://vituum.dev)** fast prototyping with template engines
* **[PostCSS](https://postcss.org/)** with basic plugins
* **[TailwindCSS](https://tailwindcss.com/)** for utility classes
* **[Latte](https://github.com/vituum/vite-plugin-latte)** as template engine latte

## 🪄 Get started

```sh
npm i @newlogic-digital/core --save-dev
```

### Config

Each **Newlogic Core** project needs to have config via `vite.config.js`

```js
import core from  "@newlogic-digital/core"

export default {
  plugins: [core()]
}
```

You can also try minimal example project [core-starter](https://github.com/newlogic-digital/core-starter)

### Requirements

- [Node.js LTS (18.x)](https://nodejs.org/en/download/)
- [Vite](https://vitejs.dev/)
- [PHP 8.2](https://www.php.net/) for Latte support

## Licence
MIT
