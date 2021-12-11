import typescript from "@plugin/index";

export default {
    input: './src/index.ts',
    preserveModules: true,
    plugins: [
        typescript({
            includeUnusedFiles: true,
            compilerOptions: {
                removeComments: false
            },
            projects: {
                "./tsconfig.json": {
                    removeComments: true
                }
            }
        }),
        // css({output: "vendor.css"}),
        // commonjs(),
        // nodePolyfills(),
        // nodeResolve({ preferBuiltins: false })
    ]
}