# gulp-twig2html [![pipeline status](https://gitlab.com/toptalo/gulp-twig2html/badges/master/pipeline.svg)](https://gitlab.com/toptalo/gulp-twig2html/commits/master)

Gulp plugin that compile twig templates to html pages.

Build upon [Twig.js](https://github.com/twigjs/twig.js), the JS port of the Twig templating language by John Roepke.

## Install

```shell
npm install gulp-twig2html --save
```

## The "twig2html" task

### Usage

```js
const gulp = require('gulp');
const rename = require('gulp-rename');
const twig2html = require('gulp-twig2html');

gulp.task('twig2html', () => {
  return gulp.src('src/*.twig')
    .pipe(twig2html({
        // Task-specific options go here.
    }))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('dist'));
});
```

### Options

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

#### options.separator
Type: `String`
Default value: `'\n'`

A string that is inserted between each compiled template when concatenating templates.

#### options.namespaces
Type: `Object`
Default value: `{}`

Object hash defining namespaces.

### Usage Examples

```js
const gulp = require('gulp');
const rename = require('gulp-rename');
const twig2html = require('gulp-twig2html');

gulp.task('twig2html', () => {
  return gulp.src('src/*.html')
    .pipe(twig2html({
        context: {}, // task specific context object hash
        globals: 'path/to/globals.json'
    }))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('dist'));
});
```

#### Context hierarchy

Template context extends in this order:
* `options.context` if provided
* `options.globals` if provided
* template JSON context files (stored in template path, with same name,
example: `/templates/index.json` for `/templates/index.twig`) if provided

## Contributing
In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code using [ESLint](https://eslint.org/) and [Jest](https://jestjs.io/).

## Sponsored by

[![DesignDepot](https://designdepot.ru/static/core/img/logo.png)](https://designdepot.ru/?utm_source=web&utm_medium=npm&utm_campaign=gulp-twig2html)

## Release History
See the [CHANGELOG](CHANGELOG.md).
