import {
    CompilerOptions,
    Diagnostic,
    getOutputFileNames,
    InvalidatedProject,
    InvalidatedProjectKind,
    nodeModuleNameResolver,
    ResolvedModule,
    ResolvedProjectReference,
    SemanticDiagnosticsBuilderProgram,
    SolutionBuilderHostBase,
    sys,
} from "typescript";

import BuildMode from "./BuildMode";
import FileRepositoryCache from "./File/FileRepositoryCache";
import { ContextType, FileTypes } from "./File/Definitions";
import { FileHelpers } from "./File/FileHelper";

interface SolutionBuilderOptions
{
    /**
     * Triggered when SolutionBuilderPlugin starts building. Will also be called on each watch detection.
     * @see SolutionBuilderPlugin.run
     * @see SolutionBuilderPlugin.watch
     */
    onBuilderStarting?: (() => void),
    /**
     * Triggered when SolutionBuilderPlugin has completed building.
     * @see SolutionBuilderPlugin.watch
     */
    onBuilderEnded?: (() => void)
}

/**
 * @see https://github.com/microsoft/TypeScript/blob/master/src/compiler/diagnosticMessages.json
 * @see SolutionBuilderPlugin.watch
 */
enum DiagnosticCode {
    FILE_CHANGE_DETECTED = 6032,
    FOUND_1_ERROR_WATCHING_FOR_FILE_CHANGES = 6193,
    FOUND_N_ERRORS_WATCHING_FOR_FILE_CHANGES = 6194
}

/**
 * Builds a SolutionBuilder with Watch.
 *
 * Overrides the readFile and writeFile in order to trap and change requests and responses made by typescript in order to
 * better incorporate Rollup changes.
 */
export default class SolutionBuilderPlugin
{
    private _buildMode?: BuildMode;
    private _activeProject?: InvalidatedProject<any>;

    private readonly fileRepository: FileRepositoryCache;
    private readonly options: SolutionBuilderOptions;

    //region Getters & Setters

    public get buildMode(): BuildMode
    {
        if ( !this._buildMode ) throw new Error("No BuildMode set. Make sure setMode() is called first before calling.");
        return this._buildMode;
    }

    private set buildMode( value: BuildMode )
    {
        this._buildMode = value;
    }

    public get activeProject(): InvalidatedProject<any>
    {
        if ( !this._activeProject ) throw new Error("No Project set. activeProject must have been called too early.");
        return this._activeProject;
    }

    private set activeProject( value: InvalidatedProject<any> | undefined )
    {
        this._activeProject = value;
    }

    private clearActiveProject()
    {
        this._activeProject = undefined;
    }

    //endregion

    /**
     * Hooks into the read and write executions in order to track files.
     */
    constructor( fileRepository: FileRepositoryCache, options: SolutionBuilderOptions )
    {
        this.fileRepository = fileRepository;
        this.options = options;
    }

    //region Mode Setup methods

    /**
     * Bind's this plugin to an existing SolutionBuilderHost config.
     * @param host
     * @private
     */
    private generateHostHooks( host:SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram> )
    {
        host.directoryExists = this.directoryExists.bind(this);
        host.resolveModuleNames = this.resolveModuleNames.bind( this );
        host.fileExists = this.fileExists.bind( this );
        host.readFile = this.readFile.bind(this);
        host.writeFile = this.writeFile.bind( this );
    }

    /**
     * Used to toggle the running mode for the plugin. If watchMode is set to true, Typescript will begin file watching.
     * @param watchMode
     */
    public setMode( watchMode: boolean )
    {
        this.buildMode = new BuildMode( watchMode, this.generateHostHooks.bind(this), this.watch.bind(this) );
    }

    //endregion

    //region SolutionBuilder Watch Host Override Methods

    /**
     * Overridden to help the SolutionBuilder know if newly created file-folders exists.
     * @param path
     */
    private directoryExists ( path: string ): boolean
    {
        if ( this.fileRepository.hasDirectory( path ) ) return true;
        return sys.directoryExists( path );
    }

    /**
     * Appends submodule relationship data to be used by Rollup for figuring out dependency imports.
     * This function also helps with alias conversions.
     *
     * @param moduleNames
     * @param containingFile
     * @param reusedNames
     * @param redirectedReference
     * @param options
     */
    private resolveModuleNames (moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedModule | undefined)[]
    {
        let list:any = [];
        for( let name of moduleNames ) {
            let result = nodeModuleNameResolver( name, containingFile, options, this.buildMode.host, undefined, redirectedReference ).resolvedModule;
            list.push( result );

            if ( result ) {
                this.fileRepository.registerDeclaration( containingFile, name, {
                    type: ContextType.Declaration,
                    destPath: result.resolvedFileName,
                    extension: result?.extension,
                    packageId: result.packageId,
                    external: result.isExternalLibraryImport
                })
            }
        }
        return list;
    }

    /**
     * Overridden to hook into the FileRepository which will keep temporary files for anything generated by Typescript.
     * @param file
     */
    private fileExists( file: string ): boolean
    {
        // See if our fileRepository is storing the temp dest file.
        if ( this.fileRepository.hasFile( file ) ) return true;
        return sys.fileExists( file );
    }

    /**
     * Appends the latest file changes from the system, or pulls in the latest cached changes for a newly created file.
     * @param path
     * @param encoding
     * @private
     */
    private readFile( path: string, encoding: string | undefined ): string | undefined
    {
        // Retrieve file text if found.
        let text = sys.readFile( path, encoding );
        if ( text ) return text;
        return this.fileRepository.getContextText( path );
    }

    /**
     * Any file written is captured by the FileRepository so that Rollup can handle the digesting of the file later.
     * @param path
     * @param data
     * @param writeByteOrderMark
     * @private
     */
    private writeFile( path: string, data: string, writeByteOrderMark: boolean | undefined ): void
    {
        this.fileRepository.registerTextWithContextPath( path, data );
    }

    //endregion

    /**
     * Each time a file is changed, we need to go through the invalid project list, and let Typescript validate
     * the configurations of those files. Typescript uses a cached build file to help speed up the update process.
     *
     * I currently don't have a better way of processing file changes as I don't know which files typescript has
     * actually changed. If someone knows something inside the API that can be hooked into, it would be optimal to only
     * loop through changed files instead of all files.
     *
     * @private
     * @see watch
     * @see run
     */
    private validateProjects()
    {
        while ( this.activeProject = this.buildMode.solutionBuilder.getNextInvalidatedProject() ) {
            if ( this.activeProject.kind == InvalidatedProjectKind.Build ) {
                // Use the project to track files.
                this.fileRepository.setAndResetProject( this.activeProject.project );

                let files = this.activeProject.getSourceFiles();
                let options = this.activeProject.getCompilerOptions();

                let program = this.activeProject.getProgram();

                for ( let file of files ) {
                    // Skip external and reference files.
                    if ( program?.isSourceFileFromExternalLibrary( file ) || program?.isSourceFileDefaultLibrary(file) ) continue;
                    // Handle re-runs
                    let cacheFile = {
                            kind: file.isDeclarationFile ? FileTypes.TypescriptDefinition : FileTypes.Typescript,
                            compilerOptions: options,
                        fileName: file.fileName,
                        project: this.activeProject.project as string
                    };

                    cacheFile = this.fileRepository.registerSource( file.fileName, file.text, cacheFile );

                    if ( FileHelpers.IsTypescriptFile( cacheFile ) ) {
                        let answer = getOutputFileNames( {
                            options: options,
                            fileNames: [file.fileName],
                            errors: []
                        }, file.fileName, sys.useCaseSensitiveFileNames );

                        if ( answer[0] ) this.fileRepository.registerIncompleteContext( file.fileName, answer[0], { type:ContextType.Destination } );                // Javascript Files
                        if ( answer[1] ) this.fileRepository.registerIncompleteContext( file.fileName, answer[1], { type:ContextType.Definition } );                 // Definition Files
                    }
                }
            }
            this.activeProject.done();
        }

        // Always reset to make sure no stale projects exits in the next loop.
        this.clearActiveProject();
    }

    //region Build Methods

    /**
     * Reads specifically the start and end of project builds.
     * This was pulled from the original rollup typescript plugin.
     *
     * Function run() will also trigger onBuildStarting.
     * @param diagnostic
     * @param newLine
     * @param options
     * @param errorCount
     * @see setMode
     */
    private watch(diagnostic: Diagnostic, newLine: string, options: CompilerOptions, errorCount?: number)
    {
        switch ( diagnostic.code ) {
            case DiagnosticCode.FILE_CHANGE_DETECTED:
                this.options.onBuilderStarting?.();
                this.validateProjects();
                break;
            case DiagnosticCode.FOUND_1_ERROR_WATCHING_FOR_FILE_CHANGES:
                //TODO should handle better.
                this.options.onBuilderEnded?.();
                break;
            case DiagnosticCode.FOUND_N_ERRORS_WATCHING_FOR_FILE_CHANGES:
                this.options.onBuilderEnded?.();
                break;
        }
    }

    /**
     * Should be called when the project is ready to begin. This is always run no matter what BuildMode is being
     * used.
     *
     * Generate the projects
     */
    public run()
    {
        this.options.onBuilderStarting?.();
        this.validateProjects();
        this.buildMode.solutionBuilder.build();
    }

    //endregion
}