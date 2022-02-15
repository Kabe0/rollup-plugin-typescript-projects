import { Context, ContextDeclaration, ContextDefinition, ContextDestination, ContextPathData, ContextSource, File } from "./Definitions";
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
export default class FileRepositoryCache {
    /**
     * Used to track which files have been consumed by Rollup which we may want to use to build definition files.
     * @private
     */
    private consumedIndex;
    /**
     * Used to track the project a file belongs to.
     * @private
     */
    protected projectFilesMap: Map<string, File[]>;
    private _activeProject?;
    private readonly contextsCollection;
    /**
     * Configures the active project and clears any existing files in that project if applicable.
     * @param project
     */
    setAndResetProject(project: string): void;
    /**
     * Reset an existing project.
     * @param project
     */
    clearProject(project: string): void;
    /**
     * Pushing a new file to the currently active project.
     * If no active project set, this function will not index the file.
     * @param file
     */
    protected addActiveProjectFile(file: File): void;
    get activeProject(): string | undefined;
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
    registerSource(path: string, text: string, file: File): File;
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
    registerDeclaration(path: string, contextPath: string, context: ContextDeclaration): void;
    /**
     * Can be used to register a basic Context, which will typically used for
     * incomplete ContextDefinitions and ContextsDestinations
     * @param path
     * @param contextPath
     * @param context
     */
    registerIncompleteContext(path: string, contextPath: string, context: Context): void;
    /**
     * If a Context Destination or Context Definition is found, the text content for its context will be set.
     * @param contextPath
     * @param text
     */
    registerTextWithContextPath(contextPath: string, text: string): void;
    /**
     * Used to clear the currently consumed project files.
     */
    resetConsumed(): void;
    consume(path: string): void;
    getConsumedPaths(): string[];
    /**
     * {@inheritDoc ContextCollection.hasFile}
     * @param path
     */
    hasFile(path: string): Boolean;
    /**
     * {@inheritDoc ContextCollection.getFile}
     * @param path
     */
    getFile(path: string): File;
    getContextSources(): ContextPathData<ContextSource>[];
    getContextDestinations(): ContextPathData<ContextDestination>[];
    getContextDefinitions(): ContextPathData<ContextDefinition>[];
    getSourceContext(path: string): ContextPathData<ContextSource> | undefined;
    getDestinationFromPath(path: string): ContextPathData<ContextDestination> | undefined;
    getDefinitionFromPath(path: string): ContextPathData<ContextDefinition> | undefined;
    getDeclarationContext(path: string, contextPath: string): ContextPathData<ContextDeclaration> | undefined;
    /**
     * Returns the text for a context if it's of type ContextData.
     * @param path
     */
    getContextText(path: string): string | undefined;
    /**
     * @inheritDoc {FileContext.ContextsCollection.directoryExists}
     */
    hasDirectory(path: string): boolean;
}
