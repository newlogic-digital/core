# 4.0.0
* feat(bc): added support for Vite v8, Vituum v2 and Rust-based Rolldown build configuration
* feat(bc): raised the required Node.js version to `^20.19.0 || >=22.12.0`
* feat(bc): moved `vite`, `@tailwindcss/vite` and `@vituum/vite-plugin-twig` to peer dependencies and made Tailwind/Twig integrations optional
* feat(bc): replaced `manualChunks` with `codeSplitting` and switched internal build overrides from `rollupOptions` to `rolldownOptions`
* feat(bc): switched the default CSS pipeline to Rust-based Lightning CSS and moved Tailwind integration to `@tailwindcss/vite`
* feat(bc): replaced `@vituum/vite-plugin-juice` with Rust-based `@vituum/vite-plugin-css-inline` for email CSS inlining
* feat: added Heroicons integration with bundled `icons.svg` generation for `src/icons/outline`, package `icons/solid` and package `icons/simpleicons`
* feat: added bundled brand icons and Newlogic logomark/logotype assets
* feat: extended default asset inputs to include all files in `src/assets/**/*`
* feat: added distributable agent skills `newlogic-ui` and `figma-implement-design`
* feat: added the `newlogic-core` CLI and helper scripts for generating shared lint config and linking bundled skills into `.agents` and `.claude`
* feat: replaced the ESLint setup with Oxlint and added shipped `eslint-stylistic.json` and `stylelint-config.json`
* feat: switched HTML minification in Latte/Twig JSON helpers to Rust-based `@minify-html/node`
* chore: removed the legacy Prism/PostHTML implementation and refreshed TypeScript/dependency configuration

## 3.1.1
* fix: tailwindcss autocomplete

## 3.1.0
* feat: added input paths configuration

## 3.0.1
* feat: updated deps

## 3.0.0
* feat(bc): removed emails copy
* feat(bc): changed default pages dir from `src/views` to `src/pages`
* feat: added tailwindcss v4 support
* feat: added newlogic ui v4 support
* feat: removed prism and posthtml
* feat: added browserlist support
* feat: updated deps
