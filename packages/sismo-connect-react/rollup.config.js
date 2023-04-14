import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import postcss from 'rollup-plugin-postcss';
import dts from "rollup-plugin-dts";
import external from 'rollup-plugin-peer-deps-external';
import packageJson from './package.json';

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      }
    ],
    plugins: [
      external(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss(),
    ],
    external: [
      "viem",
      "js-base64",
      "pako"
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
    external: [/\.css$/],
    plugins: [
      dts.default()
    ],
  }
];