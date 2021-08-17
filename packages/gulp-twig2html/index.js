'use strict';

const TwigRenderer = require('../twig-renderer/twig-renderer.js');
const through = require('through2');
const PluginError = require('plugin-error');

const PLUGIN_NAME = 'gulp-twig2html';

module.exports = params => {
    const twigRenderer = new TwigRenderer(params);

    return through.obj(function (file, enc, callback) {
        if (file.isNull()) {
            callback(null, file);
            return;
        }

        if (file.isStream()) {
            throw new PluginError(PLUGIN_NAME, 'Streaming not supported');
        } else {
            twigRenderer.render(file.path).then(html => {
                file.contents = Buffer.from(html);
                this.push(file);
                callback();
            }).catch(error => {
                throw new PluginError(PLUGIN_NAME, error.message);
            });
        }
    });
};
