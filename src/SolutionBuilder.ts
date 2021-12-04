import {
    CompilerOptions,
    createSemanticDiagnosticsBuilderProgram,
    createSolutionBuilderWithWatch,
    createSolutionBuilderWithWatchHost,
    Diagnostic,
    getOutputFileNames,
    InvalidatedProject,
    InvalidatedProjectKind,
    isImportDeclaration,
    nodeModuleNameResolver, ResolvedModule, ResolvedProjectReference,
    sys,
} from "typescript";
import FileRepositoryCache, {
    File,
    FileTypes,
    FileHelpers,
    TypescriptDefinitionFile,
    TypescriptFile, Declaration
} from "./FileRepositoryCache";
import * as path from "path";

interface SolutionBuilderOptions
{
    newFile: ( newFile: any ) => void
}

/**
 * Builds a SolutionBuilder with Watch.
 *
 * Overrides the readFile and writeFile in order to trap and change requests and responses made by typescript in order to
 * better incorporate Rollup changes.
 */
export default class SolutionBuilder
{
    private readonly host;
    private readonly solutionBuilder;
    private readonly fileRepository: FileRepositoryCache;
    private readonly options: SolutionBuilderOptions;

    private _activeProject: InvalidatedProject<any> | undefined = undefined;

    get activeProject(): InvalidatedProject<any> | undefined
    {
        return this._activeProject;
    }

    set activeProject( value: InvalidatedProject<any> | undefined )
    {
        this._activeProject = value;
    }

    private clearActiveProject()
    {
        this._activeProject = undefined;
    }

    /**
     * Hooks into the read and write executions in order to track files.
     */
    constructor( fileRepository: FileRepositoryCache, options: SolutionBuilderOptions )
    {
        this.fileRepository = fileRepository;
        this.options = options;

        const host = createSolutionBuilderWithWatchHost(
            sys,
            createSemanticDiagnosticsBuilderProgram,
            undefined,
            undefined,
            this.watch.bind(this)
        );

        host.fileExists = this.fileExists.bind( this );
        host.readFile = this.readFile.bind(this);
        host.writeFile = this.writeFile.bind( this );
        host.resolveModuleNames = this.resolveModuleNames.bind( this );
        // host.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, options1) =>
        // {
        //     console.log(moduleNames, containingFile, reusedNames, redirectedReference, options1);
        //
        //     let list:any = [];
        //     for( let name of moduleNames ) {
        //         list.push( nodeModuleNameResolver( name, containingFile, options1, host, undefined, redirectedReference ).resolvedModule );
        //     }
        //
        //     return list;
        // }
        //TODO check file directory exists so I don't go crazy.
        host.directoryExists = path => {
            if ( '/home/ian@ad.bizzonedns.com/Documents/Rollup/Project/build/packages/package1' == path ) return true;
            if ( '/home/ian@ad.bizzonedns.com/Documents/Rollup/Project/build/packages/package2' == path ) return true;
            if ( '/home/ian@ad.bizzonedns.com/Documents/Rollup/Project/build/packages/package3' == path ) return true;
            return sys.directoryExists( path );
        }

        host.realpath = function ( path: string ): string {
            let path2: string;
            if ( sys.realpath ) {
                path2 = sys.realpath( path );
                return path2;
            }
            return path;
        }

        this.host = host;

        this.solutionBuilder = createSolutionBuilderWithWatch(
            host,
            [ process.cwd() ],    //TODO this needs to be a config override.
            {}
        );
    }

    public resolveModuleNames (moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedModule | undefined)[]
    {
        let list:any = [];
        let declarations:Declaration[] = [];
        for( let name of moduleNames ) {
            let result = nodeModuleNameResolver( name, containingFile, options, this.host, undefined, redirectedReference ).resolvedModule;
            list.push( result );

            if ( result ) {
                declarations.push( <Declaration>{
                    path: name,
                    destPath: result.resolvedFileName,
                    extension: result?.extension,
                    packageId: result.packageId
                });
            }
        }

        this.fileRepository.registerDeclarations( containingFile, declarations );
        return list;
    }

    public fileExists( file: string ): boolean
    {
        // See if our fileRepository is storing the temp dest file.
        if ( this.fileRepository.hasFile( file ) ) return true;
        if ( this.fileRepository.hasDestFile( file ) ) return true;
        if ( this.fileRepository.hasDefFile( file ) ) return true;
        return sys.fileExists( file );
    }

    private readFile( path: string, encoding: string | undefined ): string | undefined
    {
        if ( this.fileRepository.hasFile( path ) ) {
            return this.fileRepository.getFile( path )?.text;
        }

        if ( this.fileRepository.hasDestFile( path ) ) {
            return this.fileRepository.getDestFile( path )?.destText;
        }

        if ( this.fileRepository.hasDefFile( path ) ) {
            return this.fileRepository.getDefFile( path )?.defText;
        }

        // Register the path, and normalize the result to an absolute path.
        FileRepositoryCache.ResolveNormalize( path );

        // this.fileRepository.index( path );
        let content = sys.readFile( path, encoding );
        if ( content ) {
            //TODO detect our tsconfig.json from typescript. Detect all TS file as well. This is the moment to digest what we want.
            // Alternatively, the last step in validateAll could handle this.
            // this.fileRepository.register( path, content );
        }
        return content;
    }

    private writeFile( path: string, data: string, writeByteOrderMark: boolean | undefined ): void
    {
        let file = this.fileRepository.registerOutput( path, data );
        if ( file && this.options.newFile ) this.options.newFile( file );
    }

    private validateProjects()
    {
        while ( this.activeProject = this.solutionBuilder.getNextInvalidatedProject() ) {
            if ( this.activeProject.kind == InvalidatedProjectKind.Build ) {

                let files = this.activeProject.getSourceFiles();
                let options = this.activeProject.getCompilerOptions();
                let directory = this.activeProject.getCurrentDirectory();

                let pwd = options.baseUrl ? options.baseUrl : this.activeProject.getCurrentDirectory();

                for ( let file of files ) {
                    // let parse = path.parse(file.fileName);

                    let cacheFile: File = {
                        name: path.basename(file.fileName),
                        path: file.fileName,
                        kind: file.isDeclarationFile ? FileTypes.TypescriptDefinition : FileTypes.Typescript,
                        output: !file.isDeclarationFile,
                        text: file.text
                    };

                    if ( FileHelpers.IsTypescriptFile( cacheFile ) ) {
                        let answer = getOutputFileNames( {
                            options: options,
                            fileNames: [file.fileName],// fileNames: this.fileRepository.getSourceKeys(),
                            errors: []
                        }, file.fileName, sys.useCaseSensitiveFileNames );

                        // for( let statement of file.statements ) {
                        //     if ( isImportDeclaration( statement ) ) {
                        //         let text = statement.moduleSpecifier.getFullText()
                        //         let text2 = statement.moduleSpecifier.getText()
                        //         let check2 = nodeModuleNameResolver( JSON.parse(statement.moduleSpecifier.getText()), file.fileName, options, this.host );
                        //         console.log(check2);
                        //     }
                        // }

                        if ( answer[0] ) cacheFile.destPath = answer[0];                // Javascript Files
                        if ( answer[1] ) cacheFile.defPath = answer[1];                 // Definition Files
                    }

                    else if ( FileHelpers.IsTypescriptDefinitionFile( cacheFile ) ) {


                    }

                    this.fileRepository.register( cacheFile );
                }
            }
            this.activeProject.done();
        }

        // Always reset to make sure no stale projects exits in the next loop.
        this.clearActiveProject();
    }

    //region Build Methods
    public watch(diagnostic: Diagnostic, newLine: string, options: CompilerOptions, errorCount?: number)
    {
        this.validateProjects();
    }

    /**
     * Generate the projects
     */
    public run()
    {
        this.validateProjects();
        this.solutionBuilder.build();
    }

    //endregion
}