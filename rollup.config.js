import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js'
    },
    {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      exports: 'named',
      entryFileNames: '[name].esm.js',
      chunkFileNames: '[name]-[hash].esm.js'
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      preferBuiltins: false
    }),
    commonjs(),
    typescript({ 
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      rootDir: './src'
    }),
    postcss({
      extensions: ['.css'],
      minimize: true,
      inject: true,
      extract: false
    })
  ],
  external: [
    'react',
    'react-dom',
    'devextreme',
    'devextreme-react',
    /^devextreme\//,
    /^devextreme-react\//,
    'file-saver',
    'exceljs',
    'jspdf',
    'i18next',
    'react/jsx-runtime'
  ]
};