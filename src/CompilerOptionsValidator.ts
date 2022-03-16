import { NormalizedInputOptions, NormalizedOutputOptions, PluginContext } from "rollup";
import { CompilerOptions } from "typescript";


export default class CompilerOptionsValidator
{
    public static IsInputValid( context: PluginContext, options: NormalizedInputOptions, compilerOptionsList: Map<string,CompilerOptions> )
    {
        //TODO throw exceptions or warnings here if any problems found.
    }

    public static IsOutputValid( context: PluginContext, options: NormalizedOutputOptions, compilerOptionsList: Map<string,CompilerOptions> )
    {
        //TODO throw exceptions or warnings here if any problems found.
        for( let [path, config] of compilerOptionsList ) {
            if ( Boolean( options.sourcemap ) != config.sourceMap ) context.warn(`${path} does not have the flag sourceMap enabled. Unexpected behaviour may occure.`);
        }
    }
}
