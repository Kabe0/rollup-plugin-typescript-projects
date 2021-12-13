import typescript from "@plugin/index";

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