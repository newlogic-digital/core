[![pipeline status](https://gitlab.com/toptalo/twig-renderer/badges/master/pipeline.svg)](https://gitlab.com/toptalo/twig-renderer/commits/master)

# twig-renderer

Renders Twig templates using Twig.js

Build upon [Twig.js](https://github.com/twigjs/twig.js), the JS port of the Twig templating language by John Roepke.

## Install

```shell
npm install @toptalo/twig-renderer --save
```

## Usage Example

```javascript
const TwigRenderer = require('@toptalo/twig-renderer');

const options = { 
    globals: '',
    extensions: [],
    functions: {}, 
    filters: {}, 
    context: {}, 
    namespaces: {} 
};

const twigRenderer = new TwigRenderer(options);

twigRenderer.render(templatePath).then(html => {
    console.log(html);
}).catch(error => {
    console.log(error.message);
});
```

## Options

#### options.globals
Type: `String`
Default value: `''`

Path to JSON file with global context variables.

#### options.extensions
Type: `Array`
Default value: `[]`

Can be an array of functions that extend TwigJS with [custom tags](https://github.com/twigjs/twig.js/wiki/Extending-twig.js-With-Custom-Tags).

#### options.functions
Type: `Object`
Default value: `{}`

Object hash defining [functions in TwigJS](https://github.com/twigjs/twig.js/wiki/Extending-twig.js#functions).

#### options.filters
Type: `Object`
Default value: `{}`

Object hash defining [filters in TwigJS](https://github.com/twigjs/twig.js/wiki/Extending-twig.js#filters).

#### options.context
Type: `Object`
Default value: `{}`

Object hash defining templates context variables.

#### options.namespaces
Type: `Object`
Default value: `{}`

Object hash defining namespaces.

## Context hierarchy
Template context extends in this order:
* `options.context` provided
* `options.globals` provided
* template JSON context files (stored in template path, with same name,
example: `/templates/index.json` for `/templates/index.twig`) if provided

## Contributing
In lieu of a formal style guide, take care to maintain the existing coding style.
Add functional tests for any new or changed functionality.
Lint your code using [ESLint](https://eslint.org/).
Test your code using [Jest](https://jestjs.io/).

## Sponsored by
[![DesignDepot](https://designdepot.ru/static/core/img/logo.png)](https://designdepot.ru/?utm_source=web&utm_medium=npm&utm_campaign=twig-renderer)

## Release History
See the [CHANGELOG](CHANGELOG.md).
