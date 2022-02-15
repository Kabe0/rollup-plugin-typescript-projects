import { Context, ContextPathData, ContextsElement, ContextType, File } from "./Definitions";
import ContextsMap from "./ContextsMap";
/**
 * The ContextCollection handles processing new context and files within a global project scope.
 * It can help to index directories and also remove stale contexts as changes are applied.
 *
 * {@see FileRepositoryCache} for more information on how to use this class.
 */
export default class ContextsCollection implements Iterable<ContextsElement> {
    /**
     * Used to address looking for directories. Does not help with requesting directories that have no registered files,
     * but I don't see that being a problem.
     * @private
     **/
    private directoryIndex;
    /**
     * Tracks all source files in the collection.
     * @private
     */
    private readonly _files;
    /**
     * contextPath represents reverse mappings for direct resources such as Definitions, and Destinations
     * @private
     */
    private readonly contextPathMap;
    /**
     * Provides a map for all source path contexts
     * @private
     */
    private readonly pathMap;
    /**
     * Returns a list of the current files.
     */
    get files(): File[];
    /**
     * Handles assigning new context's to a file.
     * @param path          The source path of the original file being processed.
     * @param contextPath   The context path for the resource being appended
     * @param context       Data related to the context path such as content
     * @param file          Source File metadata such as the filetype.
     */
    assign(path: string, contextPath: string, context: Context, file?: File): File;
    /**
     * Helps track directories inside the FileRepository. Currently, we don't support
     * recursion through cached directories.
     * @param path
     * @private
     *
     * @see registerFile
     * @see registerOutput
     */
    private registerDirectory;
    /**
     * Used to clear out files within a project
     * @param file
     */
    deleteByFile(file: File): void;
    /**
     * Uses the file path to retrieve a file, and remove all related contexts.
     * @param path
     * @see deleteByFile
     */
    deleteByPath(path: string): void;
    /**
     * Retrieves all contexts that match the given source path
     * @param path
     */
    getContexts(path: string): ContextsMap | undefined;
    /**
     * Retrieves the relatable ContextPathData for a path as long as it's a ContextDestination, ContextDefinition, or ContextSource
     *
     * ContextDeclaration are not searchable here as their paths are often relative. Use {@see getContextFromPath} instead.
     * @param contextPath
     */
    getContext<T extends Context>(contextPath: string): ContextPathData<T> | undefined;
    /**
     * Returns all the contexts of a given type from the contextMap.
     *
     * ContextDeclarations are not available with this method. Use {@see getContextsOfTypePath} instead.
     * @param type
     */
    getContextsOfType<T extends Context>(type?: ContextType): ContextPathData<T>[];
    /**
     * Retrieves the first result of a given Context type.
     *
     * Not recommended for ContextDeclarations as there will be more than one. Use {@see getContextsOfTypePath} instead.
     * @param path
     * @param type
     */
    getFirstContextsOfTypePath<T extends Context>(path: string, type: ContextType): ContextPathData<T> | undefined;
    /**
     * Provides a list of all related contexts within a given path.
     * @param path
     * @param type
     */
    getContextsOfTypePath<T extends Context>(path: string, type?: ContextType): ContextPathData<T>[];
    /**
     * @see getFile
     * @param path
     */
    hasFile(path: string): boolean;
    /**
     * Provides the results of a path by first checking if it's a source path, or a context path.
     * @param path
     */
    getFile<T extends File>(path: string): T;
    /**
     * Look for a specific context inside the source contexts object.
     * @param path
     * @param contextPath
     */
    getContextFromPath<T extends Context>(path: string, contextPath: string): ContextPathData<T> | undefined;
    /**
     * Checks if a registered directory exists.
     * @param path
     *
     * @see registerDirectory
     */
    hasDirectory(path: string): boolean;
    [Symbol.iterator](): Iterator<ContextsElement>;
}
