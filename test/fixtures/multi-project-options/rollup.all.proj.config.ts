import typescript from "@plugin/index";

/**
 * Tests if project overrides work for overriding specific project settings.
 */
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