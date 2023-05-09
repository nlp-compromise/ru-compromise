import terser from '@rollup/plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const opts = {
  keep_classnames: true,
  module: true,
}

export default [
  // === Main ==
  {
    input: 'src/index.js',
    output: [{ file: 'builds/ru-compromise.cjs', format: 'umd', name: 'ruCompromise' }],
    plugins: [nodeResolve()],
  },
  {
    input: 'src/index.js',
    output: [{ file: 'builds/ru-compromise.min.js', format: 'umd', name: 'ruCompromise' }],
    plugins: [nodeResolve(), terser(opts)],
  },
  {
    input: 'src/index.js',
    output: [{ file: 'builds/ru-compromise.mjs', format: 'esm' }],
    plugins: [nodeResolve(), terser(opts)],
  }

]
