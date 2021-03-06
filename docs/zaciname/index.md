# Začínáme

## Základní princip

Newlogic Core je sada nástrojů, které lze použít pro tvorbu moderních webových aplikací. Použití moderního Javascriptu, CSS, ES moduly, dynamické importy apod.

Obsahuje integrované PostCSS se základnímy pluginy a [TailwindCSS](https://tailwindcss.com/) pro utility třídy.

Zdrojové soubory se nachází ve složce `src` a svých určených složkách. Žádné složité nastavování, do `src/scripts` se vloží libovolný počet javascript souborů a ty se zkompilují do `dist/assets/js`. 

Hlavní zaměření je především pro PHP frameworky a je jedno jestli používáte Nette, Symfony nebo Laravel - strukturu lze libovolně upravit dle potřeby. Např. `resources` a `public`, `src` a `dist` nebo `app/assets` a `www`. Všechny [cesty](http://localhost:3000/dokumentace/#cesty) jsou libovolně konfigurovatelné v `gulpfile.js`.

### Modulárnost

Zdrojové soubory se dělí podle modulů - styly, scripty, šablony, iconfont, emaily, assety. Je volitelné které moduly chcete pro projekt použít. Používáte opravdu jen to co chcete používat.

Chcete z celého setu použít např. jen generování emailů? Není problém, v `src/` se bude nacházet jen složka `emails` a všechny ostatní tasky se deaktivují.

Lze tak použít např. jen styly a scripty a šablony řešit přímo v PHP.

### Bez kompilace

Jelikož se Javacript a CSS píše v moderním formátu, tak není potřeba nic kompilovat a při vývoji můžeme načítat soubory přímo ze zdrojových souborů.

Základem tasků pro jednotlivé moduly je [Gulp](https://gulpjs.com/), při použití PhpStormu se pak automaticky zobrazí tasky které lze použít a to dynamicky podle dostupnosti jednotlivých modulů.


### Single Page Apps
V případě SPA aplikací je možné integrovat Vue (nebo jakýhokoliv jiný SPA framework) pomocí Vite. Z Newlogic Core pak lze využít jen dodatečné fukcionality jako auto generování importů do souborů v rámci složek, iconfont apod. Nebo si zautomatizovat některé procesy napsaním nových tasků v `gulpfile.js`.

## Instalace

  Minimální verze Node.js **14+**

Přes NPM 7+:

```bash
$ npm i @newlogic-digital/core --save-dev
```

Přes Yarn 2+:

```bash
$ yarn add @newlogic-digital/core --dev
```

::: warning UPOZORNĚNÍ
Yarn není doporučeno používat, Yarn 1 neumí instalovat `peerDependencies` - ty je nutno ručně dodat do `package.json` nebo použít Yarn 2.
:::

Po instalaci je v projektu nutné vytvořit `gulpfile.js`, ve kterém lze dále upravovat jednotlivé nastavení. Všechna nastavení jsou do podrobna popsané v dokumentaci.

```js
import {Core} from  "newlogic-core";

export default defineConfig({
    styles: {
        purge: {
            content: ['src/scripts/**/*.js', 'src/templates/**/*.twig', 'app/Presenters/templates/**/*.latte', 'temp/cdn/*.js']
        }
    }
})
```
Pro kompletní příklad použití Newlogic Core se všemi možnostmi lze využít [Starter šablonu](https://github.com/newlogic-digital/core-starter)

## Tasky

Každý modul má svůj set tasků, většinou se dělí na `dev`, `build` a `production`. Což je rozdělení kdy se kompiluje úplné minimum, základ nebo úplně všechno.

Pro výpis všech dostupných tasků lze použít `gulp --tasks`

### default

Spouští tasky `cleanup`, `cdn` a následně tasky podle dostunposti modulů - `assets`, `icons:production`, `styles:production`, `scripts:production`, `templates:production`

V tomto tasku je vždy nastaveno `config.errors = true`, takže pokud v jakémkoliv modulu nastane chyba, task se přeruší.

### production

Spouští tasky `cleanup`, `cdn` a následně tasky podle dostunposti modulů - `assets`, `icons:production`, `styles:production`, `scripts:production`

V tomto tasku je vždy nastaveno `config.errors = true`, takže pokud v jakémkoliv modulu nastane chyba, task se přeruší. Taskem default se liší pouze vynecháním kompilace šablon.

### importmap

Vygeneruje `importmap.json` do cesty nastavené v configu `paths.output.importmap`. Importmapa se generuje na základě nastavených dependencies v package.json. Pokud je potřeba použít pro balíček např. jiné cdn, lze importmapu doplnit manuálně pomocí `"imports"`.

Díky [importmapám](https://github.com/WICG/import-maps) padá závislost na npm modulech, při přidání nové knihovny při vývoji tak není potřeba nic instalovat. Můžete si pak celou napsanou aplikaci vzít a použít jí třeba v [Deno](https://deno.land) 

vstup - package.json
```json
{
  "imports": {
    "stimulus": "https://cdn.jsdelivr.net/npm/@stimulus/core@2.0.0/+esm"
  },
  "dependencies": {
    "stimulus": "2.0.0",
    "swup": "2.0.14"
  } 
}
```

výstup - importmap.json
```json
{
  "imports": {
    "stimulus": "https://cdn.jsdelivr.net/npm/@stimulus/core@2.0.0/+esm",
    "swup": "https://cdn.esm.sh/swup@2.0.14/esnext/swup.js"
  }
}
```

Nastavení lze dále rozšířit v configu `scripts.importMap`, občas má knihovna podmoduly ke kterým je potřeba přistupovat. V takovém případě je potřeba takovou knihovnu doplnit do configu. V importmapě se následně vygenerují odkazy tímto způsbem s lomítkem na konci. 

```js
importMap: {
    trailingSlashes: /(dayjs|@fullcalendar|vanillajs-datepicker)/
}
```

Pro použití importmap v prohlížečích které je nepodporují je potřeba použít [ES Module Shims](https://github.com/guybedford/es-module-shims)

```js
<script async src="https://unpkg.com/es-module-shims@0.10.3/dist/es-module-shims.js"></script>
```

### serve

Spouští lokální vývojový server. Dělí se na `serve`, `serve:build` a `serve:production`. Server se sám přenačítá podle změněného obsahu. Ve výchozím stavu běží na `localhost:8000`. 


* **serve** - Spouští se tasky `cleanup`, `cdn` a následně tasky podle dostunposti modulů - `icons`, `styles`, `scripts`, `templates` a `watch`. V tomto režimu se kompilují jen šablony, javascripty i styly by se měli načítat bez kompilace přímo ze zdrojů. Generují se pouze automatické importy a importmapy.
* **serve:build** - Spouští se tasky `cleanup`, `cdn` a následně tasky podle dostunposti modulů - `icons:build`, `styles:build`, `scripts:build`, `templates` a `watch:build`. V tomto režimu se vše kompiluje, avšak stále v `dev` režimu, tz. bez minifikace, revizí a optimalizací.
* **serve:production** - Spouští se tasky `cleanup`, `cdn` a následně tasky podle dostunposti modulů - `icons:production`, `styles:production`, `scripts:production`, `templates:production` a `watch:production`. Produkční režim - kompilace, minifikace, optimalizace, revize souborů.


### scripts

Zpracovává soubory javascriptu. Dělí se na `scripts`, `scripts:build` a `scripts:production`. Javascript se píše pomcí **ES6+** syntaxe, esm modulů a dynamických importů.

* **scripts** - Generuje importmapy a automatické importy souborů
* **scripts:build** - To samé jako scripts, ale navíc s kompilací souborů
* **scripts:production** - Při tomto režimu se kompiluje optimalizovaná verze s manifestem

### styles

Zpracovává soubory stylů. Dělí se na `styles`, `styles:build` a `styles:production`. Styly se píšou v **PostCSS**, takže je možné využít všechny možné moderní CSS vlastnosti. Zdrojový kód tak jednou bude možné načíst přímo v prohlížeči. Používají se následující pluginy: 

```json
{
    "devDependencies": {
        "autoprefixer": "*",
        "tailwindcss": "*",
        "postcss-custom-media": "*",
        "postcss-custom-selectors": "*",
        "postcss-import": "*",
        "postcss-nesting": "*",
    }
}
```

Alternativně lze použít i **.less**, v takovém případě je nutné doinstalovat `gulp-less` a `gulp-autoprefixer` do projektu. V případě pokud se používá výhradně less je doporučeno v configu nastavit `styles.format` na `"less"`.

* **styles** - Generuje automatické importy souborů a tailwind jednorázově do složky temp
* **styles:build** - To samé jako styles, ale navíc s kompilací souborů
* **styles:production** - Při tomto režimu se kompiluje optimalizovaná verze s manifestem

### templates

Zpracovává soubory šablon. Dělí se na `templates` a `templates:production`. Pro šablony lze využít `twig` nebo `html`, twig má integrované helpery na práci s generovanými assety. Psaní šablon ve twigu je pak vhodné taky pro následnou implementaci do [Symfony](https://symfony.com/doc/current/templates.html) nebo [Nette](https://twig2latte.nette.org/).

Alternativně lze použít i **.hbs**, v takovém případě je nutné doinstalovat `gulp-hb` do projektu. V případě pokud se používá výhradně hbs je doporučeno v configu nastavit `templates.format` na `"hbs"`. Pozor při změně šablnovacího systému je důležité nastavit správně obsah pro PurgeCSS v `styles.purge.content`.

Výhoda psaní šablon bokem mimo PHP aplikaci je mít čisté zdrojové data na další případné využití šablon. Šablony lze samozřejmě psát rovnou v PHP framworku a integrovaný šablonovací systém není nutné vůbec používat.

* **templates** - Kompiluje šablony do html, bez minifikace
* **templates:production** - Kompiluje šablony do html, s minifikací

#### Twig

Jednotlivé stránky šablon se vytváří v `src/templates/` pomocí `.json` souborů. V těch pak můžeme proměnou propsat jakou šablonu použít v rámci layoutu. Lze využít i samostatné soubory, bez jsonu. 

index.json
```json
{
  "page": {
    "title": "Hello world",
    "sections": [
      {
        "src": "Sections/Hero",
        "heading": "Sunny day"
      }
    ]
  }
}
```

layout.twig
```twig
{% for section in page.sections %}
    {% include '../' ~ section.src ~ '.twig' %}
{% endfor %}
```

Pokud jméno souboru začíná na dialog nebo json (v souboru je potřeba použít tag json), lze zkompilovat obsah do `.json` souboru.

Ve twigu i hbs jsou dostupné následující proměnné, filtry a funkce. Pokud chcete využít vlastní PHP šablnovací systém tak je doporučeno využít stejné vlastnosti.

##### proměnné
* **config** - data z `gulpfile.js`, včetně výchozích hodnot
* **distPath** - cesta k výstupním souborům (např. `src`)
* **srcPath** - cesta k zdrojovým souborům (např. `dist`)
* **resolvePath** - dynamická cesta ke zdrojovým souborům nebo vstupním souborům, mění se podle produkčního módu - zejména důležité pokud načítáme zdrojové soubory bez kompilace (např. obrázky), v takovém případě je chceme načítat přímo ze zdrojové složky protože počas vývoje nejsou kompilovány
* **layout.template** - výchozí cesta k šabloně layoutu, výchozí cesta se nastavuje v configu `gulpfile.js` a to `templates.layout`

Další globální proměnné se potom propisují ze `src/main.json` a proměnné pro jednotlivé stránky se definují v `src/templates/`. 

Proměnné se slučují dohromady od přednastavených, globálních až po stránky.

##### funkce
* **color**(color, theme) - vytáhne definovanou barvu ze stylů v hex, je nutné aby byla nastavená cesta `styles.themePath` (depricated)
* **fetch**(path) - inlinuje kód z url adresy a to buď lokální nebo externí https, externí se načítá z `temp/cdn` pokud existuje
* **randomColor** - vygeneruje náhodou barvu v hex
* **placeholder**(width, height, picsum, colors) - vygeneruje url placeholder obrázku, při použití picsum lze zadat konkrétní id fotky a u klasického placeholderu lze nastavit barvu v hex
* **lazy**(width, height) - vygeneruje zástupný prázdný obrázek v base64, pro použití při lazyloadování obrázků
* **ratio**(width, height) - vypočítá ratio fotky, např. při zadání 1920, 1080 vrátí 56.25
* **webfont**(data) - zpracovává [WebFontConfig](https://github.com/typekit/webfontloader) data z json a na základě toho generuje URL  (depricated)
    ```json
        "fonts": {
          "google": {
            "families": ["Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700&display=block"]
          },
          "custom": {
            "families": ["iconfont"],
            "urls": ["/dist/assets/css/iconfont.css"]
          }
        }
    ```

##### filtry
* **asset**(path) - vygeneruje v cestě souboru hash na základě přítomnosti souboru v `rev-manifest.json`, cesta může být relativní k `paths.dist` nebo k rootu projektu
* **rem**(value) - vypočítá px v rem
* **encode64**(path) - enkóduje svg do base64
* **exists**(path) - kontroluje jestli soubor existuje

##### tags
* **code** "type" - při obalení kódu v code se html obsah zobrazí v `<code>`
* **json** "key" - při obalení kódu v json se html obsahu zformátuje do jsonu

### icons

Zpracovává soubory iconfontu. Dělí se na `icons`, `icons:build` a `icons:production`. Styly jsou ve formátu **PostCSS** a [postcss-preset-env](https://preset-env.cssdb.org/), včetně CSS proměnných.

Alternativně lze použít i **.less**, v takovém případě je nutné doinstalovat `gulp-less` a `gulp-autoprefixer` do projektu a v configu nastavit `icons.format` na `"less""` aby se stáhnul správný formát.

* **icons** - Stahuje iconfont z icomoon.io dle názvu projektu, je nutné mít nastavené icomoon id - `icons.id`
* **icons:build** - To samé jako icons, ale navíc s kompilací souborů
* **icons:production** - Při tomto režimu se pouze kompilujou existující soubory

### emails

Generuje emailové šablony. Dělí se na `emails:build` a `emails:zip`. Šablony lze psát v šablonách `twig`, `hbs`, `latte` nebo `tpl`. A pro styly lze použít `PostCSS` nebo `less`. 

Ve výchozím stavu se zpracovává jenom twig zápis, všechen ostatní zápis zůstane tak jak je. To je vhodné pokud chceme předgenerovat styly pro emaily u latte nebo tpl šablon pro PHP. Zde lze pak nastavit kam se takové soubory mají generovat `paths.output.emailsWww`.

Alternativně lze použít hbs nastavením `email.format` na `"hbs"`, potom se v latte a tpl souborech generuje hbs zápis. Těmito zápisy je vhodné načítat styly nebo includovat soubory.

Styly do emailu se generují do temp složky a do emailu je aplikujeme v hlavčice tímto způsobem. Při generování se pak styly aplikují inlinově na všechny elementy.

```twig
<style type="text/css">
    {{ fetch ("temp/emails/email.css") }}
</style>
```

Emailové šablony lze generovat do zipu pomocí tasku `emails:zip`, ve výchozím stavu se generují všechny šablony které začínají názvem email. Toto lze upravit v `emails.zipPrefix`

### assets

Používá se na soubory použité na webu, jako obrázky, fonty apod. Ty se dávají do `paths.input.assets` a při zapnutí tohoto tasku se zkopírují do `paths.output.assets` s unikátním hashem v názvu. Důležité pro správné cachování souborů. 

V cestě se vygeneruje `rev-manifest.json` na základě kterého pak lze tyto soubory načítat do šablon, nebo automaticky aplikovat správný hash v stylech nebo scriptech.

### watch

Sleduje změny v souborech a na základě toho spouští příslušné tasky pro zpracovávání souborů. Dělí se na `watch`, `watch:build` a `watch:production`.

Podle typu pak zapíná `dev`, `build` nebo `production` tasky. Sleduje taky změny v email šablonách.

### cdn

Stahuje cdn odkazy ze všech modulů do `temp/cdn` pro případné použití offline.

### cleanup

Vyčistí složku `temp` od dočasných souborů

[comment]: <> (### cms)

[comment]: <> (Tasky které se vztahují k Newlogic CMS. Dělí se na `cms:install` a `cms:prepare`.)

[comment]: <> (* **cms:install** stáhne cms do projektu, ve výchozím stavu z větve `dev` - toto lze upravit v configu `cms.branch`)

[comment]: <> (* **cms:prepare** kopíruje šablony z `paths.input.templates` do `paths.cms.templates` a vytvoří PHP soubory sekcí šablon do `paths.cms.components`)

### další tasky

Další tasky lze definovat do  `package.json` jako npm scripty (`scripts`) nebo definovat přímo v `gulpfile.js`