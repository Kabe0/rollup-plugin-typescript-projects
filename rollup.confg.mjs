import typescript from "rollup-typescript-plugin-projects";
import fs from "fs";

let pkg = JSON.parse(fs.readFileSync("package.json"));

const external = Object.keys(pkg.dependencies).concat(['path', 'fs', 'typescript']);

export default {
    input: './src/index.ts',
    plugins: [
        typescript()
    ],
    external,
    output: [
        { format: 'cjs', file: pkg.main, exports: 'auto', sourcemap: true },
        { format: 'esm', file: pkg.module, sourcemap: true },
    ],
}