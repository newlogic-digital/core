'use strict';

const Twig = require('twig');
const fs = require('fs');
const { merge } = require('lodash');

function hasFile (filePath) {
    return fs.existsSync(filePath);
}

function readJSON (filePath) {
    let result = null;

    if (hasFile(filePath)) {
        const rawData = fs.readFileSync(filePath);
        result = JSON.parse(rawData);
    }

    return result;
}

module.exports = class TwigRenderer {
    constructor (options) {
        this.params = merge({
            globals: '',
            extensions: [],
            functions: {},
            filters: {},
            context: {},
            namespaces: {}
        }, options);

        let genericContext = this.params.context || {};

        if (this.params.globals && typeof this.params.globals === 'string') {
            genericContext = merge(genericContext, readJSON(this.params.globals));
        }

        this.genericContext = genericContext;
    }

    render (filePath) {
        Twig.cache(false);

        if (!Array.isArray(this.params.extensions)) {
            throw new TypeError('\'extensions\' needs to be an array of functions!');
        }

        this.params.extensions.forEach(function (fn) {
            Twig.extend(fn);
        });

        Object.keys(this.params.functions).forEach(name => {
            const fn = this.params.functions[name];
            if (typeof fn !== 'function') {
                throw new TypeError(`${name} needs to be a function!`);
            }
            Twig.extendFunction(name, fn);
        });

        Object.keys(this.params.filters).forEach(name => {
            const fn = this.params.filters[name];
            if (typeof fn !== 'function') {
                throw new TypeError(`${name} needs to be a function!`);
            }
            Twig.extendFilter(name, fn);
        });

        return new Promise((resolve, reject) => {
            const templatePath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
            const templateFile = filePath.substr(filePath.lastIndexOf('/') + 1);
            const templateName = templateFile.substr(0, templateFile.lastIndexOf('.')) || templateFile;
            const templateContextFile = `${templatePath}${templateName}.json`;
            const context = merge({}, this.genericContext, readJSON(templateContextFile));

            if (hasFile(filePath)) {
                const output = Twig.twig({
                    async: false,
                    data: this.params.data,
                    path: filePath,
                    namespaces: this.params.namespaces
                }).render(context);

                resolve(output);
            } else {
                reject(new TypeError(`Could not find file '${filePath}'`));
            }
        });
    }
};
