import {
    CustomPluginOptions,
    LoadResult,
    NormalizedInputOptions,
    Plugin, PluginContext,
    ResolveIdResult,
    RollupWatcher
} from "rollup";
import FileRepositoryCache, { FileHelpers } from "./FileRepositoryCache";
import SolutionBuilder from "./SolutionBuilder";

/**
 * The Modernizer class is a Plugin for Rollup which allows configuring Typescript Projects inside Rollup flows.
 * The plugin works well with integrations with related to resolve to allow the finding of node_module inclusions.
 *
 * This plugin works by overriding Typescripts build function and passing all files into the Rollup flow using emitFile.
 * This allows other plugins to use Typescript as if it's a src provider, and can then retrieve various resources etc
 * as necessary.
 */
export default class ModernizePlugin implements Plugin
{
    name: string = "Modernise";

    private fileRepository: FileRepositoryCache;
    private solutionBuilder: SolutionBuilder;

    //region Rollup Context
    private _rollupContext:PluginContext | undefined;

    get rollupContext(): PluginContext
    {
        if ( !this._rollupContext ) throw Error( "Rollup Context has not been initialized. Make sure buildStart is run before calling." )
        return this._rollupContext;
    }

    set rollupContext( value: PluginContext | undefined )
    {
        this._rollupContext = value;
    }
    //endregion

    constructor( options: any )
    {
        this.fileRepository = new FileRepositoryCache();
        this.solutionBuilder = new SolutionBuilder( this.fileRepository, {
            newFile: this.verifyEmit.bind(this)
        } );
    }

    public verifyEmit( newFile:any ): void
    {

    }

    //region Rollup Plugin Methods

    /**
     * The Typescript compiler does most of the work here. Theoretically the design will incorporate any files injected by rollup
     * earlier in the process, so that a user could theoretically specify additional folders and files if they wanted to, however
     * they may also completely avoid this too if they so desire.
     * @param options
     */
    async buildStart( options: NormalizedInputOptions ): Promise<void>
    {
        // Create and run the Typescript builder to generate file references
        // this.solutionBuilder = new SolutionBuilder( this.fileRepository );
        this.solutionBuilder.run();

        return undefined;
    }

    /**
     * We will use this to capture additional files that contain .ts extension. This will allow us to further compile things
     * together into a single resource set, however in this case, we just need to keep in mind already
     * @param source
     * @param importer
     * @param options
     */
    async resolveId( source: string, importer: string | undefined, options: { custom?: CustomPluginOptions; isEntry: boolean } ): Promise<ResolveIdResult>
    {
        /**
         * TODO we now have the paths sorted out.
         *  I will have to find out if rollup is going to care about the .ts files being changed to .js files. It could either mean using that relationship tree to handle it,
         *  or adding in relative paths to better handle the final mapping. In any case, I don't want it mapping to
         *  /dest/ in one place, and having rollup output fudge with the final results of the files, especially when being
         *  bundled together.
         *
         *  When I look at the export paths... It seems like the paths are not being converted. That is somewhat good as it means
         *  Rollup will not care where the files are stored. This allows me to keep everything in cache to be compiled by
         *  Rollup. Handling watches may require more work to manage...
         */
        if ( importer ) {
            let declaration = this.fileRepository.findDeclaration( source, importer );
            if ( declaration ) {
                let file = this.fileRepository.getFile( declaration );
                if ( file && FileHelpers.IsTypescriptFile( file ) ) {
                    return `${file.path}`;
                }
            }
        }

        let file = this.fileRepository.getFile( source );
        if ( file && FileHelpers.IsTypescriptFile( file ) ) {
            return `${file.path}`;
        }
        return undefined;
    }

    async load( id: string ): Promise<LoadResult>
    {
        // if ( id.endsWith('.ts') ) {
            let file = this.fileRepository.getFile( id );
            if ( file && FileHelpers.IsOutput( file ) ) {
                return file?.destText;
            }
        // }
        return undefined;
    }

    //endregion
}