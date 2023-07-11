import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from '@rollup/plugin-json';
import dts from "rollup-plugin-dts";
import external from 'rollup-plugin-peer-deps-external';
import pkg from './package.json';

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "lib/esm/index.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "lib/cjs/index.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [
      external(),
      resolve(),
      commonjs(),
      json(),
      typescript(),
    ],
    external: [
      "@ethersproject/bignumber",
      "@sismo-core/hydra-s3",
      ...Object.keys(pkg.devDependencies || {})
    ]
  },
  {
    input: "lib/esm/types/index.d.ts",
    output: [
      {
        file: "lib/index.d.ts", 
        format: "esm" 
      }
    ],
    plugins: [dts.default()],
  }
];