# Dokumentace

Newlogic Core používá pro svojí základní funkcionalitu Gulp. Ten lze různě konfigurovat. 

## Config

Nastavení configu lze upravovat v `gulpfile.js` v rámci inicializace knihovny

Příklad základního nastavení:

```js
// gulpfile.js
import {Core} from  "newlogic-core";

new Core().init({
  styles: {
    purge: {
      content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'www/templates/**/*.tpl', 'temp/cdn/*.js']
    }
  }
})
```

Newlogic Core používá moderní zápis ES modulů, v package.json je nutné mít nastaveno `type: "module"`. V některých případech se tomuto dá vyhnout přejmenováním .js na .mjs

Do `gulpfile.js` lze psát i vlastní Gulp tasky. Lze taky přímo využít interní třídy a to `Utils`, `Scripts`, `Styles`, `Templates`, `Icons`, `Emails`, `Cms`, `Serve`, `Watch` a `Core`. 

K instanci configu lze přistupovat pomocí `new Core().config`.

## Hlavní nastavení

### lang

- **Type:** `string`
- **Default:** `"cs"`

  Výchozí jazyk aplikace

### local

- **Type:** `boolean`
- **Default:** `false`

  Povolení lokálního módu, může se hodit pokud není k dispozici internet. V takovém případě se všechny stažené cdn odkazy budou načítat lokálně.

### errors

- **Type:** `boolean`
- **Default:** `true`

  Povolení zobrazování chyb při kompilaci, pokud nastane chyba tak se příkaz přeruší. Vhodné pro produkční build aby se předešlo chybám.

### vite

- **Type:** `boolean`
- **Default:** `false`

  Povolení použití [Vite](/vite), zejména vhodné pro SPA aplikace ve Vue. Při tomto nastavení se většina tasků Newlogic Core deaktivuje a buildovací proces se plně přenechává Vite. 

### serve.index

- **Type:** `string`

  Výchozí stránka která se má otevřít při zapnutí serveru, např. `login.html`, ve výchozím stavu se otvírá vždycky `index.html`

### serve.mode

- **Type:** `string`

  Možnost natvrdo nastavit mód serveru, lze nastavit `dev`, `build` a `production`. Ve výchozím stavu se nastavuje automaticky podle tasků `serve`, `serve:build`, `serve:production`

### serve.rewriteDist

- **Type:** `boolean`
- **Default:** `true`

  Zda se má obsah načítat relativně ve složce dist, např. routování cesty z `/dist/assets/main.css` na `/assets/main.css`

### serve.server

- **Type:** `string`
- **Default:** `"wds"`

  Typ serveru který se používá, ve výchozím stavu se používá [Web Dev Server](https://modern-web.dev/docs/dev-server/overview/), pro serve lze použít i [Vite](https://vitejs.dev/) nastavením hodnoty `"vite"`. Vite umí navíc např. načítat ES moduly přímo z node_modules.  

### modules

- **Type:** `object`

  Dodatečné moduly kterými lze rozšířit funkcionalitu. V současné chvíli lze rozšířit funkcionality .hbs šablon.

  ```js
    import hbs from "./src/gulp.hbs.js";
    
    export default {
        modules: {hbs}
    }
  ```

### cms.branch

- **Type:** `string`
- **Default:** `"dev"`

  Nastavení jaká větev se má použít pro stažení Newlogic CMS

### cms.full

- **Type:** `boolean`
- **Default:** `false`

  Zda se má Newlogic CMS stáhnout kompletně, včetně všech potřebných souborů pro lokální vývoj (pozor tyto soubory jsou v .gitignore)

### cms.format.templates

- **Type:** `string`
- **Default:** `"tpl"`

  Nastavení formátu šablon který se v Newlogic CMS používá

## Cesty

### paths.temp

- **Type:** `string`
- **Default:** `"temp"`

  Zde se ukládají dočasné soubory

### paths.cdn

- **Type:** `string`
- **Default:** `"temp/cdn"`

  Zde se ukládají stažené cdn odkazy použité v projektu, pro případný lokální vývoj a cache.

### paths.input.root

- **Type:** `string`
- **Default:** `"src"`

  Hlavní root složka zdrojových souborů

### paths.input.main

- **Type:** `string`
- **Default:** `"src/main.json"`

  Cesta k hlavnímu nastavovacímu souboru pro šablony

### paths.input.templates

- **Type:** `string`
- **Default:** `"src/templates"`

  Cesta k kde se nachází šablony

### paths.input.scripts

- **Type:** `string`
- **Default:** `"src/scripts"`

  Cesta k kde se nachází javascript

### paths.input.styles

- **Type:** `string`
- **Default:** `"src/styles"`

  Cesta k kde se nachází styly

### paths.input.icons

- **Type:** `string`
- **Default:** `"src/icons"`

  Cesta k kde se nachází iconfont

### paths.input.emails

- **Type:** `string`
- **Default:** `"src/emails"`

  Cesta k kde se nachází email šablony a styly

### paths.input.assets

- **Type:** `string`
- **Default:** `"src/assets"`

  Cesta k kde se nachází další soubory jako obrázky, písma apod.

### paths.output.root

- **Type:** `string`
- **Default:** `"dist"`

  Hlavní output složka zkompilovaných souborů

### paths.output.scripts

- **Type:** `string`
- **Default:** `"dist/scripts"`

  Cesta k kde se nachází zkompilované javascript soubory

### paths.output.styles

- **Type:** `string`
- **Default:** `"dist/styles"`

  Cesta k kde se nachází zkompilované styly

### paths.output.icons

- **Type:** `string`
- **Default:** `"dist/styles"`

  Cesta k kde se nachází zkompilovaný iconfont

### paths.output.emails

- **Type:** `string`
- **Default:** `"dist"`

  Cesta k kde se nachází zkompilované emaily

### paths.output.emailsImg

- **Type:** `string`
- **Default:** `"dist/img"`

  Cesta k kde se nachází obrázky k emailům

### paths.output.assets

- **Type:** `string`
- **Default:** `"dist/assets"`

  Cesta kam se kopírují soubory ze `input.assets` s vlastním hashem v názvu

### paths.cms.temp

- **Type:** `string`
- **Default:** `"temp/cms"`

  Zde se stahují dočasné soubory Newlogic CMS při instalaci

### paths.cms.templates

- **Type:** `string`
- **Default:** `"www/templates"`

  Cesta k šablonám v Newlogic CMS

### paths.cms.components

- **Type:** `string`
- **Default:** `"www/components"`

  Cesta ke komponentám v Newlogic CMS

## Ikony

### icons.format

- **Type:** `string`
- **Default:** `"css"`

  Výchozí formát souborů stylů, lze nastavit `"css"` a `"less"`. Při nastavení less se stáhnout soubory pro iconfont ve formátu less.

### icons.name

- **Type:** `string`

  Název iconfontu, ve výchozím stavu se bere z názvu projektu. Důležité pro správné stažení z icomoon.io

### icons.filename

- **Type:** `string`
- **Default:** `"iconfont"`

  Název zkompilovaného souboru iconfontu

### icons.id

- **Type:** `string`
- **Default:** `"iconfont"`

  Id icomoon.io projektu ze kterého se má iconfont stahovat

### icons.local

- **Type:** `boolean`
- **Default:** `false`

 Zda se má přeskočit stahování iconfontu a používají se jen lokální soubory

### icons.revision

- **Type:** `boolean`
- **Default:** `true`

  Zda se má u zkompilovaného souboru doplnit do jména hash revize

### icons.optimizations

- **Type:** `boolean`
- **Default:** `true`

  Zda se má zkompilovaný soubor optimalizovat a minifikovat

## Scripty

### scripts.optimizations

- **Type:** `boolean`
- **Default:** `true`
  
  Zda se má zkompilovaný soubor optimalizovat a minifikovat

### scripts.revision

- **Type:** `boolean`
- **Default:** `true`

  Zda se má u zkompilovaného souboru doplnit do jména hash revize

### scripts.legacy

- **Type:** `boolean`
- **Default:** `true`

  Zda se májí kompilovat javacripty i v es5 legacy formátu

### scripts.polyfillUrls

- **Type:** `string[]`
- **Default:** `[]`

  Doplnění URL na polyfilly které se mají načíst s legacy javascriptama

### scripts.polyfillFeatures

- **Type:** `string`
- **Default:** `"default"`

  Nastavení polyfill funkcionality které se používají s legacy javascriptem. Zde se použavají nastavení z polyfill.io oddělené čárkou

### scripts.importResolution.directories

- **Type:** `string[]`
- **Default:** `[]`

  V jakých složkách se má mají vytvářet automatické importy k souborům

### scripts.importResolution.filename

- **Type:** `string`
- **Default:** `"+.js"`

  Název souboru který se vyvtoří pro automatické importy, v tomto souboru jsou naimportovány všechny soubory ze složky

### scripts.importMap.build

- **Type:** `boolean`
- **Default:** `true`

  Zde se při kompilování mají do souborů doplnit cdn odkazy z importmapy, pokud je vypnuto použijí se node_modules

### scripts.importMap.cdn

- **Type:** `string`
- **Default:** `"esm.sh"`

  Které CDN se má použít pro generování importmapy, lze nastavit `esm.sh` a `esm.run`

### scripts.importMap.trailingSlashes

- **Type:** `regex`

  Které knihovny obsahují podmoduly ke kterém je potřeba přistupovat v cestě modulu. Např. `/(dayjs|@fullcalendar|vanillajs-datepicker)/`

### scripts.importMap.shortUrl

- **Type:** `boolean`
- **Default:** `false`

  Zda v importmapách použít zkrácenou URL, např ve formátu esm.sh nebo esm.run

### scripts.importMap.localDownload

- **Type:** `boolean`
- **Default:** `false`

  Zda se mají soubory z cdn lokálně stáhnout do temp složky

## Styly

### styles.format

- **Type:** `string`
- **Default:** `"css"`

  Výchozí formát souborů stylů, lze nastavit `"css"` a `"less"`. Soubory lze kombinovat, ale pro úplné použití je doporučeno nastavit výchozí formát.

### styles.purge.enabled

- **Type:** `boolean`
- **Default:** `true`

  Zda se má na styly aplikovat knihovna PurgeCSS, která odebere nepoužité styly z finálního buildu.

### styles.purge.content

- **Type:** `string[]`

  Které soubory se mají kontrolovat vůči PurgeCSS, např. `['src/scripts/**/*.js', 'src/templates/**/*.twig']`

### styles.purge.options

- **Type:** `object`

  Další nastavení [PurgeCSS](https://purgecss.com/configuration.html#options), zde lze nastavit které styly se mají vynechávat apod.

  ```js
      safelist: {
          standard: [/(class|is-|to-|grecaptcha)/],
          deep: [/(ui-wsw|wsw|datepicker)/]
      }
  ```

### styles.purge.nodeResolve

- **Type:** `boolean`
- **Default:** `true`

  Zahrnout node_modules knihovny v `styles.purge.content`

### styles.purge.tailwind

- **Type:** `object`
- **Default:** `{ keyframes: true }`

  Další nastavení [PurgeCSS](https://tailwindcss.com/docs/optimizing-for-production#removing-unused-keyframes) pro Tailwind

### styles.vendor.cache

- **Type:** `boolean`
- **Default:** `true`

  Zda se mají načítat vendor CDN odkazy v CSS z cache

### styles.vendor.path

- **Type:** `string`
- **Default:** `""`

  Cesta kde se uchovávají vendor importy pro CSS knihovny

### styles.importResolution.subDir

- **Type:** `boolean`
- **Default:** `true`

  Zda se mají importovat i podsložky

### styles.importResolution.directories

- **Type:** `string[]`
- **Default:** `[]`

  V jakých složkách se má mají vytvářet automatické importy k souborům

### styles.importResolution.filename

- **Type:** `string`
- **Default:** `"+.css"`

  Název souboru který se vyvtoří pro automatické importy, v tomto souboru jsou naimportovány všechny soubory ze složky

### styles.import

- **Type:** `string[]`
- **Default:** `["all"]`

  Jakým způsobem [CleanCSS](https://github.com/jakubpawlowicz/clean-css) zpracovává importy souborů, ve výchozím nastavení se všechny importy zpracovávají přímo a ve výsledým buildu nejsou tak žádné importy

## Šablony

### templates.format

- **Type:** `string`
- **Default:** `"twig"`

  Výchozí formát souborů šablon, lze nastavit `"twig"` a `"hbs"`. Soubory lze kombinovat, ale pro úplné použití je doporučeno nastavit výchozí formát.

### templates.layout

- **Type:** `string`
- **Default:** `"Layout/Main"`

  Výchozí cesta k šabloně která se má použít jako layout

### templates.placeholder.webp

- **Type:** `boolean`
- **Default:** `true`

  Zda se má pro placeholder helper v šablonách použít formát .webp

### templates.placeholder.picsum

- **Type:** `boolean`
- **Default:** `false`

  Zda se má pro placeholder helper v šablonách použít generování obrázků ze služby [Picsum](https://picsum.photos/)

### templates.placeholder.lorempixel

- **Type:** `string`
- **Default:** `""`

  Zda se má pro placeholder helper v šablonách použít generování obrázků ze služby [lorempixel](https://picsum.photos/), jako parametr se nastavuje preferovaný obrázek třeba `"cats"`

## Emaily

### emails.removeClasses

- **Type:** `boolean`
- **Default:** `false`

  Zda se při kompilování emailů mají odstraňovat třídy z elementů v html

### emails.inlineOnly

- **Type:** `boolean`
- **Default:** `false`

  Zda se při kompilování emailů mají styly aplikovat jenom inline způsobem `style=""`

### emails.zipPrefix

- **Type:** `string[]`
- **Default:** `["email"]`

  Z kterých emailů vytvořit zip, uvádí se prefix jakým mají názvy zkompilovaných šablon začínat

## Assety

### assets.revision

- **Type:** `boolean`
- **Default:** `true`

  Zda se má u zkompilovaného souboru doplnit do jména hash revize

## Tailwind

- **Type:** `boolean`
  
  Zde se nastavuje [TailwindCSS](https://tailwindcss.com/docs/configuration), stejným způsobem jako v souboru `tailwind.config.js`