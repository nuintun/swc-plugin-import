import { Module, ModuleItem, parseSync, Script } from '@swc/core';

function createImport(alias: string, module: string, library: string) {
  const code = `
    import '${library}/es/style';
    impport ${alias || module} from '${library}/es/${module}'
  `;

  return parseSync(code).body;
}

export default (program: Module | Script) => {
  if (program.type === 'Script') return program;

  program.body = program.body.reduce<ModuleItem[]>((body, item) => {
    if (item.type === 'ImportDeclaration') {
      const library = item.source.value;

      if (library === 'antd') {
        item.specifiers.forEach(specifier => {
          const alias = specifier.local.value;
          const module = (specifier as any).imported ? (specifier as any).imported.value : alias;

          body.push(...createImport(alias, module, library));
        });

        return body;
      }
    }

    body.push(item);

    return body;
  }, []);

  return program;
};
