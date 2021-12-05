import {
    ChangeEvent,
    CustomPluginOptions,
    LoadResult,
    NormalizedInputOptions,
    Plugin,
    PluginContext,
    ResolveIdResult
} from "rollup";
import SolutionBuilderPlugin from "./SolutionBuilderPlugin";
import { relative } from "path";
import Watch from "./Watch";
import FileRepositoryCache from "./File/FileRepositoryCache";
import { FileHelpers } from "./File/FileHelper";

export interface TypescriptPluginOptions
{
    /**
     * Can be toggled on to force all files to be loaded into the TypescriptPlugin, even if it's not included as the
     * src file in Rollup.
     * @see TypescriptPlugin.buildStart
     */
    includeUnusedFiles: boolean;
}

/**
 * The Typescript class is a Plugin for Rollup which allows configuring Typescript Projects inside Rollup flows.
 * The plugin works well with integrations with related to resolve to allow the finding of node_module inclusions.
 *
 * This plugin works by overriding Typescripts build function and passing all files into the Rollup flow using emitFile.
 * This allows other plugins to use Typescript as if it's a src provider, and can then retrieve various resources
 * as necessary.
 */
export default class TypescriptPlugin implements Plugin
{
    /**
     * Required for the Plugin interface to not throw a hissey fit.
     */
    public name: string = "Typescript";
    private pluginOptions: TypescriptPluginOptions;
    private readonly fileRepository: FileRepositoryCache;
    private readonly solutionBuilder: SolutionBuilderPlugin;
    private readonly watch: Watch;

    //region Rollup Context
    private _rollupContext: PluginContext | undefined;

    public get rollupContext(): PluginContext
    {
        if ( !this._rollupContext ) throw Error( "Rollup Context has not been initialized. Make sure buildStart is run before calling." )
        return this._rollupContext;
    }

    public set rollupContext( value: PluginContext | undefined )
    {
        this._rollupContext = value;
    }

    //endregion

    constructor( options: TypescriptPluginOptions = <TypescriptPluginOptions>{} )
    {
        this.pluginOptions = options;
        this.fileRepository = new FileRepositoryCache();
        this.watch = new Watch();

        this.solutionBuilder = new SolutionBuilderPlugin( this.fileRepository, {
            // Passing in SolutionBuilderWatch details
            onBuilderStarting: this.watch.typescriptStarted.bind( this.watch ),
            onBuilderEnded: this.watch.typescriptEnded.bind( this.watch )
        } );
    }

    //region Rollup Plugin Methods

    /**
     * Initializes the {@see SolutionBuilderPlugin.setMode} for toggling on/off the file-watch functionality.
     *
     * If {@see TypescriptPluginOptions.includeUnusedFiles} is set, the project will emit all files found by Typescript
     * so that Rollup will include everything in the bundle.
     *
     * @param options
     */
    public buildStart( options: NormalizedInputOptions ): void
    {
        this.solutionBuilder.setMode( this.rollupContext.meta.watchMode );

        // Run the Typescript builder to generate file's and references
        this.fileRepository.resetConsumed();
        this.solutionBuilder.run();

        if ( this.pluginOptions.includeUnusedFiles ) {
            for ( let contextPath of this.fileRepository.getContextDestinations() ) {
                let file = contextPath.file;
                let baseDir = file.compilerOptions.rootDir;

                //TODO Cannot handle outputting by file at the moment.
                if ( !baseDir ) throw new Error( `TypeScript config outDir not set. Rollup does not know where to output.` );

                this.rollupContext.emitFile( {
                    type: 'chunk',
                    id: relative( baseDir, contextPath.path ),
                    preserveSignature: "allow-extension"
                } );
            }
        }
    }

    /**
     * Used to start the watcher which will stop {@see load} from starting before typescript is ready.
     * @param id
     * @param change
     */
    public watchChange( id: string, change: { event: ChangeEvent } ): void
    {
        this.fileRepository.resetConsumed();
        this.watch.rollupWatchTriggered();
    }

    /**
     * Triggers on any requests from our TypeScript file cache to manually process. Also converts typescript specific
     * module requests to real file conversions. This also resolves TypeScript Alias's.
     * @param source
     * @param importer
     * @param options
     */
    public async resolveId( source: string, importer: string | undefined, options: { custom?: CustomPluginOptions; isEntry: boolean } ): Promise<ResolveIdResult>
    {
        if ( importer ) {
            let declaration = this.fileRepository.getDeclarationContext( FileHelpers.ResolveNormalize( importer ), source );
            if ( declaration ) {
                // Only process internal declarations
                if ( !declaration.context.external ) {
                    this.fileRepository.consume( declaration.context.destPath );
                    return `${declaration.context.destPath}`;
                }
            }
        }

        let sourceContext = this.fileRepository.getSourceContext( FileHelpers.ResolveNormalize( source ) );
        if ( sourceContext && FileHelpers.IsTypescriptFile( sourceContext.file ) ) {
            this.fileRepository.consume( sourceContext.contextPath );
            return `${sourceContext.contextPath}`;
        }
        return undefined;
    }

    /**
     * Resolves any of the TypeScript files that were triggered in resolveId, pulling in the output data for that file
     * to be further processed by Rollup.
     * @param id
     */
    public async load( id: string ): Promise<LoadResult>
    {
        await this.watch.rollupWait();
        let destinationContent = this.fileRepository.getDestinationFromPath( id );

        // We only handle output files, ignoring all other filetypes.
        if ( destinationContent ) {
            return destinationContent?.context.text;
        }
        return undefined;
    }

    /**
     * Build out any consumed Definition files if Typescript config's set to do so.
     */
    public async buildEnd()
    {
        for ( let path of this.fileRepository.getConsumedPaths() ) {
            let contextPath = this.fileRepository.getDefinitionFromPath( path );

            // Skip if no definition file found.
            if ( !contextPath ) return;

            let baseDir = contextPath.file.compilerOptions.outDir;

            //TODO Cannot handle outputting by file at the moment.
            if ( !baseDir ) throw new Error( `TypeScript config rootDir not set. Rollup does not know where to output.` );

            this.rollupContext.emitFile( {
                type: 'asset',
                fileName: relative( baseDir, contextPath.contextPath ),
                source: contextPath.context.text
            } );
        }
    }

    //endregion
}