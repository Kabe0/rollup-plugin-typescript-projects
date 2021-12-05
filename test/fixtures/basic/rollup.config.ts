import typescript from "@plugin/index";

export default {
    input: './main.ts',
    // output: {
    //     dir: './build/main',
    //     format: 'esm',
    //     preserveModules: true,
    //     preserveModulesRoot: '',
    //     sourcemap: true,
    // },
    plugins: [
        typescript({
            includeUnusedFiles: true
        }),
        // css({output: "vendor.css"}),
        // commonjs(),
        // nodePolyfills(),
        // nodeResolve({ preferBuiltins: false })
    ]
};