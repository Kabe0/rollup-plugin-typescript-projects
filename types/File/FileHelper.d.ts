import { Context, ContextData, ContextDeclaration, ContextDefinition, ContextDestination, ContextPathData, ContextSource, File, ReadOnlyTypescriptDefinitionsFile, TypescriptFile } from "./Definitions";
/**
 * Common Static helper methods used for managing the File object
 * @see File
 */
export declare class FileHelpers {
    /**
     * Helps speed up relational lookup so that the system is not always being pulled to resolve.
     * @private
     */
    private static CachedResolved;
    static IsTypescriptFile(file: File): file is TypescriptFile;
    static IsReadOnlyTypescriptDefinitionFile(file: File): file is ReadOnlyTypescriptDefinitionsFile;
    static IsContextData(context?: ContextPathData<Context>): context is ContextPathData<ContextData>;
    static IsContextData(context?: Context): context is ContextData;
    static IsContextDeclaration(context?: ContextPathData<Context>): context is ContextPathData<ContextDeclaration>;
    static IsContextDeclaration(context?: Context): context is ContextDeclaration;
    static IsContextDestination(context?: ContextPathData<Context>): context is ContextPathData<ContextDestination>;
    static IsContextDestination(context?: Context): context is ContextDestination;
    static IsContextDefinition(context?: ContextPathData<Context>): context is ContextPathData<ContextDefinition>;
    static IsContextDefinition(context?: Context): context is ContextDefinition;
    static IsContextSource(context?: ContextPathData<Context>): context is ContextPathData<ContextSource>;
    static IsContextSource(context?: Context): context is ContextSource;
    /**
     * Due to Windows/Unix pathing, we normalize URLs so that they are easier to compare.
     * @param path
     * @constructor
     */
    static Normalize(path: string): string;
    /**
     * Converts all paths to absolute paths. Will also cache resolved paths.
     * @param path
     * @constructor
     */
    static ResolveNormalize(path: string): string;
}
