import { Plugin } from "rollup";
import { TypescriptPluginOptions } from "./TypescriptPlugin";
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
export default function typescript(options?: TypescriptPluginOptions): Plugin;
