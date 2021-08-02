define("package", [], {
    "name": "swc-plugin-import",
    "version": "0.0.0",
    "description": "Component modular import plugin for swc.",
    "main": "index.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "repository": {
        "type": "git",
        "url": "git+https://github.com/nuintun/swc-plugin-import.git"
    },
    "keywords": [
        "antd",
        "swc-plugin"
    ],
    "author": "nuintun",
    "license": "MIT",
    "bugs": {
        "url": "https://github.com/nuintun/swc-plugin-import/issues"
    },
    "homepage": "https://github.com/nuintun/swc-plugin-import#readme",
    "dependencies": {
        "@swc/core": "^1.2.70"
    },
    "devDependencies": {
        "typescript": "^4.3.5"
    }
});
define("src/index", ["require", "exports", "package", "@swc/core"], function (require, exports, package_json_1, core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const { toString } = Object.prototype;
    function isString(value) {
        return toString.call(value) === '[object String]';
    }
    function isMatch(match, source) {
        if (isString(match))
            return match === source;
        if (match instanceof RegExp)
            return match.test(source);
        throw new SyntaxError(`[${package_json_1.name}] match must be string or regexp`);
    }
    function resolveImported(specifier) {
        if ('imported' in specifier && specifier.imported) {
            return specifier.imported.value;
        }
        return specifier.local.value;
    }
    exports.default = (match, transform) => {
        const createImport = (imported, local, source) => {
            const code = transform(imported, local, source);
            if (isString(code)) {
                const { body } = core_1.parseSync(code);
                if (body.length && body.every(item => item.type === 'ImportDeclaration')) {
                    return body;
                }
            }
            throw new SyntaxError(`[${package_json_1.name}] transform must be returned import declaration only`);
        };
        return (program) => {
            if (program.type === 'Script')
                return program;
            program.body = program.body.reduce((body, item) => {
                if (item.type === 'ImportDeclaration') {
                    const source = item.source.value;
                    if (isMatch(match, source)) {
                        item.specifiers.forEach(specifier => {
                            const local = specifier.local.value;
                            const imported = resolveImported(specifier);
                            body.push(...createImport(imported, local, source));
                        });
                        return body;
                    }
                }
                body.push(item);
                return body;
            }, []);
            return program;
        };
    };
});
