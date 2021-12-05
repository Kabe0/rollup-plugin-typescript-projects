import {
    Context,
    ContextData,
    ContextDeclaration,
    ContextDefinition,
    ContextDestination,
    ContextPathData,
    ContextSource,
    ContextType,
    File
} from "./Definitions";
import ContextsCollection from "./ContextsCollection";
import { FileHelpers } from "./FileHelper";

/**
 * Handles tracking, consuming of files inside Typescript.
 *
 * The FileRepository is broken up into the following path relationships...
 *
 * - path           Represents the source path (absolute path) used by all files
 * - destinations   Captured output path for a Typescript file.
 * - definitions    Captured output path for a Typescript file's definition.
 * - declarations   Captured declarations found within a Typescript file by source path.
 *
 * All the maps aside from declarations share the same File's. The details are built up over multiple stages inside
 * the SolutionBuilderPlugin.
 *
 * @see {SolutionBuilderPlugin.validateProjects}    Generates File definitions without any declaration or destinations.
 * @see {SolutionBuilderPlugin.writeFile}           Generates the destinations and definition text information
 * @see {SolutionBuilderPlugin.resolveModuleNames}  Generates the declaration relationships
 *
 * @see SolutionBuilderPlugin
 * @see TypescriptPlugin
 */
export default class FileRepositoryCache
{
    /**
     * Used to track which files have been consumed by Rollup which we may want to use to build definition files.
     * @private
     */
    private consumedIndex: string[] = [];
    /**
     * Used to track the project a file belongs to.
     * @private
     */
    protected projectFilesMap: Map<string,File[]> = new Map<string, File[]>();

    private _activeProject?:string;

    private readonly contextsCollection: ContextsCollection = new ContextsCollection();

    //region Project Methods

    /**
     * Configures the active project and clears any existing files in that project if applicable.
     * @param project
     */
    public setAndResetProject( project: string )
    {
        this.clearProject( project );
        this._activeProject = project;
    }

    /**
     * Reset an existing project.
     * @param project
     */
    public clearProject( project: string ): void
    {
        let files = this.projectFilesMap.get( project );
        if ( !files ) return;

        for( let file of files ) {
            this.contextsCollection.deleteByFile( file );
        }
        this.projectFilesMap.delete( project );
        this.projectFilesMap.set( project, [] );
    }

    /**
     * Pushing a new file to the currently active project.
     * If no active project set, this function will not index the file.
     * @param file
     */
    protected addActiveProjectFile( file: File )
    {
        if ( !this._activeProject ) return;
        let project = this.projectFilesMap.get(this._activeProject);

        if ( !project ) {
            project = [];
            this.projectFilesMap.set( this._activeProject, project );
        }
        if ( !project.includes( file ) ) project.push( file );
    }

    public get activeProject(): string | undefined
    {
        return this._activeProject;
    }

    //endregion

    //region File Registration Methods

    /**
     * Generates the specifications for a File, TypescriptFile, or ReadOnlyTypescriptDefinitionsFile.
     * This function will not register any output information by default. Call registerOutput() to set.
     *
     * @param path
     * @param text
     * @param file
     *
     * @see SolutionBuilderPlugin.resolveModuleNames
     * @see registerOutput
     */
    public registerSource( path: string, text: string, file: File ): File
    {
        let contextFile = this.contextsCollection.assign( path, path, <ContextData>{ type: ContextType.Source, text: text }, file );
        this.addActiveProjectFile( contextFile );
        return contextFile;
    }

    /**
     * Resolved the absolute destination path to determine if it's for a definition or destination file.
     * This allows FileHelper.IsDestinationSet or FileHelper.IsDefinitionSet to become true.
     *
     * @param path
     * @param contextPath
     * @param context
     *
     * @see SolutionBuilderPlugin.writeFile
     */
    public registerDeclaration( path: string, contextPath: string, context: ContextDeclaration )
    {
        this.contextsCollection.assign( path, contextPath, context );
    }

    /**
     * Can be used to register a basic Context, which will typically used for
     * incomplete ContextDefinitions and ContextsDestinations
     * @param path
     * @param contextPath
     * @param context
     */
    public registerIncompleteContext( path: string, contextPath: string, context: Context )
    {
        this.contextsCollection.assign( path, contextPath, context );
    }

    /**
     * If a Context Destination or Context Definition is found, the text content for its context will be set.
     * @param contextPath
     * @param text
     */
    public registerTextWithContextPath( contextPath: string, text: string )
    {
        let contextPathObject = this.contextsCollection.getContext<ContextData>( contextPath );

        if ( FileHelpers.IsContextDestination( contextPathObject ) || FileHelpers.IsContextDefinition( contextPathObject ) ) {
            contextPathObject.context.text = text;
        }
    }

    //endregion

    //region Consumption Methods

    /**
     * Used to clear the currently consumed project files.
     */
    public resetConsumed(): void
    {
        this.consumedIndex.length = 0;
    }

    public consume( path: string )
    {
        path = FileHelpers.ResolveNormalize( path );
        if ( !this.consumedIndex.includes( path ) ) this.consumedIndex.push( path );
    }

    public getConsumedPaths()
    {
        return this.consumedIndex;
    }

    //endregion

    //region General File search Methods

    public hasFile( path: string ): Boolean
    {
        return this.contextsCollection.hasFile( path );
    }

    public getFile( path: string ): File
    {
        return this.contextsCollection.getFile( path );
    }

    public getContextSources(): ContextPathData<ContextSource>[]
    {
        return this.contextsCollection.getContextsOfType<ContextSource>( ContextType.Source );
    }

    public getContextDestinations(): ContextPathData<ContextDestination>[]
    {
        return this.contextsCollection.getContextsOfType<ContextDestination>( ContextType.Destination );
    }

    public getContextDefinitions(): ContextPathData<ContextDefinition>[]
    {
        return this.contextsCollection.getContextsOfType<ContextDefinition>( ContextType.Definition );
    }

    public getSourceContext( path: string ): ContextPathData<ContextSource> | undefined
    {
        let context = this.contextsCollection.getContext( path );
        if ( FileHelpers.IsContextSource( context ) ) return context;
        return undefined;
    }

    public getDestinationFromPath( path: string ): ContextPathData<ContextDestination> | undefined
    {
        return this.contextsCollection.getFirstContextsOfTypePath<ContextDestination>( path, ContextType.Destination );
    }

    public getDefinitionFromPath( path: string ): ContextPathData<ContextDefinition> | undefined
    {
        return this.contextsCollection.getFirstContextsOfTypePath<ContextDefinition>( path, ContextType.Definition );
    }

    public getDeclarationContext( path: string, contextPath: string ): ContextPathData<ContextDeclaration> | undefined
    {
        let context = this.contextsCollection.getContextFromPath( path, contextPath );
        if ( FileHelpers.IsContextDeclaration( context ) ) return context;
        return undefined;
    }

    public getContextText( path: string ): string | undefined
    {
        let contextPath = this.contextsCollection.getContext( path );
        if ( FileHelpers.IsContextData( contextPath ) ) return contextPath.context.text;
    }

    /**
     * @inheritDoc {FileContext.ContextsCollection.directoryExists}
     */
    public hasDirectory( path: string ): boolean
    {
        return this.contextsCollection.directoryExists( path );
    }

    //endregion
}