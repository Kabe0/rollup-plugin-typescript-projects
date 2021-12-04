import { win32, posix } from "path";
import { resolve } from "path";

export enum FileTypes
{
    Typescript,
    TypescriptDefinition
}

export interface Declaration
{
    path: string;
    destPath: string;
    extension: string;
    external: boolean;
    packageId?: { name: string, subModuleName: string, version: string }
}

export interface File
{
    name: string;
    path: string;
    kind: FileTypes;
    output: boolean;
    text: string;
}

export interface OutputFile extends File
{
    destPath: string;
    destText: string;
    readonly output: true;
}

export interface TypescriptDefinitionFile extends File
{
    readonly kind: FileTypes.TypescriptDefinition;
    readonly output: false;
    destPath: string;
}

export interface TypescriptFile extends OutputFile
{
    readonly kind: FileTypes.Typescript;

    declarations: Declaration[];
    defPath: string;
    defText: string;
}

export class FileHelpers
{
    static IsTypescriptFile( file: File ): file is TypescriptFile
    {
        return file.kind == FileTypes.Typescript;
    }

    static IsTypescriptDefinitionFile( file: File ): file is TypescriptDefinitionFile
    {
        return file.kind == FileTypes.TypescriptDefinition;
    }
    
    static IsOutput( file: File ): file is OutputFile
    {
        return file.output;
    }
}

export default class FileRepositoryCache
{
    private indexes:Map<string, string> = new Map<string, string>();
    private sourceFiles:Map<string, string> = new Map<string, string>();
    private destFiles:Map<string, string> = new Map<string, string>();
    private relationships:Map<string, string[]> = new Map<string, string[]>();

    private pathMap:Map<string, File> = new Map<string, File>();
    private destMap:Map<string, OutputFile> = new Map<string, OutputFile>();
    private defMap:Map<string, TypescriptFile> = new Map<string, TypescriptFile>();
    private declarationMap:Map<string, Map<string,Declaration>> = new  Map<string, Map<string,Declaration>>();

    private static CachedResolved:Map<string, string> = new Map<string, string>();

    /**
     * Due to Windows/Unix pathing, we normalize URL's so that they are easier to compare.
     * @param filePath
     * @constructor
     */
    public static NormalizePath( filePath: string ): string
    {
        return filePath.split( win32.sep ).join( posix.sep );
    }

    /**
     * Converts all paths to absolute paths. Will also cache resolved paths.
     * @param filePath
     * @constructor
     */
    public static ResolveNormalize( filePath: string ): string
    {
        let resolved = FileRepositoryCache.CachedResolved.get( filePath );
        if ( resolved ) return resolved;
        else {
            resolved = resolve( FileRepositoryCache.NormalizePath( filePath ) );
            FileRepositoryCache.CachedResolved.set( filePath, resolved );
        }
        return resolved;
    }

    /**
     * Preserve requests made.
     * @param fileName
     */
    public index( fileName: string )
    {
        FileRepositoryCache.ResolveNormalize( fileName );
    }

    public register( file: File ): void
    {
        let path = FileRepositoryCache.ResolveNormalize( file.path );
        this.pathMap.set( path, file );
        if ( FileHelpers.IsOutput( file ) ) {
            this.destMap.set( file.destPath, file );
        }
        if ( FileHelpers.IsTypescriptFile( file ) ) {
            this.defMap.set( file.defPath, file );
        }
    }

    public registerOutput( path: string, output: string ): File | undefined
    {
        path = FileRepositoryCache.ResolveNormalize( path );

        // See if it's an output file
        let file = this.destMap.get( path );
        if ( file && FileHelpers.IsOutput(file) ) {
            file.destText = output;
            return file;
        }

        // See if it's a definition file
        file = this.defMap.get( path );
        if ( file && FileHelpers.IsTypescriptFile(file) ) {
            file.defText = output;
            return file;
        }
    }

    public registerDeclarations( path: string, declarations: Declaration[] )
    {
        path = FileRepositoryCache.ResolveNormalize( path );
        this.declarationMap.set( path, new Map( declarations.map( value => { return [ value.path, value ] }) ) );
        // let map2 = new Map<any, any>([...map123]);
        // this.declarationMap.set( path, map );
        // let file = this.getFile( path );
        // if ( file && FileHelpers.IsTypescriptFile( file ) ) {
        //     file.declarations = declarations;
        // }
    }

    public findDeclaration( path: string, declarationPath: string ): string | undefined
    {
        let fileDeclaration = this.declarationMap.get( declarationPath );
        if ( fileDeclaration && fileDeclaration.has(path) ) {
            return fileDeclaration.get(path)?.destPath;
        }
        return undefined;
    }

    public findDeclarationByDest( path: string, declarationPath: string ): string | undefined
    {
        let file = this.getDestFile( declarationPath );
        if ( file ) {
            return this.findDeclaration( path, file.path );
        }
        return undefined;
    }

    public hasFile( path: string ): boolean
    {
        path = FileRepositoryCache.ResolveNormalize( path );
        return this.pathMap.has( path );
    }

    public getFile( path: string ): File | undefined
    {
        path = FileRepositoryCache.ResolveNormalize( path );
        return this.pathMap.get( path );
    }

    public hasDestFile( path: string ): boolean
    {
        path = FileRepositoryCache.ResolveNormalize( path );
        return this.destMap.has( path );
    }

    public getDestFile( path: string ): OutputFile | undefined
    {
        path = FileRepositoryCache.ResolveNormalize( path );
        return this.destMap.get(path);
    }

    public hasDefFile( path: string ): boolean
    {
        return this.defMap.has( path );
    }

    public getDefFile( path: string ): TypescriptFile | undefined
    {
        return this.defMap.get( path );
    }


}