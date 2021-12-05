import { dirname } from "path";
import { Context, ContextPathData, ContextsElement, ContextType, File } from "./Definitions";
import ContextsMap from "./ContextsMap";
import { FileHelpers } from "./FileHelper";

export default class ContextsCollection implements Iterable<ContextsElement>
{
    /**
     * Used to address looking for directories. Does not help with requesting directories that have no registered files,
     * but I don't see that being a problem.
     **/
    private directoryIndex: string[] = [];
    private readonly _files: File[] = [];
    private readonly contextPathMap: Map<string, ContextPathData<Context>> = new Map<string, ContextPathData<Context>>();
    private readonly pathMap: Map<string, ContextsMap> = new Map<string, ContextsMap>();

    public get files(): File[]
    {
        return this._files;
    }

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
     * Used to
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

    public deleteByPath( path: string ): void
    {
        let file = this.pathMap.get( path )?.file;

        if ( !file ) file = this.contextPathMap.get( path )?.file;
        if ( !file ) return undefined;
        this.deleteByFile( file );
    }

    public getContexts( path: string ): ContextsMap | undefined
    {
        return this.pathMap.get( path );
    }

    public getContext<T extends Context>( contextPath: string ): ContextPathData<T> | undefined
    {
        return this.contextPathMap.get( contextPath ) as ContextPathData<T> | undefined;
    }

    public getContextsOfType<T extends Context>( type?: ContextType ): ContextPathData<T>[]
    {
        return Array.from( this.contextPathMap.values() ).filter( contextPath => contextPath.context.type == type ) as ContextPathData<T>[];
    }

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

    public hasFile( path: string ): boolean
    {
        return this.getFile( path ) != undefined;
    }

    public getFile<T extends File>( path: string )
    {
        let file: T = this.getContexts( path )?.file as T;
        if ( !file ) file = this.getContext( path )?.file as T;
        return file;
    }

    /**
     * Look for a specific context inside an absolute path.
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

    /**
     * Checks if a registered directory exists.
     * @param path
     *
     * @see registerDirectory
     */
    public directoryExists( path: string ): boolean
    {
        return this.directoryIndex.includes( path );
    }

    [Symbol.iterator](): Iterator<ContextsElement>
    {
        return this.pathMap[Symbol.iterator]();
    }
}
