const typescript = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const dts = require('rollup-plugin-dts');

const packageJson = require('./package.json');

module.exports = [
  // CommonJS build --------------------------------------------------
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      entryFileNames: '[name].js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    plugins: [
      resolve({ preferBuiltins: false, browser: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.ts'],
        declaration: true,
        declarationDir: 'dist/types',
        compilerOptions: { outDir: 'dist' }
      }),
    ],
    external: ['axios', 'node-localstorage'],
  },

  // ESM build --------------------------------------------------------
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      entryFileNames: '[name].mjs',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
    plugins: [
      resolve({ preferBuiltins: false, browser: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/__tests__/**', '**/*.test.ts'],
        declaration: false,
        compilerOptions: { 
          outDir: 'dist/esm',
          declaration: false,
          declarationDir: undefined 
        }
      }),
    ],
    external: ['axios', 'node-localstorage'],
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts.default ? dts.default() : dts()],
  },
];