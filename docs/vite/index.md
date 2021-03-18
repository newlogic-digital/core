# Vite

Do Newlogic Core lze snadno integrovat jakýkoliv SPA framework jako Vue pomocí Vite.

Lze tak integrovat vpodstatě cokoliv, i třeba [Capacitor](https://capacitorjs.com/) nebo [Electron](https://www.electronjs.org/) pro vývoj nativních aplikací. Buildování si pak řeší Vite samo, a Newlogic Core řeší jen drobnosti.

## Příklad integrace Vue

**vite.config.js**
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import postcssPresetEnv from "postcss-preset-env"
import importCSS from "postcss-import"

export default defineConfig({
  plugins: [vue()],
  css: {
    postcss: {
      plugins: [importCSS, postcssPresetEnv({
        stage: 0,
        features: {
          'custom-properties': false
        }
      })]
    }
  }
})
```

**packages.json** (navýšit verze dle potřeby)
```json
{
  "scripts": {
    "serve": "gulp styles && gulp scripts && npx vite",
    "serve:production": "gulp styles && gulp scripts && npx vite preview",
    "production": "gulp styles && gulp scripts && npx vite build"
  },
  "dependencies": {
    "vue": "^3.0.5"
  }
  "optionalDependencies": {
    "vite": "^2.0.5",
    "@vitejs/plugin-vue": "^1.1.5",
    "@vue/compiler-sfc": "^3.0.5"
  }
}
```

**gulpfile.config.js**
```js
vite: true
```

**Souborová struktura**
```
- public
- src
-- assets
-- icons
-- scripts (.js)
-- styles (.css)
-- templates (.vue)
```

**Info**
- Smazat obsah složky templates - zde se použijí Vue šablony, smazat main.json, smazat obsah složky scripts - zde se použijí Vue scripty
- Tailwind si řeší Newlogic Core (včetně purgecss které se nastavuje v `gulpfile.config.js` - pozor nastavit příponu na .vue soubory)
- Tasky na Vue se zapínají přes gulp nebo npm scripts
- Při serve je doporučeno zapnout i watch pro funkci imports resolution
- Doporučuji si někde bokem hodit npm i `npm init @vitejs/app` a nakopírovat si vue věci