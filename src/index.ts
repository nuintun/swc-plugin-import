import { name } from '../package.json';
import { ImportSpecifier, ModuleItem, parseSync, Program } from '@swc/core';

const { toString } = Object.prototype;

function isString(value: any): value is string {
  return toString.call(value) === '[object String]';
}

function resolveImported(specifier: ImportSpecifier): string {
  if ('imported' in specifier && specifier.imported) {
    return specifier.imported.value;
  }

  return specifier.local.value;
}

function isMatch(match: string | RegExp, source: string): boolean | never {
  if (isString(match)) return match === source;

  if (match instanceof RegExp) return match.test(source);

  throw new SyntaxError(`[${name}] match must be string or regexp`);
}

function isImports(body: ModuleItem[]): boolean {
  return body.length > 0 && body.every(item => item.type === 'ImportDeclaration');
}

export type Transform = (imported: string, local: string, source: string) => string;

export default (match: string | RegExp, transform: Transform) => {
  const createImport = (imported: string, local: string, source: string): ModuleItem[] | never => {
    const code = transform(imported, local, source);

    if (isString(code)) {
      const { body } = parseSync(code);

      if (isImports(body)) return body;
    }

    throw new SyntaxError(`[${name}] transform must only return import declaration`);
  };

  return (program: Program): Program => {
    if (program.type === 'Script') return program;

    program.body = program.body.reduce<ModuleItem[]>((body, item) => {
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
