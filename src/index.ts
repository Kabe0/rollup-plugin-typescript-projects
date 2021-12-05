import { NormalizedInputOptions, Plugin } from "rollup";
import TypescriptPlugin, { TypescriptPluginOptions } from "./TypescriptPlugin";

/**
 * Fixes binding issues with Rollup to help clean up the business logic.
 * buildStart contains the context of the Rollup instance. So we hook into it there to help the project run cleanly.
 *
 * This was done as a compatibility layer due to Rollup not having the option to run a config as a function, such as
 * export default () => { return { //rollup-config } };
 *
 * Any changes made to the TypescriptPlugin involving adding rollup plugin methods will have to be added here.
 *
 * @param options
 * @constructor
 */
export default function typescript( options: TypescriptPluginOptions = <TypescriptPluginOptions>{} )
{
    const typescriptPlugin = new TypescriptPlugin(options);
    return <Plugin>{
        name: typescriptPlugin.name,
        /**
         * We have to wait till buildStart for the context to be created by rollup.
         * @param options
         */
        buildStart: function( options: NormalizedInputOptions ){
            // @ts-ignore
            typescriptPlugin.rollupContext = this;
            typescriptPlugin.buildStart(options);
        },
        resolveId: typescriptPlugin.resolveId.bind(typescriptPlugin),
        load: typescriptPlugin.load.bind(typescriptPlugin),
        buildEnd: typescriptPlugin.buildEnd.bind(typescriptPlugin),
        watchChange: typescriptPlugin.watchChange.bind(typescriptPlugin)
    };
}