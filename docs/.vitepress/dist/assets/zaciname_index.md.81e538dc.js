import{o,c as s,a as e}from"./app.ba65f449.js";const a='{"title":"Začínáme","description":"","frontmatter":{},"headers":[{"level":2,"title":"Základní princip","slug":"zakladni-princip"},{"level":3,"title":"Modulárnost","slug":"modularnost"},{"level":3,"title":"Bez kompilace","slug":"bez-kompilace"},{"level":3,"title":"Single Page Apps","slug":"single-page-apps"},{"level":2,"title":"Instalace","slug":"instalace"},{"level":2,"title":"Tasky","slug":"tasky"},{"level":3,"title":"default","slug":"default"},{"level":3,"title":"production","slug":"production"},{"level":3,"title":"importmap","slug":"importmap"},{"level":3,"title":"serve","slug":"serve"},{"level":3,"title":"scripts","slug":"scripts"},{"level":3,"title":"styles","slug":"styles"},{"level":3,"title":"templates","slug":"templates"},{"level":3,"title":"icons","slug":"icons"},{"level":3,"title":"emails","slug":"emails"},{"level":3,"title":"assets","slug":"assets"},{"level":3,"title":"watch","slug":"watch"},{"level":3,"title":"cdn","slug":"cdn"},{"level":3,"title":"cleanup","slug":"cleanup"},{"level":3,"title":"cms","slug":"cms"},{"level":3,"title":"další tasky","slug":"dalsi-tasky"}],"relativePath":"zaciname/index.md","lastUpdated":1620310406810}',n={},t=e('<h1 id="zaciname"><a class="header-anchor" href="#zaciname" aria-hidden="true">#</a> Začínáme</h1><h2 id="zakladni-princip"><a class="header-anchor" href="#zakladni-princip" aria-hidden="true">#</a> Základní princip</h2><p>Newlogic Core je sada nástrojů, které lze použít pro tvorbu moderních webových aplikací. Použití moderního Javascriptu, CSS, ES moduly, dynamické importy apod.</p><p>Obsahuje integrované PostCSS se základnímy pluginy a <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer">TailwindCSS</a> pro utility třídy.</p><p>Zdrojové soubory se nachází ve složce <code>src</code> a svých určených složkách. Žádné složité nastavování, do <code>src/scripts</code> se vloží libovolný počet javascript souborů a ty se zkompilují do <code>dist/assets/js</code>.</p><p>Hlavní zaměření je především pro PHP frameworky a je jedno jestli používáte Nette, Symfony nebo Laravel - strukturu lze libovolně upravit dle potřeby. Např. <code>resources</code> a <code>public</code>, <code>src</code> a <code>dist</code> nebo <code>app/assets</code> a <code>www</code>. Všechny <a href="http://localhost:3000/dokumentace/#cesty" target="_blank" rel="noopener noreferrer">cesty</a> jsou libovolně konfigurovatelné v <code>gulpfile.js</code>.</p><h3 id="modularnost"><a class="header-anchor" href="#modularnost" aria-hidden="true">#</a> Modulárnost</h3><p>Zdrojové soubory se dělí podle modulů - styly, scripty, šablony, iconfont, emaily, assety. Je volitelné které moduly chcete pro projekt použít. Používáte opravdu jen to co chcete používat.</p><p>Chcete z celého setu použít např. jen generování emailů? Není problém, v <code>src/</code> se bude nacházet jen složka <code>emails</code> a všechny ostatní tasky se deaktivují.</p><p>Lze tak použít např. jen styly a scripty a šablony řešit přímo v PHP.</p><h3 id="bez-kompilace"><a class="header-anchor" href="#bez-kompilace" aria-hidden="true">#</a> Bez kompilace</h3><p>Jelikož se Javacript a CSS píše v moderním formátu, tak není potřeba nic kompilovat a při vývoji můžeme načítat soubory přímo ze zdrojových souborů.</p><p>Základem tasků pro jednotlivé moduly je <a href="https://gulpjs.com/" target="_blank" rel="noopener noreferrer">Gulp</a>, při použití PhpStormu se pak automaticky zobrazí tasky které lze použít a to dynamicky podle dostupnosti jednotlivých modulů.</p><h3 id="single-page-apps"><a class="header-anchor" href="#single-page-apps" aria-hidden="true">#</a> Single Page Apps</h3><p>V případě SPA aplikací je možné integrovat Vue (nebo jakýhokoliv jiný SPA framework) pomocí Vite. Z Newlogic Core pak lze využít jen dodatečné fukcionality jako auto generování importů do souborů v rámci složek, iconfont apod. Nebo si zautomatizovat některé procesy napsaním nových tasků v <code>gulpfile.js</code>.</p><h2 id="instalace"><a class="header-anchor" href="#instalace" aria-hidden="true">#</a> Instalace</h2><p>Minimální verze Node.js <strong>14+</strong></p><p>Přes NPM 7+:</p><div class="language-bash"><pre><code>$ <span class="token function">npm</span> i @newlogic-digital/core --save-dev\n</code></pre></div><p>Přes Yarn 2+:</p><div class="language-bash"><pre><code>$ <span class="token function">yarn</span> <span class="token function">add</span> @newlogic-digital/core --dev\n</code></pre></div><div class="warning custom-block"><p class="custom-block-title">UPOZORNĚNÍ</p><p>Yarn není doporučeno používat, Yarn 1 neumí instalovat <code>peerDependencies</code> - ty je nutno ručně dodat do <code>package.json</code> nebo použít Yarn 2.</p></div><p>Po instalaci je v projektu nutné vytvořit <code>gulpfile.js</code>, ve kterém lze dále upravovat jednotlivé nastavení. Všechna nastavení jsou do podrobna popsané v dokumentaci.</p><div class="language-js"><pre><code><span class="token keyword">import</span> <span class="token punctuation">{</span>Core<span class="token punctuation">}</span> <span class="token keyword">from</span>  <span class="token string">&quot;newlogic-core&quot;</span><span class="token punctuation">;</span>\n\n<span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token function">defineConfig</span><span class="token punctuation">(</span><span class="token punctuation">{</span>\n    styles<span class="token operator">:</span> <span class="token punctuation">{</span>\n        purge<span class="token operator">:</span> <span class="token punctuation">{</span>\n            content<span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&#39;src/scripts/**/*.js&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;src/templates/**/*.twig&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;app/Presenters/templates/**/*.latte&#39;</span><span class="token punctuation">,</span> <span class="token string">&#39;temp/cdn/*.js&#39;</span><span class="token punctuation">]</span>\n        <span class="token punctuation">}</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span><span class="token punctuation">)</span>\n</code></pre></div><p>Pro kompletní příklad použití Newlogic Core se všemi možnostmi lze využít <a href="https://github.com/newlogic-digital/core-starter" target="_blank" rel="noopener noreferrer">Starter šablonu</a></p><h2 id="tasky"><a class="header-anchor" href="#tasky" aria-hidden="true">#</a> Tasky</h2><p>Každý modul má svůj set tasků, většinou se dělí na <code>dev</code>, <code>build</code> a <code>production</code>. Což je rozdělení kdy se kompiluje úplné minimum, základ nebo úplně všechno.</p><p>Pro výpis všech dostupných tasků lze použít <code>gulp --tasks</code></p><h3 id="default"><a class="header-anchor" href="#default" aria-hidden="true">#</a> default</h3><p>Spouští tasky <code>cleanup</code>, <code>cdn</code> a následně tasky podle dostunposti modulů - <code>assets</code>, <code>icons:production</code>, <code>styles:production</code>, <code>scripts:production</code>, <code>templates:production</code></p><p>V tomto tasku je vždy nastaveno <code>config.errors = true</code>, takže pokud v jakémkoliv modulu nastane chyba, task se přeruší.</p><h3 id="production"><a class="header-anchor" href="#production" aria-hidden="true">#</a> production</h3><p>Spouští tasky <code>cleanup</code>, <code>cdn</code> a následně tasky podle dostunposti modulů - <code>assets</code>, <code>icons:production</code>, <code>styles:production</code>, <code>scripts:production</code></p><p>V tomto tasku je vždy nastaveno <code>config.errors = true</code>, takže pokud v jakémkoliv modulu nastane chyba, task se přeruší. Taskem default se liší pouze vynecháním kompilace šablon.</p><h3 id="importmap"><a class="header-anchor" href="#importmap" aria-hidden="true">#</a> importmap</h3><p>Vygeneruje <code>importmap.json</code> do cesty nastavené v configu <code>paths.output.importmap</code>. Importmapa se generuje na základě nastavených dependencies v package.json. Pokud je potřeba použít pro balíček např. jiné cdn, lze importmapu doplnit manuálně pomocí <code>&quot;imports&quot;</code>.</p><p>Díky <a href="https://github.com/WICG/import-maps" target="_blank" rel="noopener noreferrer">importmapám</a> padá závislost na npm modulech, při přidání nové knihovny při vývoji tak není potřeba nic instalovat. Můžete si pak celou napsanou aplikaci vzít a použít jí třeba v <a href="https://deno.land" target="_blank" rel="noopener noreferrer">Deno</a></p><p>vstup - package.json</p><div class="language-json"><pre><code><span class="token punctuation">{</span>\n  <span class="token property">&quot;imports&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n    <span class="token property">&quot;stimulus&quot;</span><span class="token operator">:</span> <span class="token string">&quot;https://cdn.jsdelivr.net/npm/@stimulus/core@2.0.0/+esm&quot;</span>\n  <span class="token punctuation">}</span><span class="token punctuation">,</span>\n  <span class="token property">&quot;dependencies&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n    <span class="token property">&quot;stimulus&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2.0.0&quot;</span><span class="token punctuation">,</span>\n    <span class="token property">&quot;swup&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2.0.14&quot;</span>\n  <span class="token punctuation">}</span> \n<span class="token punctuation">}</span>\n</code></pre></div><p>výstup - importmap.json</p><div class="language-json"><pre><code><span class="token punctuation">{</span>\n  <span class="token property">&quot;imports&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n    <span class="token property">&quot;stimulus&quot;</span><span class="token operator">:</span> <span class="token string">&quot;https://cdn.jsdelivr.net/npm/@stimulus/core@2.0.0/+esm&quot;</span><span class="token punctuation">,</span>\n    <span class="token property">&quot;swup&quot;</span><span class="token operator">:</span> <span class="token string">&quot;https://cdn.esm.sh/swup@2.0.14/esnext/swup.js&quot;</span>\n  <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><p>Nastavení lze dále rozšířit v configu <code>scripts.importMap</code>, občas má knihovna podmoduly ke kterým je potřeba přistupovat. V takovém případě je potřeba takovou knihovnu doplnit do configu. V importmapě se následně vygenerují odkazy tímto způsbem s lomítkem na konci.</p><div class="language-js"><pre><code>importMap<span class="token operator">:</span> <span class="token punctuation">{</span>\n    trailingSlashes<span class="token operator">:</span> <span class="token regex"><span class="token regex-delimiter">/</span><span class="token regex-source language-regex">(dayjs|@fullcalendar|vanillajs-datepicker)</span><span class="token regex-delimiter">/</span></span>\n<span class="token punctuation">}</span>\n</code></pre></div><p>Pro použití importmap v prohlížečích které je nepodporují je potřeba použít <a href="https://github.com/guybedford/es-module-shims" target="_blank" rel="noopener noreferrer">ES Module Shims</a></p><div class="language-js"><pre><code><span class="token operator">&lt;</span>script <span class="token keyword">async</span> src<span class="token operator">=</span><span class="token string">&quot;https://unpkg.com/es-module-shims@0.10.3/dist/es-module-shims.js&quot;</span><span class="token operator">&gt;</span><span class="token operator">&lt;</span><span class="token operator">/</span>script<span class="token operator">&gt;</span>\n</code></pre></div><h3 id="serve"><a class="header-anchor" href="#serve" aria-hidden="true">#</a> serve</h3><p>Spouští lokální vývojový server. Dělí se na <code>serve</code>, <code>serve:build</code> a <code>serve:production</code>. Server se sám přenačítá podle změněného obsahu. Ve výchozím stavu běží na <code>localhost:8000</code>.</p><ul><li><strong>serve</strong> - Spouští se tasky <code>cleanup</code>, <code>cdn</code> a následně tasky podle dostunposti modulů - <code>icons</code>, <code>styles</code>, <code>scripts</code>, <code>templates</code> a <code>watch</code>. V tomto režimu se kompilují jen šablony, javascripty i styly by se měli načítat bez kompilace přímo ze zdrojů. Generují se pouze automatické importy a importmapy.</li><li><strong>serve:build</strong> - Spouští se tasky <code>cleanup</code>, <code>cdn</code> a následně tasky podle dostunposti modulů - <code>icons:build</code>, <code>styles:build</code>, <code>scripts:build</code>, <code>templates</code> a <code>watch:build</code>. V tomto režimu se vše kompiluje, avšak stále v <code>dev</code> režimu, tz. bez minifikace, revizí a optimalizací.</li><li><strong>serve:production</strong> - Spouští se tasky <code>cleanup</code>, <code>cdn</code> a následně tasky podle dostunposti modulů - <code>icons:production</code>, <code>styles:production</code>, <code>scripts:production</code>, <code>templates:production</code> a <code>watch:production</code>. Produkční režim - kompilace, minifikace, optimalizace, revize souborů.</li></ul><h3 id="scripts"><a class="header-anchor" href="#scripts" aria-hidden="true">#</a> scripts</h3><p>Zpracovává soubory javascriptu. Dělí se na <code>scripts</code>, <code>scripts:build</code> a <code>scripts:production</code>. Javascript se píše pomcí <strong>ES6+</strong> syntaxe, esm modulů a dynamických importů.</p><ul><li><strong>scripts</strong> - Generuje importmapy a automatické importy souborů</li><li><strong>scripts:build</strong> - To samé jako scripts, ale navíc s kompilací souborů</li><li><strong>scripts:production</strong> - Při tomto režimu se kompiluje verze i pro legacy prohlížeče</li></ul><h3 id="styles"><a class="header-anchor" href="#styles" aria-hidden="true">#</a> styles</h3><p>Zpracovává soubory stylů. Dělí se na <code>styles</code>, <code>styles:build</code> a <code>styles:production</code>. Styly se píšou v <strong>PostCSS</strong>, takže je možné využít všechny možné moderní CSS vlastnosti. Zdrojový kód tak jednou bude možné načíst přímo v prohlížeči. Používají se následující pluginy:</p><div class="language-json"><pre><code><span class="token punctuation">{</span>\n    <span class="token property">&quot;devDependencies&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n        <span class="token property">&quot;autoprefixer&quot;</span><span class="token operator">:</span> <span class="token string">&quot;*&quot;</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;tailwindcss&quot;</span><span class="token operator">:</span> <span class="token string">&quot;*&quot;</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;postcss-custom-media&quot;</span><span class="token operator">:</span> <span class="token string">&quot;*&quot;</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;postcss-custom-selectors&quot;</span><span class="token operator">:</span> <span class="token string">&quot;*&quot;</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;postcss-import&quot;</span><span class="token operator">:</span> <span class="token string">&quot;*&quot;</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;postcss-nesting&quot;</span><span class="token operator">:</span> <span class="token string">&quot;*&quot;</span><span class="token punctuation">,</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><p>Alternativně lze použít i <strong>.less</strong>, v takovém případě je nutné doinstalovat <code>gulp-less</code> a <code>gulp-autoprefixer</code> do projektu. V případě pokud se používá výhradně less je doporučeno v configu nastavit <code>styles.format</code> na <code>&quot;less&quot;</code>.</p><ul><li><strong>styles</strong> - Generuje automatické importy souborů a tailwind jednorázově do složky temp</li><li><strong>styles:build</strong> - To samé jako styles, ale navíc s kompilací souborů</li><li><strong>styles:production</strong> - Při tomto režimu se kompiluje verze i pro legacy prohlížeče (not yet)</li></ul><h3 id="templates"><a class="header-anchor" href="#templates" aria-hidden="true">#</a> templates</h3><p>Zpracovává soubory šablon. Dělí se na <code>templates</code> a <code>templates:production</code>. Pro šablony lze využít <code>twig</code> nebo <code>html</code>, twig má integrované helpery na práci s generovanými assety. Psaní šablon ve twigu je pak vhodné taky pro následnou implementaci do <a href="https://symfony.com/doc/current/templates.html" target="_blank" rel="noopener noreferrer">Symfony</a> nebo <a href="https://twig2latte.nette.org/" target="_blank" rel="noopener noreferrer">Nette</a>.</p><p>Alternativně lze použít i <strong>.hbs</strong>, v takovém případě je nutné doinstalovat <code>gulp-hb</code> do projektu. V případě pokud se používá výhradně hbs je doporučeno v configu nastavit <code>templates.format</code> na <code>&quot;hbs&quot;</code>. Pozor při změně šablnovacího systému je důležité nastavit správně obsah pro PurgeCSS v <code>styles.purge.content</code>.</p><p>Výhoda psaní šablon bokem mimo PHP aplikaci je mít čisté zdrojové data na další případné využití šablon. Šablony lze samozřejmě psát rovnou v PHP framworku a integrovaný šablonovací systém není nutné vůbec používat.</p><ul><li><strong>templates</strong> - Kompiluje šablony do html, bez minifikace</li><li><strong>templates:production</strong> - Kompiluje šablony do html, s minifikací</li></ul><h4 id="twig"><a class="header-anchor" href="#twig" aria-hidden="true">#</a> Twig</h4><p>Jednotlivé stránky šablon se vytváří v <code>src/templates/</code> pomocí <code>.json</code> souborů. V těch pak můžeme proměnou propsat jakou šablonu použít v rámci layoutu. Lze využít i samostatné soubory, bez jsonu.</p><p>index.json</p><div class="language-json"><pre><code><span class="token punctuation">{</span>\n  <span class="token property">&quot;page&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n    <span class="token property">&quot;title&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Hello world&quot;</span><span class="token punctuation">,</span>\n    <span class="token property">&quot;sections&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>\n      <span class="token punctuation">{</span>\n        <span class="token property">&quot;src&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Sections/Hero&quot;</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;heading&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Sunny day&quot;</span>\n      <span class="token punctuation">}</span>\n    <span class="token punctuation">]</span>\n  <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre></div><p>layout.twig</p><div class="language-twig"><pre><code><span class="token tag"><span class="token ld"><span class="token punctuation">{%</span> <span class="token keyword">for</span></span> <span class="token property">section</span> <span class="token operator">in</span> <span class="token property">page</span><span class="token punctuation">.</span><span class="token property">sections</span> <span class="token rd"><span class="token punctuation">%}</span></span></span>\n    <span class="token tag"><span class="token ld"><span class="token punctuation">{%</span> <span class="token keyword">include</span></span> <span class="token string"><span class="token punctuation">&#39;</span>../<span class="token punctuation">&#39;</span></span> <span class="token operator">~</span> <span class="token property">section</span><span class="token punctuation">.</span><span class="token property">src</span> <span class="token operator">~</span> <span class="token string"><span class="token punctuation">&#39;</span>.twig<span class="token punctuation">&#39;</span></span> <span class="token rd"><span class="token punctuation">%}</span></span></span>\n<span class="token tag"><span class="token ld"><span class="token punctuation">{%</span> <span class="token keyword">endfor</span></span> <span class="token rd"><span class="token punctuation">%}</span></span></span>\n</code></pre></div><p>Pokud jméno souboru začíná na dialog nebo json (v souboru je potřeba použít tag json), lze zkompilovat obsah do <code>.json</code> souboru.</p><p>Ve twigu i hbs jsou dostupné následující proměnné, filtry a funkce. Pokud chcete využít vlastní PHP šablnovací systém tak je doporučeno využít stejné vlastnosti.</p><h5 id="promenne"><a class="header-anchor" href="#promenne" aria-hidden="true">#</a> proměnné</h5><ul><li><strong>config</strong> - data z <code>gulpfile.js</code>, včetně výchozích hodnot</li><li><strong>distPath</strong> - cesta k výstupním souborům (např. <code>src</code>)</li><li><strong>srcPath</strong> - cesta k zdrojovým souborům (např. <code>dist</code>)</li><li><strong>resolvePath</strong> - dynamická cesta ke zdrojovým souborům nebo vstupním souborům, mění se podle produkčního módu - zejména důležité pokud načítáme zdrojové soubory bez kompilace (např. obrázky), v takovém případě je chceme načítat přímo ze zdrojové složky protože počas vývoje nejsou kompilovány</li><li><strong>layout.template</strong> - výchozí cesta k šabloně layoutu, výchozí cesta se nastavuje v configu <code>gulpfile.js</code> a to <code>templates.layout</code></li></ul><p>Další globální proměnné se potom propisují ze <code>src/main.json</code> a proměnné pro jednotlivé stránky se definují v <code>src/templates/</code>.</p><p>Proměnné se slučují dohromady od přednastavených, globálních až po stránky.</p><h5 id="funkce"><a class="header-anchor" href="#funkce" aria-hidden="true">#</a> funkce</h5><ul><li><strong>color</strong>(color, theme) - vytáhne definovanou barvu ze stylů v hex, je nutné aby byla nastavená cesta <code>styles.themePath</code> (depricated)</li><li><strong>fetch</strong>(path) - inlinuje kód z url adresy a to buď lokální nebo externí https, externí se načítá z <code>temp/cdn</code> pokud existuje</li><li><strong>randomColor</strong> - vygeneruje náhodou barvu v hex</li><li><strong>placeholder</strong>(width, height, picsum, colors) - vygeneruje url placeholder obrázku, při použití picsum lze zadat konkrétní id fotky a u klasického placeholderu lze nastavit barvu v hex</li><li><strong>lazy</strong>(width, height) - vygeneruje zástupný prázdný obrázek v base64, pro použití při lazyloadování obrázků</li><li><strong>ratio</strong>(width, height) - vypočítá ratio fotky, např. při zadání 1920, 1080 vrátí 56.25</li><li><strong>webfont</strong>(data) - zpracovává <a href="https://github.com/typekit/webfontloader" target="_blank" rel="noopener noreferrer">WebFontConfig</a> data z json a na základě toho generuje URL (depricated)<div class="language-json"><pre><code>    <span class="token property">&quot;fonts&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n      <span class="token property">&quot;google&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n        <span class="token property">&quot;families&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&quot;Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700&amp;display=block&quot;</span><span class="token punctuation">]</span>\n      <span class="token punctuation">}</span><span class="token punctuation">,</span>\n      <span class="token property">&quot;custom&quot;</span><span class="token operator">:</span> <span class="token punctuation">{</span>\n        <span class="token property">&quot;families&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&quot;iconfont&quot;</span><span class="token punctuation">]</span><span class="token punctuation">,</span>\n        <span class="token property">&quot;urls&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token string">&quot;/dist/assets/css/iconfont.css&quot;</span><span class="token punctuation">]</span>\n      <span class="token punctuation">}</span>\n    <span class="token punctuation">}</span>\n</code></pre></div></li></ul><h5 id="filtry"><a class="header-anchor" href="#filtry" aria-hidden="true">#</a> filtry</h5><ul><li><strong>asset</strong>(path) - vygeneruje v cestě souboru hash na základě přítomnosti souboru v <code>rev-manifest.json</code>, cesta může být relativní k <code>paths.dist</code> nebo k rootu projektu</li><li><strong>rem</strong>(value) - vypočítá px v rem</li><li><strong>encode64</strong>(path) - enkóduje svg do base64</li><li><strong>exists</strong>(path) - kontroluje jestli soubor existuje</li></ul><h5 id="tags"><a class="header-anchor" href="#tags" aria-hidden="true">#</a> tags</h5><ul><li><strong>code</strong> &quot;type&quot; - při obalení kódu v code se html obsah zobrazí v <code>&lt;code&gt;</code></li><li><strong>json</strong> &quot;key&quot; - při obalení kódu v json se html obsahu zformátuje do jsonu</li></ul><h3 id="icons"><a class="header-anchor" href="#icons" aria-hidden="true">#</a> icons</h3><p>Zpracovává soubory iconfontu. Dělí se na <code>icons</code>, <code>icons:build</code> a <code>icons:production</code>. Styly jsou ve formátu <strong>PostCSS</strong> a <a href="https://preset-env.cssdb.org/" target="_blank" rel="noopener noreferrer">postcss-preset-env</a>, včetně CSS proměnných.</p><p>Alternativně lze použít i <strong>.less</strong>, v takovém případě je nutné doinstalovat <code>gulp-less</code> a <code>gulp-autoprefixer</code> do projektu a v configu nastavit <code>icons.format</code> na <code>&quot;less&quot;&quot;</code> aby se stáhnul správný formát.</p><ul><li><strong>icons</strong> - Stahuje iconfont z <a href="http://icomoon.io" target="_blank" rel="noopener noreferrer">icomoon.io</a> dle názvu projektu, je nutné mít nastavené icomoon id - <code>icons.id</code></li><li><strong>icons:build</strong> - To samé jako icons, ale navíc s kompilací souborů</li><li><strong>icons:production</strong> - Při tomto režimu se pouze kompilujou existující soubory</li></ul><h3 id="emails"><a class="header-anchor" href="#emails" aria-hidden="true">#</a> emails</h3><p>Generuje emailové šablony. Dělí se na <code>emails:build</code> a <code>emails:zip</code>. Šablony lze psát v šablonách <code>twig</code>, <code>hbs</code>, <code>latte</code> nebo <code>tpl</code>. A pro styly lze použít <code>PostCSS</code> nebo <code>less</code>.</p><p>Ve výchozím stavu se zpracovává jenom twig zápis, všechen ostatní zápis zůstane tak jak je. To je vhodné pokud chceme předgenerovat styly pro emaily u latte nebo tpl šablon pro PHP. Zde lze pak nastavit kam se takové soubory mají generovat <code>paths.cms.emails</code>.</p><p>Alternativně lze použít hbs nastavením <code>email.format</code> na <code>&quot;hbs&quot;</code>, potom se v latte a tpl souborech generuje hbs zápis. Těmito zápisy je vhodné načítat styly nebo includovat soubory.</p><p>Styly do emailu se generují do temp složky a do emailu je aplikujeme v hlavčice tímto způsobem. Při generování se pak styly aplikují inlinově na všechny elementy.</p><div class="language-twig"><pre><code><span class="token other"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span> <span class="token attr-name">type</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>text/css<span class="token punctuation">&quot;</span></span><span class="token punctuation">&gt;</span></span></span>\n    <span class="token tag"><span class="token ld"><span class="token punctuation">{{</span></span> <span class="token property">fetch</span> <span class="token punctuation">(</span><span class="token string"><span class="token punctuation">&quot;</span>temp/emails/email.css<span class="token punctuation">&quot;</span></span><span class="token punctuation">)</span> <span class="token rd"><span class="token punctuation">}}</span></span></span>\n<span class="token other"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">&gt;</span></span></span>\n</code></pre></div><p>Emailové šablony lze generovat do zipu pomocí tasku <code>emails:zip</code>, ve výchozím stavu se generují všechny šablony které začínají názvem email. Toto lze upravit v <code>emails.zipPrefix</code></p><h3 id="assets"><a class="header-anchor" href="#assets" aria-hidden="true">#</a> assets</h3><p>Používá se na soubory použité na webu, jako obrázky, fonty apod. Ty se dávají do <code>paths.input.assets</code> a při zapnutí tohoto tasku se zkopírují do <code>paths.output.assets</code> s unikátním hashem v názvu. Důležité pro správné cachování souborů.</p><p>V cestě se vygeneruje <code>rev-manifest.json</code> na základě kterého pak lze tyto soubory načítat do šablon, nebo automaticky aplikovat správný hash v stylech nebo scriptech.</p><h3 id="watch"><a class="header-anchor" href="#watch" aria-hidden="true">#</a> watch</h3><p>Sleduje změny v souborech a na základě toho spouští příslušné tasky pro zpracovávání souborů. Dělí se na <code>watch</code>, <code>watch:build</code> a <code>watch:production</code>.</p><p>Podle typu pak zapíná <code>dev</code>, <code>build</code> nebo <code>production</code> tasky. Sleduje taky změny v email šablonách.</p><h3 id="cdn"><a class="header-anchor" href="#cdn" aria-hidden="true">#</a> cdn</h3><p>Stahuje cdn odkazy ze všech modulů do <code>temp/cdn</code> pro případné použití offline.</p><h3 id="cleanup"><a class="header-anchor" href="#cleanup" aria-hidden="true">#</a> cleanup</h3><p>Vyčistí složku <code>temp</code> od dočasných souborů</p><h3 id="cms"><a class="header-anchor" href="#cms" aria-hidden="true">#</a> cms</h3><p>Tasky které se vztahují k Newlogic CMS. Dělí se na <code>cms:install</code> a <code>cms:prepare</code>.</p><ul><li><strong>cms:install</strong> stáhne cms do projektu, ve výchozím stavu z větve <code>dev</code> - toto lze upravit v configu <code>cms.branch</code></li><li><strong>cms:prepare</strong> kopíruje šablony z <code>paths.input.templates</code> do <code>paths.cms.templates</code> a vytvoří PHP soubory sekcí šablon do <code>paths.cms.components</code></li></ul><h3 id="dalsi-tasky"><a class="header-anchor" href="#dalsi-tasky" aria-hidden="true">#</a> další tasky</h3><p>Další tasky lze definovat do <code>package.json</code> jako npm scripty (<code>scripts</code>) nebo definovat přímo v <code>gulpfile.js</code></p>',105);n.render=function(e,a,n,p,c,l){return o(),s("div",null,[t])};export default n;export{a as __pageData};
