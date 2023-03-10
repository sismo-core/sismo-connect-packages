import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from '@rollup/plugin-json';
import dts from "rollup-plugin-dts";

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
      resolve(),
      commonjs(),
      json(),
      typescript(),
    ],
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