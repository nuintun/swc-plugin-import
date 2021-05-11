import { ImportSpecifier, ModuleItem, parseSync, Program } from '@swc/core';

function getImported(specifier: ImportSpecifier): string {
  if ('imported' in specifier && specifier.imported) {
    return specifier.imported.value;
  }

  return specifier.local.value;
}

function createImport(imported: string, local: string, source: string): ModuleItem[] {
  const code = `
    import '${source}/es/${imported}/style';
    import ${local} from '${source}/es/${imported}'
  `;

  return parseSync(code).body;
}

export default (program: Program): Program => {
  if (program.type === 'Script') return program;

  program.body = program.body.reduce<ModuleItem[]>((body, item) => {
    if (item.type === 'ImportDeclaration') {
      const source = item.source.value;

      if (source === 'antd') {
        item.specifiers.forEach(specifier => {
          const local = specifier.local.value;
          const imported = getImported(specifier);

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
