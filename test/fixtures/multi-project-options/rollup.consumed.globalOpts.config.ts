import typescript from "@plugin/index";

/**
 * Tests if the compilerOptions actually overrides the default typescript settings.
 */
export default {
    input: './src/index.ts',
    plugins: [
        typescript({
            compilerOptions: {
                removeComments: true
            },
        }),
    ]
}