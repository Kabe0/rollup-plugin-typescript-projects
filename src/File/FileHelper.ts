import { posix, resolve, win32 } from "path";
import {
    Context, ContextData, ContextDeclaration, ContextDefinition, ContextDestination,
    ContextPathData, ContextSource, ContextSourceMap, ContextType,
    File,
    FileTypes,
    ReadOnlyTypescriptDefinitionsFile,
    TypescriptFile
} from "./Definitions";

/**
 * Common Static helper methods used for managing the File object
 * @see File
 */
export class FileHelpers
{
    /**
     * Helps speed up relational lookup so that the system is not always being pulled to resolve.
     * @private
     */
    private static CachedResolved: Map<string, string> = new Map<string, string>();

    //region stringMethods
    public static RetrieveContextFromPath( path:string ): Context
    {
        if ( path.endsWith(".js") ) return { type:ContextType.Destination }
        if ( path.endsWith(".js.map") ) return { type:ContextType.SourceMap }
        if ( path.endsWith(".d.ts") ) return { type:ContextType.Definition }
        throw Error(`Unreconginized path ${path}`);
    }

    //region File Methods

    public static IsTypescriptFile( file: File ): file is TypescriptFile
    {
        return file.kind == FileTypes.Typescript;
    }

    public static IsReadOnlyTypescriptDefinitionFile( file: File ): file is ReadOnlyTypescriptDefinitionsFile
    {
        return file.kind == FileTypes.TypescriptDefinition;
    }

    //endregion

    //region Context methods

    public static IsContextData( context?: ContextPathData<Context> ): context is ContextPathData<ContextData>
    public static IsContextData( context?: Context ): context is ContextData
    public static IsContextData( context?: any ): context is ContextData
    {
        if ( !context ) return false;
        if ( context?.context ) return ( "text" in context.context )
        return ( "text" in context );
    }

    public static IsContextDeclaration( context?: ContextPathData<Context> ): context is ContextPathData<ContextDeclaration>
    public static IsContextDeclaration( context?: Context ): context is ContextDeclaration
    public static IsContextDeclaration( context?: any ): context is ContextDeclaration
    {
        if ( context?.context ) return context.context.type == ContextType.Declaration;
        return context?.type == ContextType.Declaration;
    }

    public static IsContextDestination( context?: ContextPathData<Context> ): context is ContextPathData<ContextDestination>
    public static IsContextDestination( context?: Context ): context is ContextDestination
    public static IsContextDestination( context?: any ): context is ContextDestination
    {
        if ( context?.context ) return context.context.type == ContextType.Destination;
        return context?.type == ContextType.Destination;
    }

    public static IsContextDefinition( context?: ContextPathData<Context> ): context is ContextPathData<ContextDefinition>
    public static IsContextDefinition( context?: Context ): context is ContextDefinition
    public static IsContextDefinition( context?: any ): context is ContextDefinition
    {
        if ( context?.context ) return context.context.type == ContextType.Definition;
        return context?.type == ContextType.Definition;
    }

    public static IsContextSourceMap( context?: ContextPathData<Context> ): context is ContextPathData<ContextSourceMap>
    public static IsContextSourceMap( context?: Context ): context is ContextDefinition
    public static IsContextSourceMap( context?: any ): context is ContextDefinition
    {
        if ( context?.context ) return context.context.type == ContextType.SourceMap;
        return context?.type == ContextType.SourceMap;
    }

    public static IsContextSource( context?: ContextPathData<Context> ): context is ContextPathData<ContextSource>
    public static IsContextSource( context?: Context ): context is ContextSource
    public static IsContextSource( context?: any ): context is ContextSource
    {
        if ( context?.context ) return context.context.type == ContextType.Source;
        return context?.type == ContextType.Source;
    }

    //endregion

    //region Path Methods
    /**
     * Due to Windows/Unix pathing, we normalize URLs so that they are easier to compare.
     * @param path
     * @constructor
     */
    public static Normalize( path: string ): string
    {
        return path.split( win32.sep ).join( posix.sep );
    }

    /**
     * Converts all paths to absolute paths. Will also cache resolved paths.
     * @param path
     * @constructor
     */
    public static ResolveNormalize( path: string ): string
    {
        let resolved = this.CachedResolved.get( path );
        if ( resolved ) return resolved;
        else {
            resolved = resolve( this.Normalize( path ) );
            this.CachedResolved.set( path, resolved );
        }
        return resolved;
    }
    //endregion
}