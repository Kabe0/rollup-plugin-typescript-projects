import { CustomPluginOptions, LoadResult, NormalizedInputOptions, Plugin, ResolveIdResult } from "rollup";
import { nodeModuleNameResolver, resolveModuleName } from "typescript";
import SolutionBuilder from "./SolutionBuilder";
import FileRepositoryCache from "./FileRepositoryCache";
import ModernizePlugin from "./ModernizePlugin";

/**
 * Fixes binding issues with Rollup to help clean up the business logic.
 * buildStart contains the context of the Rollup instance. So we hook into it there to help the project run cleanly.
 *
 * Any changes made to the ModernizePlugin involving adding rollup plugin methods will have to be added here.
 *
 * @param options
 * @constructor
 */
export default function Modernize( options: any )
{
    const modernize = new ModernizePlugin(options);
    return <Plugin>{
        name: 'Modernize',
        /**
         * We have to wait till buildStart for the context to be created by rollup.
         * @param options
         */
        buildStart: function( options: NormalizedInputOptions ){
            // @ts-ignore
            modernize.rollupContext = this;
            modernize.buildStart(options);
        },
        resolveId: modernize.resolveId.bind(modernize),
        load: modernize.load.bind(modernize)
    };
}