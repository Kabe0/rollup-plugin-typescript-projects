import { dirname } from "path";
import { Context, ContextPathData, ContextsElement, ContextType, File } from "./Definitions";
import ContextsMap from "./ContextsMap";
import { FileHelpers } from "./FileHelper";

/**
 * The ContextCollection handles processing new context and files within a global project scope.
 * It can help to index directories and also remove stale contexts as changes are applied.
 *
 * {@see FileRepositoryCache} for more information on how to use this class.
 */
export default class ContextsCollection implements Iterable<ContextsElement>
{
    /**
     * Used to address looking for directories. Does not help with requesting directories that have no registered files,
     * but I don't see that being a problem.
     * @private
     **/
    private directoryIndex: string[] = [];
    /**
     * Tracks all source files in the collection.
     * @private
     */
    private readonly _files: File[] = [];
    /**
     * contextPath represents reverse mappings for direct resources such as Definitions, and Destinations
     * @private
     */
    private readonly contextPathMap: Map<string, ContextPathData<Context>> = new Map<string, ContextPathData<Context>>();
    /**
     * Provides a map for all source path contexts
     * @private
     */
    private readonly pathMap: Map<string, ContextsMap> = new Map<string, ContextsMap>();

    /**
     * Returns a list of the current files.
     */
    public get files(): File[]
    {
        return this._files;
    }

    //region Register Methods

    /**
     * Handles assigning new context's to a file.
     * @param path          The source path of the original file being processed.
     * @param contextPath   The context path for the resource being appended
     * @param context       Data related to the context path such as content
     * @param file          Source File metadata such as the filetype.
     */
    public assign( path: string, contextPath: string, context: Context, file?: File ): File
    {
        let contexts = this.pathMap.get( path );

        // Create a new one if one is not already set.
        if ( !contexts ) {
            contexts = new ContextsMap( file ? file : this.getFile( path ) );
            this.pathMap.set( path, contexts );

            // Assign a new file to the list if not already there.
            if ( !this._files.includes( contexts.file ) ) this._files.push( contexts.file );
            this.registerDirectory( dirname( path ) );
        }
        // Append to the existing file if set.
        else if ( file ) {
            Object.assign( contexts.file, file );
        }

        // Append to the existing object, or create a new one.
        let existing = contexts.contexts.get( contextPath );
        if ( existing ) {
            Object.assign( existing, context );
        } else {
            // IsContextDeclaration are ignored as they have paths that can only be resolved with the known source path.

            if ( !FileHelpers.IsContextDeclaration( context ) ) {
                let existingPathMap = this.contextPathMap.get( contextPath );
                // Typescript files override any definition file declarations.
                if ( !existingPathMap || FileHelpers.IsTypescriptFile( contexts.file ) ) {
                    this.contextPathMap.set( contextPath, {
                        path: path,
                        contextPath: contextPath,
                        context: context,
                        file: contexts.file
                    } );
                }
            }

            contexts.contexts.set( contextPath, context );
            this.registerDirectory( dirname( contextPath ) );
        }

        return contexts.file;
    }

    /**
     * Helps track directories inside the FileRepository. Currently, we don't support
     * recursion through cached directories.
     * @param path
     * @private
     *
     * @see registerFile
     * @see registerOutput
     */
    private registerDirectory( path: string ): void
    {
        if ( !this.directoryIndex.includes( path ) ) this.directoryIndex.push( path );
    }

    //endregion

    // region Remove Actions

    /**
     * Used to clear out files within a project
     * @param file
     */
    public deleteByFile( file: File ): void
    {
        let index = this._files.indexOf( file );
        if ( index !== -1 ) this._files.splice( index, 1 );

        for ( let [ key, value ] of this.contextPathMap ) {
            if ( value.file === file ) this.contextPathMap.delete( key );
        }

        for ( let [ key, value ] of this.pathMap ) {
            if ( value.file === file ) {
                value.contexts.clear();
                this.pathMap.delete( key );
            }
        }
    }

    /**
     * Uses the file path to retrieve a file, and remove all related contexts.
     * @param path
     * @see deleteByFile
     */
    public deleteByPath( path: string ): void
    {
        let file = this.pathMap.get( path )?.file;

        if ( !file ) file = this.contextPathMap.get( path )?.file;
        if ( !file ) return undefined;
        this.deleteByFile( file );
    }

    //endregion

    //region Get Methods

    /**
     * Retrieves all contexts that match the given source path
     * @param path
     */
    public getContexts( path: string ): ContextsMap | undefined
    {
        return this.pathMap.get( path );
    }

    /**
     * Retrieves the relatable ContextPathData for a path as long as it's a ContextDestination, ContextDefinition, or ContextSource
     *
     * ContextDeclaration are not searchable here as their paths are often relative. Use {@see getContextFromPath} instead.
     * @param contextPath
     */
    public getContext<T extends Context>( contextPath: string ): ContextPathData<T> | undefined
    {
        return this.contextPathMap.get( contextPath ) as ContextPathData<T> | undefined;
    }

    /**
     * Returns all the contexts of a given type from the contextMap.
     *
     * ContextDeclarations are not available with this method. Use {@see getContextsOfTypePath} instead.
     * @param type
     */
    public getContextsOfType<T extends Context>( type?: ContextType ): ContextPathData<T>[]
    {
        return Array.from( this.contextPathMap.values() ).filter( contextPath => contextPath.context.type == type ) as ContextPathData<T>[];
    }

    /**
     * Retrieves the first result of a given Context type.
     *
     * Not recommended for ContextDeclarations as there will be more than one. Use {@see getContextsOfTypePath} instead.
     * @param path
     * @param type
     */
    public getFirstContextsOfTypePath<T extends Context>( path: string, type: ContextType ): ContextPathData<T> | undefined
    {
        let results = this.pathMap.get(path);
        if ( results == undefined ) return undefined;

        return Array.from( results.contexts.entries() ).filter( ([ , context ]) => context.type == type ).map( ([key, context]) => <ContextPathData<T>>{
            path: path,
            contextPath: key,
            context: context,
            file: results?.file
        }).shift();
    }

    /**
     * Provides a list of all related contexts within a given path.
     * @param path
     * @param type
     */
    public getContextsOfTypePath<T extends Context>( path: string, type?: ContextType ): ContextPathData<T>[]
    {
        let results = this.pathMap.get(path);
        if ( results == undefined ) return [];

        return Array.from( results.contexts.entries() ).filter( ([ , context ]) => context.type == type ).map( ([key, context]) => <ContextPathData<T>>{
            path: path,
            contextPath: key,
            context: context,
            file: results?.file
        });
    }

    /**
     * @see getFile
     * @param path
     */
    public hasFile( path: string ): boolean
    {
        return this.getFile( path ) != undefined;
    }

    /**
     * Provides the results of a path by first checking if it's a source path, or a context path.
     * @param path
     */
    public getFile<T extends File>( path: string )
    {
        let file: T = this.getContexts( path )?.file as T;
        if ( !file ) file = this.getContext( path )?.file as T;
        return file;
    }

    /**
     * Look for a specific context inside the source contexts object.
     * @param path
     * @param contextPath
     */
    public getContextFromPath<T extends Context>( path: string, contextPath: string ): ContextPathData<T> | undefined
    {
        let contexts = this.pathMap.get( path );
        if ( !contexts ) return;

        let context = contexts.contexts.get( contextPath );
        if ( !context ) return;

        return <ContextPathData<T>>{ context: context, file: contexts.file, contextPath: contextPath, path: path };
    }

    /**
     * Checks if a registered directory exists.
     * @param path
     *
     * @see registerDirectory
     */
    public hasDirectory( path: string ): boolean
    {
        return this.directoryIndex.includes( path );
    }

    //endregion

    [Symbol.iterator](): Iterator<ContextsElement>
    {
        return this.pathMap[Symbol.iterator]();
    }
}
