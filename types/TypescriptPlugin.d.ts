import { ChangeEvent, CustomPluginOptions, LoadResult, NormalizedInputOptions, Plugin, PluginContext, ResolveIdResult } from "rollup";
import { ProjectOptions } from "./SolutionBuilderConfigProcessor";
import { ResolvedConfig } from "vite";
export interface TypescriptPluginOptions {
    /**
     * {@see ProjectOptions}
     */
    compilerOptions?: ProjectOptions;
    /**
     * {@see SolutionBuilderOptions.projects}
     */
    projects?: {
        [key: string]: ProjectOptions;
    };
    /**
     * Can be toggled on to force all files to be loaded into the TypescriptPlugin, even if it's not included as the
     * src file in Rollup.
     * @see TypescriptPlugin.buildStart
     */
    includeUnusedFiles?: boolean;
}
/**
 * The Typescript class is a Plugin for Rollup which allows configuring Typescript Projects inside Rollup flows.
 * The plugin works well with integrations with related to resolve to allow the finding of node_module inclusions.
 *
 * This plugin works by overriding Typescripts build function and passing all files into the Rollup flow using emitFile.
 * This allows other plugins to use Typescript as if it's a src provider, and can then retrieve various resources
 * as necessary.
 */
export default class TypescriptPlugin implements Plugin {
    /**
     * Required for the Plugin interface to not throw a hissey fit.
     */
    name: string;
    private pluginOptions;
    private readonly fileRepository;
    private readonly solutionBuilder;
    private readonly watch;
    private _viteConfig;
    get viteConfig(): ResolvedConfig | undefined;
    private _rollupContext;
    get rollupContext(): PluginContext;
    set rollupContext(value: PluginContext | undefined);
    constructor(options?: TypescriptPluginOptions);
    configResolved(config: ResolvedConfig): void;
    /**
     * Initializes the {@see SolutionBuilderPlugin.setMode} for toggling on/off the file-watch functionality.
     *
     * If {@see TypescriptPluginOptions.includeUnusedFiles} is set, the project will emit all files found by Typescript
     * so that Rollup will include everything in the bundle.
     *
     * @param options
     */
    buildStart(options: NormalizedInputOptions): void;
    /**
     * Used to start the watcher which will stop {@see load} from starting before typescript is ready.
     * @param id
     * @param change
     */
    watchChange(id: string, change: {
        event: ChangeEvent;
    }): void;
    /**
     * Triggers on any requests from our TypeScript file cache to manually process. Also converts typescript specific
     * module requests to real file conversions. This also resolves TypeScript Alias's.
     * @param source
     * @param importer
     * @param options
     */
    resolveId(source: string, importer: string | undefined, options: {
        custom?: CustomPluginOptions;
        isEntry: boolean;
    }): Promise<ResolveIdResult>;
    /**
     * Resolves any of the TypeScript files that were triggered in resolveId, pulling in the output data for that file
     * to be further processed by Rollup.
     * @param id
     */
    load(id: string): Promise<LoadResult>;
    /**
     * Build out any consumed Definition files if Typescript config's set to do so.
     */
    buildEnd(): Promise<void>;
}
