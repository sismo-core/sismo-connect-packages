import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.esm.ts",
    output: [
      {
        file: "lib/esm/index.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
    external: ['react']
  },
  {
    input: "src/index.cjs.ts",
    output: [
      {
        file: "lib/cjs/index.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
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