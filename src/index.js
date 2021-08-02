"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = require("../package.json");
const core_1 = require("@swc/core");
const { toString } = Object.prototype;
function isString(value) {
    return toString.call(value) === '[object String]';
}
function resolveImported(specifier) {
    if ('imported' in specifier && specifier.imported) {
        return specifier.imported.value;
    }
    return specifier.local.value;
}
function isMatch(match, source) {
    if (isString(match))
        return match === source;
    if (match instanceof RegExp)
        return match.test(source);
    throw new SyntaxError(`[${package_json_1.name}] match must be string or regexp`);
}
function isImports(body) {
    return body.length > 0 && body.every(item => item.type === 'ImportDeclaration');
}
exports.default = (match, transform) => {
    const createImport = (imported, local, source) => {
        const code = transform(imported, local, source);
        if (isString(code)) {
            const { body } = core_1.parseSync(code);
            if (isImports(body))
                return body;
        }
        throw new SyntaxError(`[${package_json_1.name}] transform must only return import declaration`);
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
